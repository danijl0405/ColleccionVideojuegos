import express from "express";
import db from "./db";
import { requireAuth } from "./auth";

export const gamesRouter = express.Router();

// Aplicar middleware de autenticación a todas las rutas de juegos
gamesRouter.use(requireAuth);

// Listado y filtrado
gamesRouter.get("/", (req, res) => {
  const userId = req.session.userId!;
  const { platform, genre, status } = req.query;

  let query = "SELECT * FROM games WHERE user_id = ?";
  const params: (string | number)[] = [userId];

  if (platform) {
    query += " AND platform = ?";
    params.push(String(platform));
  }
  if (genre) {
    query += " AND genre = ?";
    params.push(String(genre));
  }
  if (status) {
    query += " AND status = ?";
    params.push(String(status));
  }

  const games = db.prepare(query).all(...params);
  res.json(games);
});

// Crear juego nuevo
gamesRouter.post("/", (req, res) => {
  const userId = req.session.userId!;
  const { title, platform, genre, status } = req.body;

  if (!title || !platform || !genre || !status) {
    return res.status(400).json({ message: "Todos los campos son obligatorios" });
  }

  const validStatuses = ["pendiente", "en_progreso", "completado"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Estado no válido" });
  }

  const stmt = db.prepare(
    "INSERT INTO games (user_id, title, platform, genre, status) VALUES (?, ?, ?, ?, ?)"
  );
  const info = stmt.run(userId, title, platform, genre, status);

  const game = db
    .prepare("SELECT * FROM games WHERE id = ?")
    .get(info.lastInsertRowid as number);

  res.status(201).json(game);
});

// Editar un juego
gamesRouter.put("/:id", (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  const { title, platform, genre, status } = req.body;

  const game = db
    .prepare("SELECT * FROM games WHERE id = ? AND user_id = ?")
    .get(id, userId);
  if (!game) {
    return res.status(404).json({ message: "Videojuego no encontrado" });
  }

  const validStatuses = ["pendiente", "en_progreso", "completado"];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Estado no válido" });
  }

  const updatedTitle = title ?? (game as any).title;
  const updatedPlatform = platform ?? (game as any).platform;
  const updatedGenre = genre ?? (game as any).genre;
  const updatedStatus = status ?? (game as any).status;

  db.prepare(
    "UPDATE games SET title = ?, platform = ?, genre = ?, status = ? WHERE id = ? AND user_id = ?"
  ).run(updatedTitle, updatedPlatform, updatedGenre, updatedStatus, id, userId);

  const updated = db
    .prepare("SELECT * FROM games WHERE id = ? AND user_id = ?")
    .get(id, userId);

  res.json(updated);
});

// Actualizar solo estado
gamesRouter.patch("/:id/status", (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pendiente", "en_progreso", "completado"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Estado no válido" });
  }

  const game = db
    .prepare("SELECT * FROM games WHERE id = ? AND user_id = ?")
    .get(id, userId);
  if (!game) {
    return res.status(404).json({ message: "Videojuego no encontrado" });
  }

  db.prepare("UPDATE games SET status = ? WHERE id = ? AND user_id = ?").run(
    status,
    id,
    userId
  );

  const updated = db
    .prepare("SELECT * FROM games WHERE id = ? AND user_id = ?")
    .get(id, userId);

  res.json(updated);
});

// Eliminar videojuego
gamesRouter.delete("/:id", (req, res) => {
  const userId = req.session.userId!;
  const { id } = req.params;

  const info = db
    .prepare("DELETE FROM games WHERE id = ? AND user_id = ?")
    .run(id, userId);

  if (info.changes === 0) {
    return res.status(404).json({ message: "Videojuego no encontrado" });
  }

  res.status(204).send();
});

