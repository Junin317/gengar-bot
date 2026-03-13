const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const pino = require('pino')
const qrcode = require('qrcode-terminal')

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth')
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['Bot', 'Chrome', '1.0'],
  })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', (u) => {
    console.log('UPDATE:', JSON.stringify(u))
    if (u.qr) { qrcode.generate(u.qr, { small: true }) }
    if (u.connection === 'close') {
      console.log('ERRO:', u.lastDisconnect?.error?.message)
      setTimeout(start, 3000)
    }
  })
}
start().catch(console.error)
