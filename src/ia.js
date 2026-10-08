
import 'dotenv/config'

import { GoogleGenAI } from '@google/genai'

const apiKey =
    process.env.GEMINI_API_KEY

if (!apiKey) {
    throw new Error(
        'Falta GEMINI_API_KEY en el archivo .env'
    )
}

const ai =
    new GoogleGenAI({
        apiKey
    })


/*
    =========================
    IA - TEXTO
    =========================
*/

export async function preguntarIA({
    pregunta,
    personalidad
}) {

    console.log('🤖 Enviando consulta a Gemini...')

    const response =
        await ai.models.generateContent({

            model: 'gemini-3.1-flash-lite',

            contents: pregunta,

            config: {
                systemInstruction: personalidad,
                temperature: 0.9,
                maxOutputTokens: 120
}
        })

    return response.text
}


/*
    =========================
    IA - VOZ
    =========================
*/

export async function generarVoz({
    texto
}) {

    console.log('🔊 Generando voz...')

    const response =
        await ai.models.generateContent({

            model: 'gemini-3.8-flash-tts',

            contents: texto,

            config: {
                responseModalities: ['AUDIO'],

                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: 'Kore'
                        }
                    }
                }
            }
        })

    const parte =
        response.candidates?.[0]
            ?.content?.parts
            ?.find(
                parte =>
                    parte.inlineData?.data
            )

    if (!parte) {
        throw new Error(
            'Gemini no devolvió audio.'
        )
    }

    return Buffer.from(
        parte.inlineData.data,
        'base64'
    )
}
