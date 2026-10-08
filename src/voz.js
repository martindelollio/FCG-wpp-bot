
import { execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'

const execFileAsync =
    promisify(execFile)


export async function convertirAVozWhatsApp(
    audioBuffer
) {

    const carpeta =
        await fs.mkdtemp(
            path.join(
                os.tmpdir(),
                'fcgbot-voz-'
            )
        )

    const entrada =
        path.join(
            carpeta,
            'entrada.wav'
        )

    const salida =
        path.join(
            carpeta,
            'salida.ogg'
        )

    try {

        await fs.writeFile(
            entrada,
            audioBuffer
        )

        await execFileAsync(
            'ffmpeg',
            [
                '-y',

                '-i',
                entrada,

                '-c:a',
                'libopus',

                '-b:a',
                '32k',

                '-ar',
                '48000',

                '-ac',
                '1',

                salida
            ]
        )

        const audio =
            await fs.readFile(
                salida
            )

        return audio

    } finally {

        await fs.rm(
            carpeta,
            {
                recursive: true,
                force: true
            }
        )
    }
}
