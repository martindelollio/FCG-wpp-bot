import { downloadMediaMessage } from '@whiskeysockets/baileys'
import sharp from 'sharp'

export default {

    async ejecutar({ sock, mensaje }) {

        const mensajeCitado =
            mensaje.message?.extendedTextMessage?.contextInfo?.quotedMessage

        if (!mensajeCitado) {

            await sock.sendMessage(
                mensaje.key.remoteJid,
                {
                    text: '❌ Tenés que responder a una imagen con /sticker'
                }
            )

            return
        }

        const imagen = mensajeCitado.imageMessage

        if (!imagen) {

            await sock.sendMessage(
                mensaje.key.remoteJid,
                {
                    text: '❌ El mensaje citado no contiene una imagen.'
                }
            )

            return
        }

        console.log('🖼️ Imagen encontrada')
        console.log('📐 Tamaño:', imagen.width, 'x', imagen.height)
        console.log('📦 Tipo:', imagen.mimetype)

        const buffer = await downloadMediaMessage(
            {
                message: mensajeCitado
            },
            'buffer',
            {}
        )

        console.log('✅ Imagen descargada')
        console.log('📦 Bytes:', buffer.length)

        console.log('🔄 Convirtiendo a WebP...')

        const sticker = await sharp(buffer)
            .resize(512, 512, {
                fit: 'contain'
            })
            .webp()
            .toBuffer()

        console.log('✅ Sticker convertido')
        console.log('📦 Bytes del WebP:', sticker.length)

        await sock.sendMessage(
            mensaje.key.remoteJid,
            {
                sticker: sticker
            }
        )

    console.log('🎉 Sticker enviado')

        console.log('✅ Sticker convertido')
        console.log('📦 Bytes del WebP:', sticker.length)

    }

}