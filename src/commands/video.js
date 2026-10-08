import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

const execFileAsync = promisify(execFile)

export default {

    async ejecutar({ sock, mensaje, argumentos }) {

        const chat = mensaje.key.remoteJid
        const url = argumentos[0]

        if (!url) {
            await sock.sendMessage(
                chat,
                {
                    text: '❌ Pasame una URL.\n\nEjemplo:\n/video https://youtu.be/...'
                }
            )

            return
        }

        const urlsPermitidas = [
            'youtube.com',
            'youtu.be',
            'x.com',
            'twitter.com',
            'instagram.com',
            'facebook.com',
            'fb.watch'
        ]

        let urlValida = false

        try {

            const urlObj = new URL(url)

            urlValida = urlsPermitidas.some(
                dominio =>
                    urlObj.hostname === dominio ||
                    urlObj.hostname.endsWith(`.${dominio}`)
            )

        } catch {
            urlValida = false
        }

        if (!urlValida) {
            await sock.sendMessage(
                chat,
                {
                    text: '❌ Esa URL no parece ser de YouTube, X, Instagram o Facebook pelotudo de re mierda.'
                }
            )

            return
        }

        const carpeta = await fs.mkdtemp(
            path.join(os.tmpdir(), 'fcgbot-video-')
        )

        const salida = path.join(carpeta, 'video.%(ext)s')

        try {

            await sock.sendMessage(
                chat,
                {
                    text: 'descargando video...'
                }
            )

            await execFileAsync(
                'yt-dlp',
                [
                    '--no-playlist',
                    '-f',
                    'bv*[ext=mp4][height<=720]+ba[ext=m4a]/b[ext=mp4][height<=720]/b',
                    '--merge-output-format',
                    'mp4',
                    '-o',
                    salida,
                    url
                ],
                {
                    maxBuffer: 10 * 1024 * 1024
                }
            )

            const archivos = await fs.readdir(carpeta)

            const archivo = archivos.find(
                nombre => nombre.endsWith('.mp4')
            )

            if (!archivo) {
                throw new Error('No se encontró el video de mierda ese.')
            }

            const rutaVideo = path.join(carpeta, archivo)

            const video = await fs.readFile(rutaVideo)

            await sock.sendMessage(
                chat,
                {
                    video,
                    mimetype: 'video/mp4',
                    caption: ''
                }
            )

            console.log('✅ Video enviado')

        } catch (error) {

            console.error('❌ Error descargando video:')
            console.error(error.stderr || error.message)

            await sock.sendMessage(
                chat,
                {
                    text: '❌ No pude descargar ese video. Puede que sea privado, requiera iniciar sesión, que la plataforma haya cambiado algo o simplemente seas idota.'
                }
            )

        } finally {

            await fs.rm(
                carpeta,
                {
                    recursive: true,
                    force: true
                }
            )

        }
    }
}