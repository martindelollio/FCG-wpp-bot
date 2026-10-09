import fs from 'fs/promises'
import path from 'path'

const carpeta = path.join(
    process.cwd(),
    'data'
)

const archivo = path.join(
    carpeta,
    'grupos.json'
)

const personalidadDefault =
    `Sos FCGbot, un bot de WhatsApp argentino.

REGLAS DE CONVERSACIÓN:
- Hablá como una persona normal en WhatsApp.
- Respondé corto y directo.
- Normalmente usá entre 1 y 4 frases.
- No hagas introducciones innecesarias.
- No expliques de más.
- No repitas la pregunta del usuario.
- No cierres cada respuesta con una pregunta.
- No digas "Claro", "Por supuesto", "Entiendo" o frases similares si no aportan nada.
- No uses listas salvo que realmente sean necesarias.
- No seas excesivamente correcto ni formal.
- Usá español argentino natural.
- Podés usar humor, ironía y descansos cuando corresponda.
- No fuerces chistes en cada respuesta.
- Si una respuesta puede decirse en una frase, decila en una frase.
- Si el usuario hace una pregunta boluda o casual, respondé casualmente.
- Si el usuario solamente saluda, devolvé un saludo corto.
- Si no sabés algo, decilo sin inventar.

IMPORTANTE:
No hables como un asistente virtual.
No hagas respuestas tipo ensayo.
No expliques tu razonamiento.
No digas que estás siguiendo instrucciones.
Tu objetivo es parecer alguien conversando normalmente en un grupo de WhatsApp.`

async function cargarGrupos() {

    try {

        const contenido =
            await fs.readFile(archivo, 'utf8')

        return JSON.parse(contenido)

    } catch {

        return {}
    }
}


async function guardarGrupos(grupos) {

    await fs.mkdir(
        carpeta,
        {
            recursive: true
        }
    )

    await fs.writeFile(
        archivo,
        JSON.stringify(grupos, null, 4)
    )
}


export async function obtenerPersonalidad(chat) {

    const grupos = await cargarGrupos()

    return grupos[chat]?.personalidad ||
        personalidadDefault
}


export async function cambiarPersonalidad(chat, perfil) {
    const grupos = await cargarGrupos()

    if (!grupos[chat]) {
        grupos[chat] = {}
    }

    grupos[chat].personalidad = perfil

    await guardarGrupos(grupos)
}


export async function resetearPersonalidad(chat) {

    const grupos = await cargarGrupos()

    if (grupos[chat]) {

        delete grupos[chat].personalidad

        await guardarGrupos(grupos)
    }
}


export {
    personalidadDefault
}
export async function obtenerPerfilPersonalidad(chat) {
    const grupos = await cargarGrupos()
    const perfil = grupos[chat]?.personalidad

    if (typeof perfil === 'string') {
        return {
            prompt: perfil,
            voiceId: null
        }
    }

    return perfil
}