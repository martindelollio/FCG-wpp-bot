
export default {

    async ejecutar({ sock, mensaje }) {

        const chat = mensaje.key.remoteJid

        const menu = `
=== FCG BOT ===

COMANDOS
  /ping
  /joda
  /bisagra, /b [IMPORTANTE]
  /video, /v
  /tomp3
  /sticker, /s
  /toimg
  /violar, /fede
  /ia
  /personalidad
  /reset-personality, /r
  /log
  /menu

IA
  /ia <pregunta>
  /ia [momo] <pregunta>
  /ia-audio <pregunta>
  /ia-audio [momo] <pregunta>

PERSONALIDADES
  /personalidad
  /personalidad momo
  /reset-personality

SISTEMA
  /log
`

        await sock.sendMessage(
            chat,
            {
                text: menu
            }
        )
    }
}
