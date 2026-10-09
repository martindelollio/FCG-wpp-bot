
import {
    preguntarIA,
    generarVoz
} from '../ia.js'

import {
    obtenerPersonalidad
} from '../data.js'

import {
    personalidades
} from '../personalidades.js'

import {
    convertirAVozWhatsApp
} from '../voz.js'


export default {

    async ejecutar({
        sock,
        mensaje,
        argumentos
    }) {

        const chat =
            mensaje.key.remoteJid

        if (
            argumentos.length === 0
        ) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        '🔊 Decime algo.\n\n' +
                        'Ejemplo:\n' +
                        '/ia-audio [momo] contame un chiste'
                }
            )

            return
        }


        let personalidad
        let pregunta
        let voiceId


        /*
            =========================
            PERSONALIDAD
            =========================
        */

        const primerArgumento =
            argumentos[0]


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
                            `❌ No conozco la personalidad *${nombre}*.\n\n` +
                            `Disponibles:\n` +
                            Object.keys(
                                personalidades
                            )
                                .map(
                                    p => `• ${p}`
                                )
                                .join('\n')
                    }
                )

                return
            }


            personalidad =
                preset.prompt

            voiceId =
                preset.voiceId


            pregunta =
                argumentos
                    .slice(1)
                    .join(' ')

        } else {

            personalidad =
                await obtenerPersonalidad(
                    chat
                )

            pregunta =
                argumentos.join(' ')

            voiceId =
                personalidades.momo.voiceId
        }


        if (
            !pregunta.trim()
        ) {

            await sock.sendMessage(
                chat,
                {
                    text:
                        'Te falta la pregunta, te cojo?.'
                }
            )

            return
        }


        try {

            /*
                =========================
                PENSANDO
                =========================
            */

            await sock.sendMessage(
                chat,
                {
                    text:
                        ' Pensando... (en tu colita)'
                }
            )


            /*
                =========================
                GEMINI
                =========================
            */

            const respuesta =
                await preguntarIA({
                    pregunta,
                    personalidad
                })


            console.log(
                '💬 Respuesta:',
                respuesta
            )


            /*
                =========================
                TTS
                =========================
            */

            const audio =
                await generarVoz({
                    texto: respuesta,
                    voiceId
                })


            /*
                =========================
                FFMPEG
                =========================
            */

            const audioWhatsApp =
                await convertirAVozWhatsApp(
                    audio
                )


            /*
                =========================
                WHATSAPP
                =========================
            */

            await sock.sendMessage(
                chat,
                {
                    audio: audioWhatsApp,
                    mimetype:
                        'audio/ogg; codecs=opus',
                    ptt: true
                }
            )


        } catch (error) {

            console.error(
                '❌ Error IA AUDIO:',
                error
            )


            await sock.sendMessage(
                chat,
                {
                    text:
                        'No pude generar el audio.'
                }
            )
        }
    }
}