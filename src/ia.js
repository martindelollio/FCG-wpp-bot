import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'

import { GoogleGenAI } from '@google/genai'
import {
    obtenerMemoriaUsuario,
    agregarHecho,
    agregarInteraccion,
    obtenerTodosIntegrantes
} from './memoria.js'

const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
    throw new Error('Falta GEMINI_API_KEY en el archivo .env')
}

const ai = new GoogleGenAI({ apiKey })

const CONTEXTO_DIR = path.join(process.cwd(), 'data', 'ia-contexto')
const CACHE_INTEGRANTES_DIR = path.join(process.cwd(), 'data', 'cache-integrantes')
const TOKENS_DIR = path.join(process.cwd(), 'data', 'ia-tokens')

async function asegurarDir(dir) {
    await fs.mkdir(dir, { recursive: true })
}

function archivoTokens(chat) {
    const safe = chat.replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(TOKENS_DIR, `${safe}.json`)
}

async function registrarTokens(chat, userId, userName, modelo, usage) {
    await asegurarDir(TOKENS_DIR)
    const archivo = archivoTokens(chat)
    
    let data = { total: { input: 0, output: 0, total: 0 }, porUsuario: {}, porModelo: {}, historial: [] }
    
    try {
        const existing = await fs.readFile(archivo, 'utf8')
        data = JSON.parse(existing)
    } catch {}
    
    const input = usage?.promptTokenCount || 0
    const output = usage?.candidatesTokenCount || 0
    const total = input + output
    
    // Totales globales
    data.total.input += input
    data.total.output += output
    data.total.total += total
    
    // Por usuario
    if (!data.porUsuario[userId]) {
        data.porUsuario[userId] = { nombre: userName, input: 0, output: 0, total: 0, requests: 0 }
    }
    data.porUsuario[userId].nombre = userName
    data.porUsuario[userId].input += input
    data.porUsuario[userId].output += output
    data.porUsuario[userId].total += total
    data.porUsuario[userId].requests += 1
    
    // Por modelo
    if (!data.porModelo[modelo]) {
        data.porModelo[modelo] = { input: 0, output: 0, total: 0, requests: 0 }
    }
    data.porModelo[modelo].input += input
    data.porModelo[modelo].output += output
    data.porModelo[modelo].total += total
    data.porModelo[modelo].requests += 1
    
    // Historial (últimos 100)
    data.historial.push({
        timestamp: Date.now(),
        userId,
        userName,
        modelo,
        input,
        output,
        total
    })
    if (data.historial.length > 100) data.historial = data.historial.slice(-100)
    
    await fs.writeFile(archivo, JSON.stringify(data, null, 2))
}

export async function obtenerTokens(chat) {
    await asegurarDir(TOKENS_DIR)
    const archivo = archivoTokens(chat)
    
    try {
        const data = await fs.readFile(archivo, 'utf8')
        return JSON.parse(data)
    } catch {
        return { total: { input: 0, output: 0, total: 0 }, porUsuario: {}, porModelo: {}, historial: [] }
    }
}

export async function obtenerTokensGlobal() {
    await asegurarDir(TOKENS_DIR)
    const archivos = await fs.readdir(TOKENS_DIR)
    
    let global = { total: { input: 0, output: 0, total: 0 }, porChat: {}, porUsuario: {}, porModelo: {} }
    
    for (const arch of archivos) {
        if (!arch.endsWith('.json')) continue
        const chat = arch.replace('.json', '')
        try {
            const data = await fs.readFile(path.join(TOKENS_DIR, arch), 'utf8')
            const tokens = JSON.parse(data)
            
            global.total.input += tokens.total?.input || 0
            global.total.output += tokens.total?.output || 0
            global.total.total += tokens.total?.total || 0
            
            global.porChat[chat] = {
                total: tokens.total?.total || 0,
                requests: tokens.historial?.length || 0
            }
            
            for (const [uid, udata] of Object.entries(tokens.porUsuario || {})) {
                if (!global.porUsuario[uid]) {
                    global.porUsuario[uid] = { nombre: udata.nombre, input: 0, output: 0, total: 0, requests: 0 }
                }
                global.porUsuario[uid].input += udata.input || 0
                global.porUsuario[uid].output += udata.output || 0
                global.porUsuario[uid].total += udata.total || 0
                global.porUsuario[uid].requests += udata.requests || 0
            }
            
            for (const [modelo, mdata] of Object.entries(tokens.porModelo || {})) {
                if (!global.porModelo[modelo]) {
                    global.porModelo[modelo] = { input: 0, output: 0, total: 0, requests: 0 }
                }
                global.porModelo[modelo].input += mdata.input || 0
                global.porModelo[modelo].output += mdata.output || 0
                global.porModelo[modelo].total += mdata.total || 0
                global.porModelo[modelo].requests += mdata.requests || 0
            }
        } catch {}
    }
    
    return global
}

