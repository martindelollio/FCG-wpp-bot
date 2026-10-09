import os from 'os'
import fs from 'fs/promises'
import path from 'path'
import { obtenerPersonalidad } from '../data.js'

export default {
    async ejecutar({ sock, mensaje }) {
        const chat = mensaje.key.remoteJid

        const mem = process.memoryUsage()
        const uptime = process.uptime()
        const cpu = os.cpus()[0]
        const totalMem = os.totalmem()
        const freeMem = os.freemem()
        const usedMem = totalMem - freeMem

        const authDir = path.resolve('./auth')
        let authFiles = 0
        let authSize = 0
        try {
            const files = await fs.readdir(authDir, { withFileTypes: true })
            for (const f of files) {
                if (f.isFile()) {
                    authFiles++
                    const stat = await fs.stat(path.join(authDir, f.name))
                    authSize += stat.size
                }
            }
        } catch {}

        const personalidad = await obtenerPersonalidad(chat)

        const lines = [
            '=== FCGbot Status ===',
            '',
            `Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
            `PID: ${process.pid}`,
            `Node: ${process.version}`,
            `Platform: ${os.platform()} ${os.arch()}`,
            '',
            `CPU: ${cpu.model} (${os.cpus().length} cores)`,
            `Load: ${os.loadavg().map(n => n.toFixed(2)).join(', ')}`,
            '',
            `Memoria total: ${(totalMem / 1024 / 1024).toFixed(0)} MB`,
            `Memoria usada: ${(usedMem / 1024 / 1024).toFixed(0)} MB (${((usedMem / totalMem) * 100).toFixed(1)}%)`,
            `Memoria libre: ${(freeMem / 1024 / 1024).toFixed(0)} MB`,
            '',
            `Heap usado: ${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
            `Heap total: ${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
            `RSS: ${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
            `External: ${(mem.external / 1024 / 1024).toFixed(1)} MB`,
            '',
            `Auth files: ${authFiles} (${(authSize / 1024).toFixed(1)} KB)`,
            '',
            `Personalidad actual: ${typeof personalidad === 'string' ? 'default' : (personalidad.nombre || 'custom')}`,
        ]

        await sock.sendMessage(chat, { text: lines.join('\n') })
    }
}