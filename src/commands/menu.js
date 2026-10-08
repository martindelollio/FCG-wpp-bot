
export default {

    async ejecutar({ sock, mensaje }) {

        const chat = mensaje.key.remoteJid

        const menu = `
╭━━━〔 🤖 FCG BOT 〕━━━╮
┃
┃  📌 COMANDOS
┃
┃  🏓 /ping
┃  🎉 /joda
┃  🔩 /bisagra
┃  🔩 /b
┃
┃  🎥 /video
┃  🎥 /v
┃
┃  🖼️ /sticker
┃  🖼️ /s
┃  🖼️ /toimg
┃
┃  🗿 /violar
┃  🗿 /fede
┃
┃  🤖 /ia
┃  🔊 /ia-audio
┃
┃  🧠 /personalidad
┃  🔄 /reset-personality
┃  🔄 /r
┃
┃  ℹ️ /menu
┃
╰━━━━━━━━━━━━━━━━━━━━╯

🤖 *IA*
/ia <pregunta>
/ia [momo] <pregunta>

/ia-audio <pregunta>
/ia-audio [momo] <pregunta>

🧠 *PERSONALIDADES*
/personalidad
→ Ver personalidad actual

/personalidad momo
→ Cambiar personalidad del grupo

/reset-personality
→ Restaurar personalidad original
`

        await sock.sendMessage(
            chat,
            {
                text: menu
            }
        )
    }
}