export async function limpiarTokens(chat) {
    await asegurarDir(TOKENS_DIR)
    await fs.writeFile(archivoTokens(chat), JSON.stringify({ 
        total: { input: 0, output: 0, total: 0 }, 
        porUsuario: {}, 
        porModelo: {}, 
        historial: [] 
    }, null, 2))
}

function archivoContexto(chat) {
    const safe = chat.replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(CONTEXTO_DIR, `${safe}.json`)
}

function archivoCacheIntegrantes(chat) {
    const safe = chat.replace(/[^a-zA-Z0-9_-]/g, '_')
    return path.join(CACHE_INTEGRANTES_DIR, `${safe}.json`)
}

export async function obtenerContexto(chat) {
    await asegurarDir(CONTEXTO_DIR)
    try {
        const data = await fs.readFile(archivoContexto(chat), 'utf8')
        return JSON.parse(data)
    } catch {
        return { habilitado: false, historial: [] }
    }
}

export async function guardarContexto(chat, contexto) {
    await asegurarDir(CONTEXTO_DIR)
    await fs.writeFile(archivoContexto(chat), JSON.stringify(contexto, null, 2))
}

export async function agregarAlContexto(chat, role, content) {
    const contexto = await obtenerContexto(chat)
    if (!contexto.habilitado) return

    contexto.historial.push({ role, content, timestamp: Date.now() })

    if (contexto.historial.length > 20) {
        contexto.historial = contexto.historial.slice(-20)
    }

    await guardarContexto(chat, contexto)
}

export async function limpiarContexto(chat) {
    await asegurarDir(CONTEXTO_DIR)
    await fs.writeFile(archivoContexto(chat), JSON.stringify({ habilitado: false, historial: [] }, null, 2))
}

// Cache de integrantes del grupo (se actualiza cada 1 hora)
export async function obtenerIntegrantesCache(sock, chat) {
    await asegurarDir(CACHE_INTEGRANTES_DIR)
    const archivo = archivoCacheIntegrantes(chat)
    
    try {
        const data = await fs.readFile(archivo, 'utf8')
        const cache = JSON.parse(data)
        if (Date.now() - cache.timestamp < 3600000) { // 1 hora
            return cache.integrantes
        }
    } catch {}

    // Refrescar cache
    try {
        const metadata = await sock.groupMetadata(chat)
        const integrantes = {}
        for (const p of metadata.participants) {
            const id = p.id.split('@')[0]
            integrantes[id] = {
                id,
                nombre: p.pushName || p.notify || p.verifiedName || id,
                admin: p.admin || false
            }
        }
        await fs.writeFile(archivo, JSON.stringify({ integrantes, timestamp: Date.now() }, null, 2))
        return integrantes
    } catch (e) {
        console.error('Error obteniendo integrantes:', e)
        return {}
    }
}

export async function obtenerNombreUsuario(sock, chat, userId) {
    const integrantes = await obtenerIntegrantesCache(sock, chat)
    return integrantes[userId]?.nombre || userId
}

/*
    =========================
    IA - TEXTO CON MEMORIA
    =========================
*/
export async function preguntarIA({
    pregunta,
    personalidad,
    chat,
    sock,
    userId,
    userName
}) {
    console.log('🤖 Enviando consulta a Gemini...')

    // Obtener memoria del usuario
    let memoriaUsuario = null
    let integrantesTexto = ''
    
    if (chat && sock) {
        memoriaUsuario = await obtenerMemoriaUsuario(chat, userId, userName)
        
        // Construir lista de integrantes para el prompt
        const integrantes = await obtenerIntegrantesCache(sock, chat)
        const nombres = Object.values(integrantes).map(i => i.nombre).join(', ')
        if (nombres) {
            integrantesTexto = `\nIntegrantes del grupo: ${nombres}\n`
        }
    }

    const systemInstruction = [
        typeof personalidad === 'string' && personalidad.trim()
            ? personalidad
            : 'Sos FCGbot, un bot argentino. Respondé de forma breve y natural, como en un grupo de WhatsApp.',
        integrantesTexto,
        memoriaUsuario ? construirContextoMemoria(memoriaUsuario, userName) : ''
    ].filter(Boolean).join('\n\n')

    let contents = pregunta

    if (chat) {
        const contexto = await obtenerContexto(chat)
        if (contexto.habilitado && contexto.historial.length > 0) {
            contents = [
                ...contexto.historial.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
                { role: 'user', parts: [{ text: pregunta }] }
            ]
        }
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents,
        config: {
            systemInstruction,
            temperature: 0.9,
            maxOutputTokens: 120
        }
    })

    const respuesta = response.text

    // Registrar tokens
    if (chat && userId && userName && response.usageMetadata) {
        await registrarTokens(chat, userId, userName, 'gemini-3.5-flash-lite', response.usageMetadata)
    }

    // Guardar en contexto conversacional
    if (chat) {
        await agregarAlContexto(chat, 'user', pregunta)
        await agregarAlContexto(chat, 'model', respuesta)
    }

    // Actualizar memoria del usuario (en background, no bloquear)
    if (chat && sock && memoriaUsuario) {
        actualizarMemoriaEnBackground(chat, userId, userName, pregunta, respuesta, sock)
    }

    return respuesta
}

