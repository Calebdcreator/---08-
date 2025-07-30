import makeWASocket, { useSingleFileAuthState } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import path from "path";

const prefix = ".";

// Load auth state for pairing code login
const { state, saveState } = useSingleFileAuthState("./auth_info.json");

const commands = new Map();

async function loadCommands(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      await loadCommands(path.join(dir, file.name));
    } else if (file.name.endsWith(".js")) {
      const commandName = file.name.slice(0, -3).toLowerCase();
      const module = await import(path.join(dir, file.name));
      commands.set(commandName, module.run);
      console.log(`Loaded command: ${commandName}`);
    }
  }
}

// Load commands folder
await loadCommands(path.join(process.cwd(), "commands"));

async function startBot() {
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true, // shows pairing code for WhatsApp
    auth: state,
    browser: ["CalebsBot-MD", "Chrome", "1.0.0"],
  });

  sock.ev.on("creds.update", saveState);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log("🚀 CalebsBot-MD connected and ready!");
    }
    if (connection === "close") {
      console.log("Connection closed, reconnecting...");
      if (lastDisconnect.error?.output?.statusCode !== 401) {
        startBot(); // reconnect unless logged out
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (commands.has(commandName)) {
      try {
        await commands.get(commandName)(sock, msg, args);
      } catch (err) {
        console.error(`Error in command ${commandName}:`, err);
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ Error executing command: ${err.message}`,
        });
      }
    }
  });
}

startBot();
