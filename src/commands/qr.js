import qrcode from 'qrcode'

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid

        if (argumentos.length === 0) {
            await sock.sendMessage(chat, {
                text: 'Uso: /qr <texto o URL>\nEjemplo: /qr https://github.com'
            })
            return
        }

        const texto = argumentos.join(' ')

        if (texto.length > 500) {
            await sock.sendMessage(chat, { text: 'Texto muy largo (máx 500 chars)' })
            return
        }

        try {
            const buffer = await qrcode.toBuffer(texto, {
                type: 'png',
                width: 512,
                margin: 2,
                color: { dark: '#000000', light: '#ffffff' }
            })

            await sock.sendMessage(chat, {
                image: buffer,
                caption: `QR: ${texto.slice(0, 100)}${texto.length > 100 ? '...' : ''}`
            })
        } catch (e) {
            console.error('Error generando QR:', e)
            await sock.sendMessage(chat, { text: 'No se pudo generar el QR' })
        }
    }
}