function construirContextoMemoria(memoria, userName) {
    const partes = [`=== MEMORIA DE ${userName.toUpperCase()} ===`]
    
    if (memoria.personalidad) {
        partes.push(`Personalidad detectada: ${memoria.personalidad}`)
    }
    
    if (memoria.hechos.length > 0) {
        partes.push(`Hechos conocidos:`)
        for (const h of memoria.hechos.slice(-15)) {
            partes.push(`  - ${h}`)
        }
    }
    
    if (Object.keys(memoria.preferencias).length > 0) {
        partes.push(`Preferencias:`)
        for (const [k, v] of Object.entries(memoria.preferencias)) {
            partes.push(`  - ${k}: ${v}`)
        }
    }
    
    if (memoria.ultimasInteracciones.length > 0) {
        partes.push(`Últimas charlas:`)
        for (const i of memoria.ultimasInteracciones.slice(-5)) {
            const fecha = new Date(i.fecha).toLocaleDateString('es-AR')
            partes.push(`  - [${fecha}] ${i.resumen}`)
        }
    }
    
    partes.push(`\nUsá esta info para personalizar tu respuesta. NO repitas hechos obvios.`)
    
    return partes.join('\n')
}

async function actualizarMemoriaEnBackground(chat, userId, userName, pregunta, respuesta, sock) {
    // Ejecutar sin await para no bloquear la respuesta
    setImmediate(async () => {
        try {
            // Extraer hechos nuevos usando la IA (versión ligera)
            const hechosNuevos = await extraerHechos(pregunta, respuesta, userName)
            
            for (const hecho of hechosNuevos) {
                await agregarHecho(chat, userId, userName, hecho)
            }
            
            // Actualizar interacciones
            const resumen = `${userName}: "${pregunta.slice(0, 60)}..." → Bot: "${respuesta.slice(0, 60)}..."`
            await agregarInteraccion(chat, userId, userName, resumen)
            
        } catch (e) {
            console.error('Error actualizando memoria:', e)
        }
    })
}

async function extraerHechos(pregunta, respuesta, userName) {
    // Usar una llamada rápida a Gemini para extraer hechos
    // O usar heurísticas simples para no gastar tokens
    const hechos = []
    
    const texto = `${pregunta} ${respuesta}`.toLowerCase()
    
    // Heurísticas simples para detectar hechos
    const patrones = [
        { regex: /me llamo (\w+)/i, tipo: 'nombre', prefijo: 'Se llama ' },
        { regex: /soy (?:de|un|una) ([\w\s]+)/i, tipo: 'origen', prefijo: 'Es ' },
        { regex: /me gusta ([\w\s]+)/i, tipo: 'gusto', prefijo: 'Le gusta ' },
        { regex: /odio ([\w\s]+)/i, tipo: 'disgusto', prefijo: 'Odia ' },
        { regex: /tengo (\d+) (?:años|anios)/i, tipo: 'edad', prefijo: 'Tiene ' },
        { regex: /mi (?:equipo|club) (?:es|favorito) ([\w\s]+)/i, tipo: 'equipo', prefijo: 'Hincha de ' },
        { regex: /trabajo (?:de|en) ([\w\s]+)/i, tipo: 'trabajo', prefijo: 'Trabaja ' },
        { regex: /estudio ([\w\s]+)/i, tipo: 'estudio', prefijo: 'Estudia ' },
    ]
    
    for (const { regex, tipo, prefijo } of patrones) {
        const match = pregunta.match(regex) || respuesta.match(regex)
        if (match && match[1]) {
            const valor = match[1].trim()
            if (valor.length > 1 && valor.length < 50) {
                hechos.push(`${prefijo}${valor.charAt(0).toUpperCase() + valor.slice(1)}`)
            }
        }
    }
    
    // Detectar preferencias explícitas
    if (pregunta.includes('mi color favorito') || pregunta.includes('mi comida favorita')) {
        const match = pregunta.match(/(?:color|comida|serie|película|juego) favorit[oa]? (?:es|es) ([\w\s]+)/i)
        if (match) {
            hechos.push(`Su ${match[0].split(' ')[1]} favorit${match[0].includes('color') ? 'o' : 'a'} es ${match[1]}`)
        }
    }
    
    return [...new Set(hechos)] // Eliminar duplicados
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
        throw new Error('Falta FISH_API_KEY en el archivo .env')
    }

    if (!voiceId) {
        throw new Error('No se especificó una voz de Fish Audio.')
    }

    const response = await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.FISH_API_KEY}`,
            'Content-Type': 'application/json',
            'model': 's2.1-pro-free'
        },
        body: JSON.stringify({
            text: texto,
            reference_id: voiceId,
            format: 'mp3'
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Fish Audio ${response.status}: ${error}`)
    }

    return Buffer.from(await response.arrayBuffer())
}