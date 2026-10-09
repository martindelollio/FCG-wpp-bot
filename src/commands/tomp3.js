import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

const execFileAsync = promisify(execFile)

const URLS_PERMITIDAS = [
    'youtube.com',
    'youtu.be',
    'x.com',
    'twitter.com',
    'instagram.com',
    'facebook.com',
    'fb.watch',
    'soundcloud.com',
    'vimeo.com',
    'twitch.tv',
]

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid
        const url = argumentos[0]

        if (!url) {
            await sock.sendMessage(chat, {
                text: 'Uso: /tomp3 <URL>\nEjemplo: /tomp3 https://youtu.be/...'
            })
            return
        }

        let urlValida = false
        try {
            const urlObj = new URL(url)
            urlValida = URLS_PERMITIDAS.some(
                d => urlObj.hostname === d || urlObj.hostname.endsWith(`.${d}`)
            )
        } catch {
            urlValida = false
        }

        if (!urlValida) {
            await sock.sendMessage(chat, {
                text: 'URL no soportada. Sitios permitidos: YouTube, X/Twitter, Instagram, Facebook, SoundCloud, Vimeo, Twitch'
            })
            return
        }

        const carpeta = await fs.mkdtemp(path.join(os.tmpdir(), 'fcgbot-audio-'))
        const salida = path.join(carpeta, 'audio.%(ext)s')

        try {
            await sock.sendMessage(chat, { text: 'Descargando audio...' })

            await execFileAsync('yt-dlp', [
                '--no-playlist',
                '-x',
                '--audio-format', 'mp3',
                '--audio-quality', '192K',
                '-o', salida,
                url
            ], { maxBuffer: 10 * 1024 * 1024 })

            const archivos = await fs.readdir(carpeta)
            const archivo = archivos.find(n => n.endsWith('.mp3'))

            if (!archivo) {
                throw new Error('No se generó el MP3')
            }

            const rutaAudio = path.join(carpeta, archivo)
            const audioBuffer = await fs.readFile(rutaAudio)

            await sock.sendMessage(chat, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: archivo
            })

            console.log('Audio enviado:', archivo)

        } catch (error) {
            console.error('Error tomp3:', error.stderr || error.message)
            await sock.sendMessage(chat, {
                text: 'No se pudo descargar el audio. Video privado, geo-bloqueado, muy largo o plataforma no soportada.'
            })
        } finally {
            await fs.rm(carpeta, { recursive: true, force: true })
        }
    }
}