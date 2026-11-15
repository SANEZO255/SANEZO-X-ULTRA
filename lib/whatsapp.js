
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import { runCommand } from "./commands.js";

let sock = null;
let status = "offline";
let reconnectTimer = null;

export function getWhatsAppStatus() {
  return { status };
}

export async function startWhatsApp() {
  if (sock && status !== "offline") {
    return;
  }

  status = "connecting";

  const { state, saveCreds } =
    await useMultiFileAuthState("./auth_info");

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    markOnlineOnConnect: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      status = "connected";
      console.log("SANEZO X ULTRA connected");
    }

    if (connection === "close") {
      status = "offline";
      sock = null;

      const code =
        lastDisconnect?.error?.output?.statusCode;

      if (code !== DisconnectReason.loggedOut) {
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            startWhatsApp().catch(console.error);
          }, 5000);
        }
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text;

        if (!text) continue;

        const response = await runCommand(text);

        if (response && msg.key.remoteJid) {
          await sock.sendMessage(
            msg.key.remoteJid,
            { text: response }
          );
        }
      } catch (error) {
        console.error("Message error:", error.message);
      }
    }
  });
}

export async function requestPairing(phoneNumber) {
  const number = String(phoneNumber).replace(/\D/g, "");

  if (!/^[1-9]\d{7,14}$/.test(number)) {
    throw new Error(
      "Enter a valid international phone number"
    );
  }

  if (!sock) {
    await startWhatsApp();
  }

  if (sock.authState.creds.registered) {
    throw new Error("WhatsApp already registered");
  }

  if (status === "offline") {
    throw new Error("WhatsApp connection is offline");
  }

  const code = await sock.requestPairingCode(number);

  return { code };
}
