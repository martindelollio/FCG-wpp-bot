import { comandos } from './commands/index.js'

export async function manejarMensaje(sock, mensaje) {

    const texto =
        mensaje.message?.conversation ||
        mensaje.message?.extendedTextMessage?.text ||
        mensaje.message?.imageMessage?.caption

    if (!texto) {
        return
    }

    console.log('📩 Mensaje:', texto)

    if (!texto.startsWith('/')) {
        return
    }

    const partes = texto.slice(1).trim().split(/\s+/)

    const nombreComando = partes[0].toLowerCase()
    const argumentos = partes.slice(1)

    console.log('⚙️ Comando:', nombreComando)
    console.log('📦 Argumentos:', argumentos)

    const comando = comandos[nombreComando]

    if (!comando) {
        await sock.sendMessage(
            mensaje.key.remoteJid,
            {
                text: '❌ No conozco ese comando.'
            }
        )

        return
    }

    await comando.ejecutar({
        sock,
        mensaje,
        argumentos
    })
}