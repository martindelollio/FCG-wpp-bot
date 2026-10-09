import qrcode from 'qrcode-terminal'
import makeWASocket, {
    useMultiFileAuthState
} from '@whiskeysockets/baileys'

import { manejarMensaje } from './handler.js'

async function iniciarBot() {

    const { state, saveCreds } =
        await useMultiFileAuthState('./auth')

    const sock = makeWASocket({
        auth: state,
        browser: ['FCGbot', 'Chrome', '120.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('📱 Escanea el código QR para conectar:')
            qrcode.generate(qr, { small: true })
            console.log('')
            console.log('Si el QR no funciona, usa emparejamiento con número:')
            console.log('  En WhatsApp: Configuración > Dispositivos vinculados > Vincular dispositivo')
            console.log('  Luego ejecuta: node pair.js TU_NUMERO (ej: 5491123456789)')
        }

        if (connection === 'open') {
            console.log('✅ ¡Bot conectado a WhatsApp!')
        }

        if (connection === 'close') {
            const codigo =
                lastDisconnect?.error?.output?.statusCode

            console.log('❌ Conexión cerrada. Código:', codigo)

            if (codigo === 515) {
                console.log('🔄 Reiniciando conexión después del emparejamiento...')
                setTimeout(() => iniciarBot(), 1000)
            }
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {

        for (const mensaje of messages) {
            await manejarMensaje(sock, mensaje)
        }

    })
}

iniciarBot()