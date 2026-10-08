import { downloadMediaMessage } from '@whiskeysockets/baileys'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

export default {

    async ejecutar({ sock, mensaje }) {

        // ¿Hay un mensaje citado?
        const citado =
            mensaje.message?.extendedTextMessage?.contextInfo?.quotedMessage

        // Buscamos imagen o video
        const imagen =
            citado?.imageMessage ||
            mensaje.message?.imageMessage

        const video =
            citado?.videoMessage ||
            mensaje.message?.videoMessage

        if (!imagen && !video) {

            await sock.sendMessage(
                mensaje.key.remoteJid,
                {
                    text: 'Respondé a una imagen o video con /sticker'
                }
            )

            return
        }

        // ------------------------------------------------
        // IMAGEN
        // ------------------------------------------------

        if (imagen) {

            console.log('🖼️ Creando sticker de imagen...')

            const mensajeDescarga = citado
                ? { message: citado }
                : mensaje

            const buffer = await downloadMediaMessage(
                mensajeDescarga,
                'buffer',
                {}
            )

            // Creamos archivo temporal
            const carpeta = await fs.mkdtemp(
                path.join(os.tmpdir(), 'fcgbot-')
            )

            const entrada = path.join(carpeta, 'imagen.jpg')
            const salida = path.join(carpeta, 'sticker.webp')

            await fs.writeFile(entrada, buffer)

            // Convertimos a WebP
            await new Promise((resolve, reject) => {

                ffmpeg(entrada)
                    .outputOptions([
                        '-vcodec libwebp',
                        '-vf',
                        'scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=white@0',
                        '-an'
                    ])
                    .toFormat('webp')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(salida)

            })

            const sticker = await fs.readFile(salida)

            // Lo mandamos
            await sock.sendMessage(
                mensaje.key.remoteJid,
                {
                    sticker
                }
            )

            // Limpiamos archivos temporales
            await fs.rm(carpeta, {
                recursive: true,
                force: true
            })

            console.log('✅ Sticker enviado')

            return
        }

        // ------------------------------------------------
        // VIDEO
        // ------------------------------------------------

        if (video) {

            console.log('🎥 Creando sticker animado...')

            const mensajeDescarga = citado
                ? { message: citado }
                : mensaje

            const buffer = await downloadMediaMessage(
                mensajeDescarga,
                'buffer',
                {}
            )

            const carpeta = await fs.mkdtemp(
                path.join(os.tmpdir(), 'fcgbot-')
            )

            const entrada = path.join(carpeta, 'video.mp4')
            const salida = path.join(carpeta, 'sticker.webp')

            await fs.writeFile(entrada, buffer)

            // Video → WebP animado
            await new Promise((resolve, reject) => {

                ffmpeg(entrada)
                    .outputOptions([
                        '-vcodec libwebp',
                        '-vf',
                        'scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=white@0,fps=15',
                        '-loop 0',
                        '-t 5',
                        '-an'
                    ])
                    .toFormat('webp')
                    .on('end', resolve)
                    .on('error', reject)
                    .save(salida)

            })

            const sticker = await fs.readFile(salida)

            await sock.sendMessage(
                mensaje.key.remoteJid,
                {
                    sticker
                }
            )

            await fs.rm(carpeta, {
                recursive: true,
                force: true
            })

            console.log('✅ Sticker animado enviado')

            return
        }
    }
}