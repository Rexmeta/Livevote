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
  DROP TABLE IF EXISTS votes;
  DROP TABLE IF EXISTS polls;

  CREATE TABLE polls (
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
  CREATE TABLE votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pollId TEXT NOT NULL,
    questionId TEXT NOT NULL,
    teamId TEXT,
    optionIndex INTEGER NOT NULL,
    userId TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (pollId) REFERENCES polls(id)
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
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
