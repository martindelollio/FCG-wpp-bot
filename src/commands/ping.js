export default {

    async ejecutar({ sock, mensaje }) {

        await sock.sendMessage(
            mensaje.key.remoteJid,
            {
                text: '🏓 Pong!'
            }
        )

    }

}