
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

    const systemInstruction =
        typeof personalidad === 'string' &&
        personalidad.trim()
            ? personalidad
            : 'Sos FCGbot, un bot argentino. Respondé de forma breve y natural, como en un grupo de WhatsApp.'

    const response =
        await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: pregunta,
            config: {
                systemInstruction,
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
    texto,
    voiceId
}) {

    console.log('🔊 Generando voz con Fish Audio...')

    if (!process.env.FISH_API_KEY) {
        throw new Error(
            'Falta FISH_API_KEY en el archivo .env'
        )
    }

    if (!voiceId) {
        throw new Error(
            'No se especificó una voz de Fish Audio.'
        )
    }

    const response = await fetch(
        'https://api.fish.audio/v1/tts',
        {
            method: 'POST',

            headers: {
                'Authorization':
                    `Bearer ${process.env.FISH_API_KEY}`,

                'Content-Type':
                    'application/json',

                'model':
                    's2.1-pro-free'
            },

            body: JSON.stringify({
                text: texto,
                reference_id: voiceId,
                format: 'mp3'
            })
        }
    )

    if (!response.ok) {

        const error =
            await response.text()

        throw new Error(
            `Fish Audio ${response.status}: ${error}`
        )
    }

    return Buffer.from(
        await response.arrayBuffer()
    )
}