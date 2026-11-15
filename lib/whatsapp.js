
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from "@whiskeysockets/baileys";

import { runCommand } from "./commands.js";

let sock = null;

export async function startWhatsApp() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth_info");

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {
    console.log("WhatsApp connection:", connection);
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text;

      if (!text) continue;

      const response = await runCommand(text);

      if (response) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: response
        });
      }
    }
  });
}
