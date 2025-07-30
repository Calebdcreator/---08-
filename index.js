const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');
const figlet = require('figlet');
const chalk = require('chalk');
const { Boom } = require('@hapi/boom');

console.clear();
console.log(chalk.cyan(figlet.textSync("CALEB'S BOT-MD")));

async function startSock() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false, // QR DISABLED
    auth: state,
    logger: P({ level: 'silent' }),
    browser: ['CALEB\'S BOT-MD', 'Chrome', '1.0.0'],
    getMessage: async () => ({ conversation: 'hello' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr, pairingCode } = update;

    if (pairingCode) {
      console.log(chalk.green('\nPASTE THIS ON YOUR PHONE TO PAIR:'));
      console.log(chalk.yellow(`\n${pairingCode}`));
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        startSock();
      }
    } else if (connection === 'open') {
      console.log(chalk.green('\n✅ Connected successfully!'));
    }
  });

  // Trigger pairing
  if (!state.creds.registered) {
    await sock.requestPairingCode('2347079799769'); // your number here
  }
}

startSock();
