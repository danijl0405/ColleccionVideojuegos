import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import db from "./db";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

export const authRouter = express.Router();

// registro de usuarios
authRouter.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
  }

  const existing = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username) as { id: number } | undefined;
  if (existing) {
    return res.status(400).json({ message: "El usuario ya existe" });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
  const info = stmt.run(username, passwordHash);

  req.session.userId = Number(info.lastInsertRowid);
  req.session.username = username;

  return res.status(201).json({ id: info.lastInsertRowid, username });
});

authRouter.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Usuario y contraseña son obligatorios" });
  }

  const row = db
    .prepare("SELECT id, password_hash FROM users WHERE username = ?")
    .get(username) as { id: number; password_hash: string } | undefined;

  if (!row) {
    return res.status(401).json({ message: "Credenciales incorrectas" });
  }

  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) {
    return res.status(401).json({ message: "Credenciales incorrectas" });
  }

  req.session.userId = row.id;
  req.session.username = username;

  return res.json({ id: row.id, username });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error cerrando sesión" });
    }
    res.clearCookie("sid");
    return res.json({ message: "Sesión cerrada" });
  });
});

authRouter.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "No autenticado" });
  }
  return res.json({ id: req.session.userId, username: req.session.username });
});

export function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "No autenticado" });
  }
  next();
}

export function createSessionMiddleware() {
  return session({
    name: "sid",
    secret: "super-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    },
  });
}

