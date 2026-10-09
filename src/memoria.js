import fs from 'fs/promises'
import path from 'path'

const MEMORIA_DIR = path.join(process.cwd(), 'data', 'memoria-grupos')

async function asegurarDir() {
    await fs.mkdir(MEMORIA_DIR, { recursive: true })
}

function archivoMemoria(chat) {
    const safe = chat.replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(MEMORIA_DIR, `${safe}.json`)
}

export async function obtenerMemoria(chat) {
    await asegurarDir()
    try {
        const data = await fs.readFile(archivoMemoria(chat), 'utf8')
        return JSON.parse(data)
    } catch {
        return { integrantes: {}, actualizado: Date.now() }
    }
}

export async function guardarMemoria(chat, memoria) {
    await asegurarDir()
    memoria.actualizado = Date.now()
    await fs.writeFile(archivoMemoria(chat), JSON.stringify(memoria, null, 2))
}

export async function obtenerMemoriaUsuario(chat, userId, userName) {
    const memoria = await obtenerMemoria(chat)
    if (!memoria.integrantes[userId]) {
        memoria.integrantes[userId] = {
            nombre: userName,
            hechos: [],
            preferencias: {},
            personalidad: '',
            ultimasInteracciones: [],
            actualizado: Date.now()
        }
        await guardarMemoria(chat, memoria)
    }
    return memoria.integrantes[userId]
}

export async function agregarHecho(chat, userId, userName, hecho) {
    const memoria = await obtenerMemoria(chat)
    if (!memoria.integrantes[userId]) {
        memoria.integrantes[userId] = {
            nombre: userName,
            hechos: [],
            preferencias: {},
            personalidad: '',
            ultimasInteracciones: [],
            actualizado: Date.now()
        }
    }
    const usuario = memoria.integrantes[userId]
    usuario.nombre = userName // Actualizar nombre por si cambió
    
    // Evitar duplicados
    if (!usuario.hechos.includes(hecho)) {
        usuario.hechos.push(hecho)
        // Mantener solo últimos 50 hechos
        if (usuario.hechos.length > 50) usuario.hechos = usuario.hechos.slice(-50)
        usuario.actualizado = Date.now()
        await guardarMemoria(chat, memoria)
    }
    return usuario
}

export async function agregarPreferencia(chat, userId, userName, clave, valor) {
    const memoria = await obtenerMemoria(chat)
    if (!memoria.integrantes[userId]) {
        memoria.integrantes[userId] = {
            nombre: userName,
            hechos: [],
            preferencias: {},
            personalidad: '',
            ultimasInteracciones: [],
            actualizado: Date.now()
        }
    }
    memoria.integrantes[userId].preferencias[clave] = valor
    memoria.integrantes[userId].actualizado = Date.now()
    await guardarMemoria(chat, memoria)
}

export async function actualizarPersonalidad(chat, userId, userName, descripcion) {
    const memoria = await obtenerMemoria(chat)
    if (!memoria.integrantes[userId]) {
        memoria.integrantes[userId] = {
            nombre: userName,
            hechos: [],
            preferencias: {},
            personalidad: '',
            ultimasInteracciones: [],
            actualizado: Date.now()
        }
    }
    memoria.integrantes[userId].personalidad = descripcion
    memoria.integrantes[userId].actualizado = Date.now()
    await guardarMemoria(chat, memoria)
}

export async function agregarInteraccion(chat, userId, userName, resumen) {
    const memoria = await obtenerMemoria(chat)
    if (!memoria.integrantes[userId]) {
        memoria.integrantes[userId] = {
            nombre: userName,
            hechos: [],
            preferencias: {},
            personalidad: '',
            ultimasInteracciones: [],
            actualizado: Date.now()
        }
    }
    memoria.integrantes[userId].ultimasInteracciones.push({
        fecha: Date.now(),
        resumen
    })
    // Mantener solo últimas 20
    if (memoria.integrantes[userId].ultimasInteracciones.length > 20) {
        memoria.integrantes[userId].ultimasInteracciones = memoria.integrantes[userId].ultimasInteracciones.slice(-20)
    }
    memoria.integrantes[userId].actualizado = Date.now()
    await guardarMemoria(chat, memoria)
}

export async function obtenerContextoUsuario(chat, userId) {
    const memoria = await obtenerMemoria(chat)
    return memoria.integrantes[userId] || null
}

export async function obtenerTodosIntegrantes(chat) {
    const memoria = await obtenerMemoria(chat)
    return memoria.integrantes
}

export async function limpiarMemoriaGrupo(chat) {
    await asegurarDir()
    await fs.writeFile(archivoMemoria(chat), JSON.stringify({ integrantes: {}, actualizado: Date.now() }, null, 2))
}

export async function limpiarMemoriaUsuario(chat, userId) {
    const memoria = await obtenerMemoria(chat)
    if (memoria.integrantes[userId]) {
        delete memoria.integrantes[userId]
        await guardarMemoria(chat, memoria)
    }
}