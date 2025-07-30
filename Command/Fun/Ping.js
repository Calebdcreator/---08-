export async function run(sock, msg, args) {
  await sock.sendMessage(msg.key.remoteJid, { text: "Pong! 🏓" });
}
