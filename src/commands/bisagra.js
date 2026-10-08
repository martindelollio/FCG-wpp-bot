const NUMERO_BISAGRA = '5492235252326@s.whatsapp.net'

export default {

    async ejecutar({ sock, mensaje }) {

        const chat = mensaje.key.remoteJid

        await sock.sendMessage(
            chat,
            {
                text: `@${NUMERO_BISAGRA.split('@')[0]} ¿Encontraste la bisagra?`,
                mentions: [NUMERO_BISAGRA]
            }
        )

    }

}