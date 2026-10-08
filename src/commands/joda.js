export default {

    async ejecutar({ sock, mensaje }) {

        await sock.sendMessage(
            mensaje.key.remoteJid,
            {
                text: `¿Alguno dijo JODAAAA? 😎

Joda en la casa de Fede el sábado 🤑

- Timba 🎰 💰💸💵
- Escabio 🍻🍾🍺
- Drogas 🌿

Todo en la casa de Tapia 🤪

¿Dirección?

El Gorrión 273 🥵`
            }
        )

    }

}