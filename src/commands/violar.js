import fs from 'fs/promises'
import path from 'path'

const fotos = [
    'foto1.jpg',
    'foto2.jpg',
    'foto3.jpg',
    'foto4.jpg',
    'foto5.jpg',
    'foto6.jpg'
]

const texto = 'Usted ha sido violado por Federico (442) Tapia'

export default {

    async ejecutar({ sock, mensaje }) {

        const chat = mensaje.key.remoteJid

        const foto =
            fotos[Math.floor(Math.random() * fotos.length)]

        const ruta = path.join(
            process.cwd(),
            'src',
            'images',
            foto
        )

        const imagen = await fs.readFile(ruta)

        await sock.sendMessage(
            chat,
            {
                image: imagen,
                caption: texto
            }
        )
    }
}