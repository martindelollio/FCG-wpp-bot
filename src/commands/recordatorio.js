import fs from 'fs/promises'
import path from 'path'

const archivo = path.join(process.cwd(), 'data', 'recordatorios.json')

async function cargar() {
    try {
        const data = await fs.readFile(archivo, 'utf8')
        return JSON.parse(data)
    } catch {
        return {}
    }
}

async function guardar(data) {
    await fs.mkdir(path.dirname(archivo), { recursive: true })
    await fs.writeFile(archivo, JSON.stringify(data, null, 2))
}

function parsearTiempo(str) {
    const m = str.match(/^(\d+)([smhd])$/)
    if (!m) return null
    const val = parseInt(m[1])
    const unit = m[2]
    const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }
    return val * mult[unit]
}

function formatearTiempo(ms) {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    if (d) return `${d}d ${h % 24}h`
    if (h) return `${h}h ${m % 60}m`
    if (m) return `${m}m ${s % 60}s`
    return `${s}s`
}

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid
        const sender = mensaje.key.participant || mensaje.key.remoteJid
        const userId = sender.split('@')[0]

        if (argumentos.length === 0) {
            await sock.sendMessage(chat, {
                text: 'Uso: /recordatorio <tiempo> <mensaje>\nEjemplos:\n/recordatorio 30m Revisar el horno\n/recordatorio 2h Llamar a Juan\n/recordatorio 1d Pagar tarjeta'
            })
            return
        }

        const tiempoStr = argumentos[0]
        const ms = parsearTiempo(tiempoStr)

        if (!ms) {
            await sock.sendMessage(chat, {
                text: 'Formato de tiempo inválido. Usa: 30s, 5m, 2h, 1d'
            })
            return
        }

        if (ms < 10000) {
            await sock.sendMessage(chat, { text: 'Mínimo 10 segundos' })
            return
        }

        if (ms > 30 * 86400000) {
            await sock.sendMessage(chat, { text: 'Máximo 30 días' })
            return
        }

        const texto = argumentos.slice(1).join(' ')
        if (!texto.trim()) {
            await sock.sendMessage(chat, { text: 'Falta el mensaje del recordatorio' })
            return
        }

        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        const cuando = Date.now() + ms

        const data = await cargar()
        if (!data[userId]) data[userId] = []
        data[userId].push({ id, texto, cuando, chat })
        await guardar(data)

        setTimeout(async () => {
            try {
                await sock.sendMessage(chat, {
                    text: `⏰ Recordatorio: ${texto}`
                })
                const d = await cargar()
                if (d[userId]) {
                    d[userId] = d[userId].filter(r => r.id !== id)
                    await guardar(d)
                }
            } catch (e) {
                console.error('Error enviando recordatorio:', e)
            }
        }, ms)

        await sock.sendMessage(chat, {
            text: `Recordatorio guardado para dentro de ${formatearTiempo(ms)}: ${texto}`
        })
    }
}