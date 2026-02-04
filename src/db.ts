import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_FILE = path.join(__dirname, "..", "data", "database.sqlite");

// Asegurarse de que exista la carpeta de datos
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_FILE);

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    genre TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendiente','en_progreso','completado')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;

