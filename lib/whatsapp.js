
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import { runCommand } from "./commands.js";

let sock = null;
let status = "offline";
let reconnectTimer = null;
let startingPromise = null;
let pairingPromise = null;
let pairingReady = false;

const AUTH_DIR = "./auth_info";

export function getWhatsAppStatus() {
  return { status };
}

export async function startWhatsApp() {
  if (sock) return;
  if (startingPromise) return startingPromise;

  startingPromise = (async () => {
    status = "connecting";
    pairingReady = false;

    const { state, saveCreds } =
      await useMultiFileAuthState(AUTH_DIR);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60000
    });

    sock = socket;

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("connection.update", (update) => {
      if (sock !== socket) return;

      const {
        connection,
        lastDisconnect
      } = update;

      if (update.qr || connection === "connecting") {
        if (!socket.authState.creds.registered) {
          pairingReady = true;
        }
      }

      if (connection === "open") {
        status = "connected";
        pairingReady = false;

        console.log("SANEZO X ULTRA connected");
      }

      if (connection === "close") {
        status = "offline";
        pairingReady = false;
        sock = null;

        const code =
          lastDisconnect?.error?.output?.statusCode;

        if (
          code !== DisconnectReason.loggedOut &&
          process.env.ENABLE_WHATSAPP === "true" &&
          !reconnectTimer
        ) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;

            startWhatsApp().catch((error) => {
              console.error(
                "Reconnect failed:",
                error.message
              );
            });
          }, 5000);
        }
      }
    });

    socket.ev.on("messages.upsert", async ({ messages }) => {
      for (const msg of messages) {
        try {
          if (!msg.message || msg.key.fromMe) continue;

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

          if (!text) continue;

          const response = await runCommand(text);

          if (response && msg.key.remoteJid) {
            await socket.sendMessage(
              msg.key.remoteJid,
              { text: response }
            );
          }
        } catch (error) {
          console.error(
            "Message error:",
            error.message
          );
        }
      }
    });
  })();

  try {
    await startingPromise;
  } catch (error) {
    status = "offline";
    sock = null;
    throw error;
  } finally {
    startingPromise = null;
  }
}

async function waitForPairingReady(timeoutMs = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (!sock || status === "offline") {
      throw new Error("WhatsApp socket is offline");
    }

    if (sock.authState.creds.registered) {
      throw new Error("WhatsApp is already registered");
    }

    if (pairingReady) return;

    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    });
  }

  throw new Error("Pairing connection timed out");
}

export async function requestPairing(phoneNumber) {
  const number = String(phoneNumber);

  if (!/^[1-9]\d{7,14}$/.test(number)) {
    throw new Error(
      "Enter a valid international phone number"
    );
  }

  if (process.env.ENABLE_WHATSAPP !== "true") {
    throw new Error("WhatsApp pairing is disabled");
  }

  if (pairingPromise) {
    throw new Error(
      "Another pairing request is in progress"
    );
  }

  pairingPromise = (async () => {
    await startWhatsApp();
    await waitForPairingReady();

    const socket = sock;

    if (!socket) {
      throw new Error("WhatsApp socket unavailable");
    }

    const code = await socket.requestPairingCode(number);

    return { code };
  })();

  try {
    return await pairingPromise;
  } finally {
    pairingPromise = null;
  }
}
