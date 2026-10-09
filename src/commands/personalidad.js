import {
    obtenerPersonalidad,
    cambiarPersonalidad
} from '../data.js'

import { personalidades } from '../personalidades.js'

export default {

    async ejecutar({
        sock,
        mensaje,
        argumentos
    }) {

        const chat =
            mensaje.key.remoteJid

        const nombre =
            argumentos.join(' ').toLowerCase().trim()

        // /personalidad
        // Muestra la personalidad actual
        if (!nombre) {

            const actual =
                await obtenerPersonalidad(chat)

            const disponibles =
                Object.keys(personalidades)
                    .map(nombre => `• ${nombre}`)
                    .join('\n')

            await sock.sendMessage(
                chat,
                {
                    text:
                        `*Personalidad actual*\n\n` +
                        `${actual}\n\n` +
                        `*Personalidades disponibles:*\n\n` +
                        `${disponibles}\n\n` +
                        `Usá:\n` +
                        `/personalidad momo`
                }
            )

            return
        }

        // Busca la personalidad
        const personalidad =
            personalidades[nombre]

        // Si no existe
        if (!personalidad) {

            const disponibles =
                Object.keys(personalidades)
                    .map(nombre => `• ${nombre}`)
                    .join('\n')

            await sock.sendMessage(
                chat,
                {
                    text:
                        `❌ No conozco la personalidad *${nombre}*.\n\n` +
                        `🎭 *Disponibles:*\n\n` +
                        `${disponibles}`
                }
            )

            return
        }

        // Guarda la personalidad para este grupo
        await cambiarPersonalidad(chat, {
            nombre,
            prompt: personalidad.prompt,
            voiceId: personalidad.voiceId
        })

        await sock.sendMessage(
            chat,
            {
                text:
                    `Personalidad cambiada a *${nombre}*.\n\n` +
                    `Ahora /ia va a responder usando esta personalidad pelotudito.`
            }
        )
    }
}