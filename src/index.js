import makeWASocket, {
    useMultiFileAuthState
} from '@whiskeysockets/baileys'

import { manejarMensaje } from './handler.js'

async function iniciarBot() {

    const { state, saveCreds } =
        await useMultiFileAuthState('./auth')

    const sock = makeWASocket({
        auth: state
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {

        const { connection } = update

        if (connection === 'open') {
            console.log('✅ ¡Bot conectado a WhatsApp!')
        }

        if (connection === 'close') {
            console.log('❌ Conexión cerrada')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {

        for (const mensaje of messages) {
            await manejarMensaje(sock, mensaje)
        }

    })
}

iniciarBot()