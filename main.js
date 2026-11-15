
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  listCommands,
  runCommand
} from "./lib/commands.js";

import {
  startWhatsApp,
  requestPairing,
  getWhatsAppStatus
} from "./lib/whatsapp.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.disable("x-powered-by");

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));

app.use("/api", rateLimit({
  windowMs: 60_000,
  limit: 60
}));

app.use(express.static(path.join(__dirname, "website")));

function authorized(req) {
  const secret = process.env.COMMAND_API_KEY;
  const supplied = req.get("x-api-key");

  if (!secret || !supplied) return false;

  const a = Buffer.from(secret);
  const b = Buffer.from(supplied);

  return a.length === b.length && timingSafeEqual(a, b);
}

function requireAuth(req, res, next) {
  if (!authorized(req)) {
    return res.status(401).json({
      error: "Unauthorized access"
    });
  }

  next();
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "SANEZO X ULTRA",
    version: "1.3.0",
    status: "api-online"
  });
});

// API information
app.get("/api", (_req, res) => {
  res.json({
    name: "SANEZO X ULTRA",
    version: "1.3.0",
    message: "API is running"
  });
});

// Available commands
app.get("/api/commands", requireAuth, (_req, res) => {
  res.json({
    commands: listCommands()
  });
});

// Execute commands
app.post("/api/commands/execute", requireAuth, async (req, res) => {
  const { message } = req.body ?? {};

  if (
    typeof message !== "string" ||
    message.length > 500
  ) {
    return res.status(400).json({
      error: "Invalid message"
    });
  }

  try {
    const response = await runCommand(message);

    if (response === null) {
      return res.status(404).json({
        error: "Unknown command"
      });
    }

    return res.json({ response });
  } catch (error) {
    console.error("Command error:", error.message);

    return res.status(500).json({
      error: "Command execution failed"
    });
  }
});

// WhatsApp connection status
app.get("/api/whatsapp/status", requireAuth, (_req, res) => {
  res.json(getWhatsAppStatus());
});

// Limit pairing requests
const pairingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

// Request pairing code
app.post(
  "/api/whatsapp/pair",
  requireAuth,
  pairingLimiter,
  async (req, res) => {
    if (process.env.ENABLE_WHATSAPP !== "true") {
      return res.status(503).json({
        error: "WhatsApp pairing is disabled"
      });
    }

    const { phoneNumber } = req.body ?? {};

    if (
      typeof phoneNumber !== "string" ||
      !/^[1-9]\d{7,14}$/.test(phoneNumber)
    ) {
      return res.status(400).json({
        error: "Invalid international phone number"
      });
    }

    try {
      const result = await requestPairing(phoneNumber);

      res.set("Cache-Control", "no-store");

      return res.json({
        success: true,
        message: "Enter this code in WhatsApp Linked Devices",
        pairingCode: result.code
      });
    } catch (error) {
      console.error("Pairing failed:", error.message);

      return res.status(503).json({
        success: false,
        error: "Pairing is unavailable. Check server logs."
      });
    }
  }
);

// Start backend
app.listen(port, "0.0.0.0", () => {
  console.log(`SANEZO X ULTRA running on port ${port}`);

  if (process.env.ENABLE_WHATSAPP === "true") {
    startWhatsApp().catch((error) => {
      console.error("WhatsApp startup failed:", error);
    });
  } else {
    console.log("WhatsApp pairing is currently disabled");
  }
});
