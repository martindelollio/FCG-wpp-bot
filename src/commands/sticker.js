import { downloadContentFromMessage } from '@whiskeysockets/baileys'
import ffmpeg from 'fluent-ffmpeg'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

export default {

    async ejecutar({ sock, mensaje }) {

        try {
            // ¿Hay un mensaje citado?
            const citado =
                mensaje.message?.extendedTextMessage?.contextInfo?.quotedMessage

            // Buscamos imagen o video (en mensaje citado o directo)
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

                // Extraemos la info de descarga directamente del message
                const mediaInfo = {
                    mediaKey: imagen.mediaKey,
                    directPath: imagen.directPath,
                    url: imagen.url
                }

                const stream = await downloadContentFromMessage(mediaInfo, 'image', {})
                
                const chunks = []
                for await (const chunk of stream) {
                    chunks.push(chunk)
                }
                const buffer = Buffer.concat(chunks)

                if (!buffer || buffer.length === 0) {
                    throw new Error('Buffer vacío al descargar imagen')
                }

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
                        .on('end', () => {
                            resolve()
                        })
                        .on('error', (err) => {
                            console.error('❌ Error ffmpeg:', err)
                            reject(err)
                        })
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

                // Extraemos la info de descarga directamente del message
                const mediaInfo = {
                    mediaKey: video.mediaKey,
                    directPath: video.directPath,
                    url: video.url
                }

                const stream = await downloadContentFromMessage(mediaInfo, 'video', {})
                
                const chunks = []
                for await (const chunk of stream) {
                    chunks.push(chunk)
                }
                const buffer = Buffer.concat(chunks)

                if (!buffer || buffer.length === 0) {
                    throw new Error('Buffer vacío al descargar video')
                }

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
                        .on('end', () => {
                            resolve()
                        })
                        .on('error', (err) => {
                            console.error('❌ Error ffmpeg (video):', err)
                            reject(err)
                        })
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
        } catch (error) {
            console.error('❌ Error en comando sticker:', error)
            await sock.sendMessage(
                mensaje.key.remoteJid,
                {
                    text: `❌ Error creando sticker: ${error.message}`
                }
            )
        }
    }
}