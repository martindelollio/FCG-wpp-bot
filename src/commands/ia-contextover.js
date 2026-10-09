import { obtenerContexto } from '../ia.js'

export default {
    async ejecutar({ sock, mensaje }) {
        const chat = mensaje.key.remoteJid

        const contexto = await obtenerContexto(chat)

        if (!contexto.habilitado) {
            await sock.sendMessage(chat, { text: 'IA Contexto: DESACTIVADO\nUsá /ia-contexto on para activarlo.' })
            return
        }

        const historial = contexto.historial || []

        if (historial.length === 0) {
            await sock.sendMessage(chat, { text: 'IA Contexto: ACTIVADO\n(Memoria vacía)' })
            return
        }

        const lineas = ['IA Contexto - Memoria actual', `(${historial.length} mensajes)`, '']

        for (const m of historial) {
            const role = m.role === 'user' ? '👤' : '🤖'
            const fecha = new Date(m.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            const texto = m.content.slice(0, 100) + (m.content.length > 100 ? '...' : '')
            lineas.push(`${role} [${fecha}] ${texto}`)
        }

        await sock.sendMessage(chat, { text: lineas.join('\n') })
    }
}