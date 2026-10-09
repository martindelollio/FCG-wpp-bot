import { obtenerTokens, obtenerTokensGlobal, limpiarTokens } from '../ia.js'

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid
        const sender = mensaje.key.participant || mensaje.key.remoteJid
        const isAdmin = await esAdmin(sock, chat, sender)

        const accion = argumentos[0]?.toLowerCase() || 'ver'

        if (accion === 'global') {
            if (!isAdmin) {
                await sock.sendMessage(chat, { text: 'Solo admins pueden ver estadísticas globales.' })
                return
            }
            await mostrarTokensGlobal(sock, chat)
            return
        }

        if (accion === 'limpiar') {
            if (!isAdmin) {
                await sock.sendMessage(chat, { text: 'Solo admins pueden limpiar tokens.' })
                return
            }
            await limpiarTokens(chat)
            await sock.sendMessage(chat, { text: 'Tokens de este grupo limpiados.' })
            return
        }

        // Ver tokens del grupo actual
        await mostrarTokensGrupo(sock, chat)
    }
}

async function mostrarTokensGrupo(sock, chat) {
    const tokens = await obtenerTokens(chat)
    
    if (tokens.total.total === 0) {
        await sock.sendMessage(chat, { text: 'No hay uso de tokens registrado en este grupo.' })
        return
    }

    const lineas = ['Tokens IA - Este grupo', '']

    // Total
    lineas.push(`TOTAL: ${formatearNum(tokens.total.total)} tokens`)
    lineas.push(`  Input:  ${formatearNum(tokens.total.input)}`)
    lineas.push(`  Output: ${formatearNum(tokens.total.output)}`)
    lineas.push('')

    // Por modelo
    if (Object.keys(tokens.porModelo).length > 0) {
        lineas.push('Por modelo:')
        for (const [modelo, data] of Object.entries(tokens.porModelo)) {
            const nombre = modelo.replace('models/', '').replace('gemini-', '')
            lineas.push(`  ${nombre}: ${formatearNum(data.total)} (${data.requests} req)`)
        }
        lineas.push('')
    }

    // Top usuarios
    const usuarios = Object.entries(tokens.porUsuario)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10)

    if (usuarios.length > 0) {
        lineas.push('Top usuarios:')
        for (const [uid, data] of usuarios) {
            lineas.push(`  ${data.nombre}: ${formatearNum(data.total)} (${data.requests} req)`)
        }
    }

    await sock.sendMessage(chat, { text: lineas.join('\n') })
}

async function mostrarTokensGlobal(sock, chat) {
    const global = await obtenerTokensGlobal()
    
    if (global.total.total === 0) {
        await sock.sendMessage(chat, { text: 'No hay uso de tokens registrado globalmente.' })
        return
    }

    const lineas = ['Tokens IA - GLOBAL (todos los grupos)', '']

    lineas.push(`TOTAL: ${formatearNum(global.total.total)} tokens`)
    lineas.push(`  Input:  ${formatearNum(global.total.input)}`)
    lineas.push(`  Output: ${formatearNum(global.total.output)}`)
    lineas.push('')

    // Por modelo
    if (Object.keys(global.porModelo).length > 0) {
        lineas.push('Por modelo:')
        for (const [modelo, data] of Object.entries(global.porModelo)) {
            const nombre = modelo.replace('models/', '').replace('gemini-', '')
            lineas.push(`  ${nombre}: ${formatearNum(data.total)} (${data.requests} req)`)
        }
        lineas.push('')
    }

    // Top chats
    const chats = Object.entries(global.porChat)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10)

    if (chats.length > 0) {
        lineas.push('Top grupos:')
        for (const [chatId, data] of chats) {
            lineas.push(`  ${chatId}: ${formatearNum(data.total)} (${data.requests} req)`)
        }
        lineas.push('')
    }

    // Top usuarios globales
    const usuarios = Object.entries(global.porUsuario)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10)

    if (usuarios.length > 0) {
        lineas.push('Top usuarios (global):')
        for (const [uid, data] of usuarios) {
            lineas.push(`  ${data.nombre}: ${formatearNum(data.total)} (${data.requests} req)`)
        }
    }

    await sock.sendMessage(chat, { text: lineas.join('\n') })
}

function formatearNum(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
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