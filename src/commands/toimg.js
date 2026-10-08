import { downloadMediaMessage } from '@whiskeysockets/baileys'
import sharp from 'sharp'

export default {

    async ejecutar({ sock, mensaje }) {

        const chat = mensaje.key.remoteJid

        const citado =
            mensaje.message?.extendedTextMessage?.contextInfo?.quotedMessage

        if (!citado?.stickerMessage) {

            await sock.sendMessage(
                chat,
                {
                    text: 'Respondé a un sticker con /toimg'
                }
            )

            return
        }

        try {

            console.log('🖼️ Convirtiendo sticker a imagen...')

            const mensajeSticker = {
                message: citado
            }

            const buffer = await downloadMediaMessage(
                mensajeSticker,
                'buffer',
                {}
            )

            const imagen = await sharp(buffer)
                .png()
                .toBuffer()

            await sock.sendMessage(
                chat,
                {
                    image: imagen,
                    caption: ''
                }
            )

            console.log('✅ Imagen enviada')

        } catch (error) {

            console.error('❌ Error convirtiendo sticker:', error)

            await sock.sendMessage(
                chat,
                {
                    text: 'no se pudo negro de mierda.'
                }
            )
        }
    }
}