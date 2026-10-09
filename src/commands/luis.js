export default{

    async ejecutar({ sock, mensaje }) {

        await sock.sendMessage(
            mensaje.key.remoteJid,
            {
                text: `Hola soy luis juliano y me gustan los parlantes.`
            }
        )

    }

}