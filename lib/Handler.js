import { loadCommands } from "./commandLoader.js";
const commands = loadCommands();
const prefix = "."; // your bot’s prefix

export async function handleMessage(message, sock) {
  try {
    if (!message || !message.key || !message.message) return;

    const fromMe = message.key.fromMe;
    const from = message.key.remoteJid;
    const type = Object.keys(message.message)[0];

    const body =
      type === "conversation"
        ? message.message.conversation
        : type === "imageMessage" && message.message.imageMessage.caption
        ? message.message.imageMessage.caption
        : type === "videoMessage" && message.message.videoMessage.caption
        ? message.message.videoMessage.caption
        : "";

    if (!body || !body.startsWith(prefix)) return;

    const args = body.trim().slice(prefix.length).split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (!commands.has(commandName)) return;

    const command = commands.get(commandName);
    await command.run({ sock, message, args });

  } catch (err) {
    console.error("Error in handler:", err);
  }
}
