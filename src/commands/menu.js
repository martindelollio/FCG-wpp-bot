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
┃  🎥 /video
┃  🎥 /v
┃  🖼️ /sticker
┃  🖼️ /s
┃  🖼️ /toimg
┃  🗿 /violar
┃  🗿 /fede
┃
┃  ℹ️ /menu
┃
╰━━━━━━━━━━━━━━━━━━━━╯
`

        await sock.sendMessage(
            chat,
            {
                text: menu
            }
        )
    }
}