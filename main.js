import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 60 }));
app.use(express.static(path.join(__dirname, "website")));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: process.env.APP_NAME || "SANEZO X ULTRA",
    status: "starter-ready"
  });
});

app.get("/api", (_req, res) => {
  res.json({ name: "SANEZO X ULTRA", version: "1.0.0", message: "API is running" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`SANEZO X ULTRA listening on port ${port}`);
});
