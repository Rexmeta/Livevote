import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // Whiteboard state
  let whiteboardState = {
    notes: [] as any[],
    groups: [] as any[]
  };

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.data.userName = socket.handshake.query.userName;
    
    // Send initial state
    socket.emit("init", whiteboardState);

    socket.on("note:created", (note) => {
      whiteboardState.notes.push(note);
      socket.broadcast.emit("note:created", note);
    });

    socket.on("note:moved", ({ id, x, y }) => {
      const note = whiteboardState.notes.find(n => n.id === id);
      if (note) {
        note.x = x;
        note.y = y;
        socket.broadcast.emit("note:moved", { id, x, y });
      }
    });

    socket.on("note:updated", ({ id, text, color }) => {
      const note = whiteboardState.notes.find(n => n.id === id);
      if (note) {
        note.text = text || note.text;
        note.color = color || note.color;
        socket.broadcast.emit("note:updated", { id, text, color });
      }
    });

    socket.on("note:deleted", (id) => {
      whiteboardState.notes = whiteboardState.notes.filter(n => n.id !== id);
      socket.broadcast.emit("note:deleted", id);
    });

    socket.on("group:created", (group) => {
      whiteboardState.groups.push(group);
      socket.broadcast.emit("group:created", group);
    });

    socket.on("group:moved", ({ id, x, y }) => {
      const group = whiteboardState.groups.find(g => g.id === id);
      if (group) {
        group.x = x;
        group.y = y;
        socket.broadcast.emit("group:moved", { id, x, y });
      }
    });

    socket.on("cursor:moved", ({ x, y }) => {
      socket.broadcast.emit("cursor:moved", { id: socket.id, x, y, name: socket.data.userName });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      socket.broadcast.emit("user:disconnected", socket.id);
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
