import { obtenerMemoriaUsuario, obtenerTodosIntegrantes, limpiarMemoriaUsuario } from '../memoria.js'

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid
        const sender = mensaje.key.participant || mensaje.key.remoteJid
        const isAdmin = await esAdmin(sock, chat, sender)

        // /ia-memoria [usuario] - ver memoria de uno
        // /ia-memoria todos - ver todos (solo admin)
        // /ia-memoria limpiar [usuario] - limpiar memoria (solo admin o propio)

        if (argumentos.length === 0) {
            // Ver mi propia memoria
            const userId = sender.split('@')[0]
            const userName = mensaje.pushName || userId
            await mostrarMemoria(sock, chat, userId, userName)
            return
        }

        const accion = argumentos[0].toLowerCase()

        if (accion === 'todos') {
            if (!isAdmin) {
                await sock.sendMessage(chat, { text: 'Solo admins pueden ver todas las memorias.' })
                return
            }
            await mostrarTodasMemorias(sock, chat)
            return
        }

        if (accion === 'limpiar') {
            if (argumentos.length < 2) {
                await sock.sendMessage(chat, { text: 'Uso: /ia-memoria limpiar @usuario' })
                return
            }
            // Solo admin o el propio usuario
            const targetId = argumentos[1].replace('@', '').split('@')[0]
            if (!isAdmin && targetId !== sender.split('@')[0]) {
                await sock.sendMessage(chat, { text: 'Solo podés limpiar tu propia memoria.' })
                return
            }
            await limpiarMemoriaUsuario(chat, targetId)
            await sock.sendMessage(chat, { text: `Memoria de ${targetId} limpiada.` })
            return
        }

        // Buscar usuario por mención o nombre
        const mencion = argumentos[0]
        let targetId = mencion.replace('@', '').split('@')[0]
        
        // Si es un nombre, buscar en participantes
        if (!mencion.includes('@') && sock) {
            try {
                const metadata = await sock.groupMetadata(chat)
                const p = metadata.participants.find(par => 
                    par.pushName?.toLowerCase().includes(targetId.toLowerCase()) ||
                    par.notify?.toLowerCase().includes(targetId.toLowerCase())
                )
                if (p) targetId = p.id.split('@')[0]
            } catch {}
        }

        await mostrarMemoria(sock, chat, targetId, targetId)
    }
}

async function mostrarMemoria(sock, chat, userId, userName) {
    const memoria = await obtenerMemoriaUsuario(chat, userId, userName)
    
    if (!memoria || memoria.hechos.length === 0) {
        await sock.sendMessage(chat, { text: `No hay memoria guardada para ${userName}.` })
        return
    }

    const lineas = [`🧠 Memoria de ${memoria.nombre || userName}`, '']

    if (memoria.personalidad) {
        lineas.push(`Personalidad: ${memoria.personalidad}`)
        lineas.push('')
    }

    if (memoria.hechos.length > 0) {
        lineas.push(`Hechos (${memoria.hechos.length}):`)
        for (const h of memoria.hechos.slice(-20)) {
            lineas.push(`  • ${h}`)
        }
        lineas.push('')
    }

    if (Object.keys(memoria.preferencias).length > 0) {
        lineas.push(`Preferencias:`)
        for (const [k, v] of Object.entries(memoria.preferencias)) {
            lineas.push(`  • ${k}: ${v}`)
        }
        lineas.push('')
    }

    if (memoria.ultimasInteracciones.length > 0) {
        lineas.push(`Últimas interacciones:`)
        for (const i of memoria.ultimasInteracciones.slice(-5)) {
            const fecha = new Date(i.fecha).toLocaleString('es-AR', { 
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
            })
            lineas.push(`  [${fecha}] ${i.resumen}`)
        }
    }

    await sock.sendMessage(chat, { text: lineas.join('\n') })
}

async function mostrarTodasMemorias(sock, chat) {
    const todas = await obtenerTodosIntegrantes(chat)
    
    if (Object.keys(todas).length === 0) {
        await sock.sendMessage(chat, { text: 'No hay memorias guardadas en este grupo.' })
        return
    }

    const lineas = ['Todas las memorias del grupo', '']

    for (const [id, mem] of Object.entries(todas)) {
        lineas.push(`=== ${mem.nombre || id} (${mem.hechos.length} hechos) ===`)
        if (mem.hechos.length > 0) {
            for (const h of mem.hechos.slice(-5)) {
                lineas.push(`  • ${h}`)
            }
        } else {
            lineas.push('  (vacía)')
        }
        lineas.push('')
    }

    await sock.sendMessage(chat, { text: lineas.join('\n') })
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