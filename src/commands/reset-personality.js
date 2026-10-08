import {
    resetearPersonalidad
} from '../data.js'


export default {

    async ejecutar({
        sock,
        mensaje
    }) {

        const chat =
            mensaje.key.remoteJid

        await resetearPersonalidad(chat)

        await sock.sendMessage(
            chat,
            {
                text:
                    'Personalidad base de piola.'
            }
        )
    }
}