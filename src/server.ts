import express from "express";
import cors from "cors";
import path from "path";
import { authRouter, createSessionMiddleware } from "./auth";
import { gamesRouter } from "./games";
import "./db"; // inicializa la BD

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(createSessionMiddleware());

// Rutas API
app.use("/api/auth", authRouter);
app.use("/api/games", gamesRouter);

// Servir frontend estático
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

// Ruta principal para la SPA
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

