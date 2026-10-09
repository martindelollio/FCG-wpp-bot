const ESTADOS = {}

const DIRECCIONES = ['izquierda', 'centro', 'derecha']
const EMOJIS = { izquierda: '⬅️', centro: '⬆️', derecha: '➡️' }

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid
        const sender = mensaje.key.participant || mensaje.key.remoteJid

        if (argumentos[0] === 'cancelar') {
            if (ESTADOS[chat] && ESTADOS[chat].jugador === sender) {
                delete ESTADOS[chat]
                await sock.sendMessage(chat, { text: 'Partido cancelado.' })
            }
            return
        }

        // Ver si hay partida en curso
        if (ESTADOS[chat]) {
            const juego = ESTADOS[chat]

            if (juego.fase === 'usuario_tira' && sender === juego.jugador) {
                return procesarTiroUsuario(sock, chat, juego, argumentos[0])
            }

            if (juego.fase === 'usuario_ataja' && sender === juego.jugador) {
                return procesarAtajadaUsuario(sock, chat, juego, argumentos[0])
            }

            await sock.sendMessage(chat, {
                text: `Ya hay un partido en curso. Esperá tu turno o usá /penales cancelar`
            })
            return
        }

        // Nueva partida
        ESTADOS[chat] = {
            jugador: sender,
            fase: 'usuario_tira',
            tiros: 0,
            golesUsuario: 0,
            golesBot: 0,
            historial: []
        }

        await sock.sendMessage(chat, {
            text: `⚽ PENALES - Vos vs Bot\n\nTiro 1 de 5 - Tu turno de PATEAR\n\nElegí: izquierda, centro o derecha`
        })
    }
}

async function procesarTiroUsuario(sock, chat, juego, dir) {
    const direccion = normalizarDir(dir)
    if (!direccion) {
        await sock.sendMessage(chat, { text: 'Dirección inválida. Usá: izquierda, centro o derecha' })
        return
    }

    const botDir = DIRECCIONES[Math.floor(Math.random() * 3)]
    const gol = direccion !== botDir

    if (gol) juego.golesUsuario++

    juego.historial.push({ tiro: juego.tiros + 1, tipo: 'usuario', direccion, botDir, gol })
    juego.fase = 'usuario_ataja'
    juego.tiros++

    const emojiGol = gol ? '⚽ GOL' : '🧤 AT AJADA'
    await sock.sendMessage(chat, {
        text: `Tiro ${juego.tiros}: Pateaste a ${direccion} ${EMOJIS[direccion]}\nBot se tiró a ${botDir} ${EMOJIS[botDir]}\n${emojiGol}\n\n--- Marcador: Vos ${juego.golesUsuario} - ${juego.golesBot} Bot ---\n\nTiro ${juego.tiros + 1} de 5 - Tu turno de ATAJAR\n\nElegí: izquierda, centro o derecha`
    })
}

async function procesarAtajadaUsuario(sock, chat, juego, dir) {
    const direccion = normalizarDir(dir)
    if (!direccion) {
        await sock.sendMessage(chat, { text: 'Dirección inválida. Usá: izquierda, centro o derecha' })
        return
    }

    const botDir = DIRECCIONES[Math.floor(Math.random() * 3)]
    const atajada = direccion === botDir

    if (!atajada) juego.golesBot++

    juego.historial.push({ tiro: juego.tiros, tipo: 'bot', direccion: botDir, usuarioDir: direccion, gol: !atajada })

    const emojiGol = atajada ? '🧤 AT AJADA' : '⚽ GOL'
    await sock.sendMessage(chat, {
        text: `Tiro ${juego.tiros}: Bot pateó a ${botDir} ${EMOJIS[botDir]}\nTe tiraste a ${direccion} ${EMOJIS[direccion]}\n${emojiGol}\n\n--- Marcador: Vos ${juego.golesUsuario} - ${juego.golesBot} Bot ---`
    })

    if (juego.tiros >= 5) {
        return finalizarPartido(sock, chat, juego)
    }

    juego.fase = 'usuario_tira'

    await sock.sendMessage(chat, {
        text: `Tiro ${juego.tiros + 1} de 5 - Tu turno de PATEAR\n\nElegí: izquierda, centro o derecha`
    })
}

async function finalizarPartido(sock, chat, juego) {
    let resultado = ''
    if (juego.golesUsuario > juego.golesBot) resultado = '🏆 ¡GANASTE!'
    else if (juego.golesUsuario < juego.golesBot) resultado = '🤖 Ganó el bot'
    else resultado = '🤝 EMPATE'

    const lineas = [
        '=== PARTIDO TERMINADO ===',
        '',
        `Marcador final: Vos ${juego.golesUsuario} - ${juego.golesBot} Bot`,
        resultado,
        '',
        'Resumen:'
    ]

    for (const h of juego.historial) {
        if (h.tipo === 'usuario') {
            lineas.push(`  Tiro ${h.tiro} (Vos): ${h.direccion} vs Bot ${h.botDir} - ${h.gol ? 'GOL' : 'ATAJADA'}`)
        } else {
            lineas.push(`  Tiro ${h.tiro} (Bot): ${h.direccion} vs Vos ${h.usuarioDir} - ${h.gol ? 'GOL' : 'ATAJADA'}`)
        }
    }

    delete ESTADOS[chat]
    await sock.sendMessage(chat, { text: lineas.join('\n') })
}

function normalizarDir(str) {
    if (!str) return null
    const s = str.toLowerCase().trim()
    if (['izquierda', 'izq', 'i', 'left', 'l'].includes(s)) return 'izquierda'
    if (['centro', 'c', 'center', 'medio', 'm'].includes(s)) return 'centro'
    if (['derecha', 'der', 'd', 'right', 'r'].includes(s)) return 'derecha'
    return null
}