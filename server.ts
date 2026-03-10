import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("voting.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS polls (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'general',
    title TEXT NOT NULL,
    questions TEXT NOT NULL,
    teams TEXT NOT NULL,
    status TEXT DEFAULT 'setup',
    joinCode TEXT,
    registrationCode TEXT,
    deadline INTEGER,
    createdAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pollId TEXT NOT NULL,
    questionId TEXT NOT NULL,
    teamId TEXT,
    optionIndex INTEGER NOT NULL,
    userId TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (pollId) REFERENCES polls(id)
  );
  CREATE TABLE IF NOT EXISTS missions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    teamCount INTEGER NOT NULL,
    cards TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    joinCode TEXT,
    createdAt INTEGER NOT NULL,
    closedAt INTEGER
  );
`);

try {
  db.prepare("ALTER TABLE missions ADD COLUMN closedAt INTEGER").run();
} catch (e) {
  // Column already exists
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    maxHttpBufferSize: 1e8, // 100MB for media uploads
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/polls", (req, res) => {
    const polls = db.prepare("SELECT id, title, type, status, joinCode, registrationCode FROM polls WHERE status != 'closed' ORDER BY createdAt DESC").all();
    res.json(polls);
  });

  app.get("/api/polls/:id", (req, res) => {
    const poll = db.prepare("SELECT * FROM polls WHERE id = ?").get(req.params.id) as any;
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    
    const votes = db.prepare("SELECT questionId, teamId, optionIndex, COUNT(*) as count FROM votes WHERE pollId = ? GROUP BY questionId, teamId, optionIndex").all(req.params.id) as any[];
    
    res.json({
      ...poll,
      questions: JSON.parse(poll.questions),
      teams: JSON.parse(poll.teams),
      results: votes
    });
  });

  app.get("/api/missions", (req, res) => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60 * 1000);
    const missions = db.prepare(`
      SELECT id, title, teamCount, status, (joinCode IS NOT NULL) as hasPassword 
      FROM missions 
      WHERE status != 'closed' OR (status = 'closed' AND closedAt > ?)
      ORDER BY createdAt DESC
    `).all(threeDaysAgo);
    res.json(missions);
  });

  app.get("/api/missions/:id", (req, res) => {
    const mission = db.prepare("SELECT * FROM missions WHERE id = ?").get(req.params.id) as any;
    if (!mission) return res.status(404).json({ error: "Mission not found" });
    
    res.json({
      ...mission,
      cards: JSON.parse(mission.cards)
    });
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-poll", (pollId) => {
      socket.join(pollId);
      
      const votes = db.prepare("SELECT questionId, teamId, optionIndex, COUNT(*) as count FROM votes WHERE pollId = ? GROUP BY questionId, teamId, optionIndex").all(pollId) as any[];
      socket.emit("results-update", votes);
    });

    socket.on("create-poll", (pollData) => {
      const { id, type, title, questions, teams, joinCode, registrationCode, deadline } = pollData;
      db.prepare("INSERT INTO polls (id, type, title, questions, teams, joinCode, registrationCode, deadline, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, type || 'general', title, JSON.stringify(questions), JSON.stringify(teams || []), joinCode, registrationCode, deadline, Date.now());
      console.log("Poll created:", id, type);
    });

    socket.on("create-mission", (missionData) => {
      const { id, title, teamCount, cards, joinCode } = missionData;
      db.prepare("INSERT INTO missions (id, title, teamCount, cards, joinCode, createdAt) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, title, teamCount, JSON.stringify(cards), joinCode || null, Date.now());
      console.log("Mission created:", id);
    });

    socket.on("join-mission", (missionId) => {
      socket.join(missionId);
    });

    socket.on("assign-mission-card", (data) => {
      const { missionId, cardId, teamName, password } = data;
      const mission = db.prepare("SELECT cards FROM missions WHERE id = ?").get(missionId) as any;
      if (mission) {
        const cards = JSON.parse(mission.cards);
        const cardIndex = cards.findIndex((c: any) => c.id === cardId);
        if (cardIndex !== -1 && cards[cardIndex].status === "available") {
          cards[cardIndex].teamName = teamName;
          cards[cardIndex].password = password; // Store card password
          cards[cardIndex].status = "assigned";
          db.prepare("UPDATE missions SET cards = ? WHERE id = ?").run(JSON.stringify(cards), missionId);
          io.to(missionId).emit("mission-updated", { cards });
        }
      }
    });

    socket.on("submit-mission-result", (data) => {
      const { missionId, cardId, result, media, password } = data;
      const mission = db.prepare("SELECT cards FROM missions WHERE id = ?").get(missionId) as any;
      if (mission) {
        const cards = JSON.parse(mission.cards);
        const cardIndex = cards.findIndex((c: any) => c.id === cardId);
        if (cardIndex !== -1) {
          // Verify password if it exists
          if (cards[cardIndex].password && cards[cardIndex].password !== password) {
            socket.emit("mission-error", { message: "Invalid card password" });
            return;
          }
          cards[cardIndex].result = result;
          cards[cardIndex].media = media; // Store media attachments
          cards[cardIndex].status = "completed";
          db.prepare("UPDATE missions SET cards = ? WHERE id = ?").run(JSON.stringify(cards), missionId);
          io.to(missionId).emit("mission-updated", { cards });
        }
      }
    });

    socket.on("update-mission-status", (data) => {
      const { missionId, status } = data;
      const closedAt = status === "closed" ? Date.now() : null;
      if (status === "closed") {
        db.prepare("UPDATE missions SET status = ?, closedAt = ? WHERE id = ?").run(status, closedAt, missionId);
      } else {
        db.prepare("UPDATE missions SET status = ? WHERE id = ?").run(status, missionId);
      }
      io.to(missionId).emit("mission-updated", { status, closedAt });
    });

    socket.on("register-team", (data) => {
      const { pollId, teamName, media } = data;
      const poll = db.prepare("SELECT teams FROM polls WHERE id = ?").get(pollId) as any;
      if (poll) {
        const teams = JSON.parse(poll.teams);
        const newTeam = {
          id: Math.random().toString(36).substring(2, 8),
          name: teamName,
          media: media || []
        };
        teams.push(newTeam);
        db.prepare("UPDATE polls SET teams = ? WHERE id = ?").run(JSON.stringify(teams), pollId);
        io.to(pollId).emit("poll-updated", { teams });
      }
    });

    socket.on("update-team-media", (data) => {
      const { pollId, teamId, media } = data;
      const poll = db.prepare("SELECT teams FROM polls WHERE id = ?").get(pollId) as any;
      if (poll) {
        const teams = JSON.parse(poll.teams);
        const teamIndex = teams.findIndex((t: any) => t.id === teamId);
        if (teamIndex !== -1) {
          teams[teamIndex].media = media;
          db.prepare("UPDATE polls SET teams = ? WHERE id = ?").run(JSON.stringify(teams), pollId);
          io.to(pollId).emit("poll-updated", { teams });
        }
      }
    });

    socket.on("update-poll-status", (data) => {
      const { pollId, status } = data;
      db.prepare("UPDATE polls SET status = ? WHERE id = ?").run(status, pollId);
      io.to(pollId).emit("poll-updated", { status });
    });

    socket.on("update-poll-questions", (data) => {
      const { pollId, questions } = data;
      db.prepare("UPDATE polls SET questions = ? WHERE id = ?").run(JSON.stringify(questions), pollId);
      io.to(pollId).emit("poll-updated", { questions });
    });

    socket.on("vote", (voteData) => {
      const { pollId, responses, userId } = voteData;
      
      const transaction = db.transaction(() => {
        for (const resp of responses) {
          const { questionId, teamId, optionIndex } = resp;
          
          const existingVote = db.prepare("SELECT id FROM votes WHERE pollId = ? AND questionId = ? AND (teamId = ? OR (teamId IS NULL AND ? IS NULL)) AND userId = ?")
            .get(pollId, questionId, teamId, teamId, userId);
          
          if (existingVote) {
            db.prepare("UPDATE votes SET optionIndex = ?, createdAt = ? WHERE id = ?")
              .run(optionIndex, Date.now(), existingVote.id);
          } else {
            db.prepare("INSERT INTO votes (pollId, questionId, teamId, optionIndex, userId, createdAt) VALUES (?, ?, ?, ?, ?, ?)")
              .run(pollId, questionId, teamId, optionIndex, userId, Date.now());
          }
        }
      });
      
      transaction();

      const votes = db.prepare("SELECT questionId, teamId, optionIndex, COUNT(*) as count FROM votes WHERE pollId = ? GROUP BY questionId, teamId, optionIndex").all(pollId) as any[];
      io.to(pollId).emit("results-update", votes);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
