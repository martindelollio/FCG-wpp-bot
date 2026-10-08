export default {

    async ejecutar({ sock, mensaje }) {
        
        await sock.sendMessage(
            mensaje.key.remoteJid,
            {
                text: `Menu Bot FCG
- /ping: Test de conexión
- /joda: Info de la joda del sábado
                `
            }
        )

    }

}