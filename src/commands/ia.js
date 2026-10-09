
import { preguntarIA } from '../ia.js'
import { obtenerPersonalidad } from '../data.js'
import { personalidades } from '../personalidades.js'

export default {

    async ejecutar({
        sock,
        mensaje,
        argumentos
    }) {

        const chat =
            mensaje.key.remoteJid

        if (argumentos.length === 0) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        'Decime algo.\n\n' +
                        'Ejemplo:\n' +
                        '/ia quién es mejor, sofi maure o bri marcos?\n\n' +
                        'También podés usar una personalidad temporal:\n' +
                        '/ia [momo] quién es mejor?'
                }
            )

            return
        }

        let personalidad
        let pregunta

        const primerArgumento =
            argumentos[0]

        // Detectar [personalidad]
        if (
            primerArgumento.startsWith('[') &&
            primerArgumento.endsWith(']')
        ) {

            const nombre =
                primerArgumento
                    .slice(1, -1)
                    .toLowerCase()

            const preset =
                personalidades[nombre]

            if (!preset) {

                await sock.sendMessage(
                    chat,
                    {
                        text:
                            `No conozco la personalidad *${nombre}*.\n\n` +
                            `Disponibles:\n` +
                            Object.keys(personalidades)
                                .map(p => `• ${p}`)
                                .join('\n')
                    }
                )

                return
            }

            // Personalidad temporal
            personalidad =
                preset.prompt

            pregunta =
                argumentos
                    .slice(1)
                    .join(' ')

        } else {

            // Personalidad permanente del grupo
            personalidad =
                await obtenerPersonalidad(chat)

            pregunta =
                argumentos.join(' ')
        }

        if (!pregunta.trim()) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        ' Te falta la pregunta mogoliquito.'
                }
            )

            return
        }

        try {

            await sock.sendMessage(
                chat,
                {
                    text: '🤖 Pensando...'
                }
            )

            const userId = (mensaje.key.participant || mensaje.key.remoteJid).split('@')[0]
            const userName = mensaje.pushName || userId

            const respuesta =
                await preguntarIA({
                    pregunta,
                    personalidad,
                    chat,
                    sock,
                    userId,
                    userName
                })

            await sock.sendMessage(
                chat,
                {
                    text: respuesta
                }
            )

        } catch (error) {

            console.error(
                '❌ Error IA:',
                error
            )

            await sock.sendMessage(
                chat,
                {
                    text:
                        'la ia de mierda no anda por alguna razon.'
                }
            )
        }
    }
}
