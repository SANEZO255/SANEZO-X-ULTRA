import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import { listCommands, runCommand } from "./lib/commands.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 60 }));
app.use(express.static(path.join(__dirname, "website")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, name: process.env.APP_NAME || "SANEZO X ULTRA", status: "commands-ready" });
});
app.get("/api", (_req, res) => {
  res.json({ name: "SANEZO X ULTRA", version: "1.1.0", message: "API is running" });
});

function authorized(req) {
  const secret = process.env.COMMAND_API_KEY;
  const supplied = req.get("x-api-key");
  if (!secret || !supplied) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

app.get("/api/commands", (req, res) => {
  if (!authorized(req)) return res.sendStatus(401);
  res.json({ commands: listCommands() });
});

app.post("/api/commands/execute", async (req, res) => {
  if (!authorized(req)) return res.sendStatus(401);
  const { message } = req.body ?? {};
  if (typeof message !== "string" || message.length > 500) {
    return res.status(400).json({ error: "message must be a string of at most 500 characters" });
  }
  try {
    const response = await runCommand(message);
    if (response === null) return res.status(404).json({ error: "Unknown command" });
    return res.json({ response });
  } catch {
    return res.status(500).json({ error: "Command failed" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`SANEZO X ULTRA listening on port ${port}`);
});
