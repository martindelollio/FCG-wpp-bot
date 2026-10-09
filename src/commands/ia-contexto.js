import { obtenerContexto, guardarContexto, limpiarContexto } from '../ia.js'

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid
        const isAdmin = await esAdmin(sock, chat, mensaje.key.participant || mensaje.key.remoteJid)

        if (!isAdmin) {
            await sock.sendMessage(chat, { text: 'Solo administradores pueden cambiar esta configuración.' })
            return
        }

        const contexto = await obtenerContexto(chat)

        if (argumentos.length === 0) {
            const estado = contexto.habilitado ? 'ACTIVADO' : 'DESACTIVADO'
            const mensajes = contexto.historial?.length || 0
            await sock.sendMessage(chat, {
                text: `IA Contexto: ${estado}\nMensajes en memoria: ${mensajes}\n\nUso:\n/ia-contexto on  - Activa memoria de conversación\n/ia-contexto off - Desactiva y limpia memoria\n/ia-contexto clear - Limpia memoria actual`
            })
            return
        }

        const accion = argumentos[0].toLowerCase()

        if (accion === 'on' || accion === 'activar' || accion === 'si') {
            contexto.habilitado = true
            await guardarContexto(chat, contexto)
            await sock.sendMessage(chat, { text: '✅ IA Contexto ACTIVADO. La IA recordará la conversación.' })
        } else if (accion === 'off' || accion === 'desactivar' || accion === 'no') {
            contexto.habilitado = false
            await guardarContexto(chat, contexto)
            await sock.sendMessage(chat, { text: '⛔ IA Contexto DESACTIVADO. La IA no recordará la conversación.' })
        } else if (accion === 'clear' || accion === 'limpiar') {
            await limpiarContexto(chat)
            await sock.sendMessage(chat, { text: '🗑️ Memoria de conversación limpiada.' })
        } else {
            await sock.sendMessage(chat, { text: 'Opción inválida. Usá: on, off o clear' })
        }
    }
}

async function esAdmin(sock, chat, user) {
    try {
        const metadata = await sock.groupMetadata(chat)
        const participante = metadata.participants.find(p => p.id === user)
        return participante && ['admin', 'superadmin'].includes(participante.admin)
    } catch {
        return false
    }
}