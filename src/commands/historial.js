function normalizar(str) {
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim()
}

const EQUIPOS_MAP = {
    'boca': 'Boca Juniors',
    'river': 'River Plate',
    'racing': 'Racing Club',
    'independiente': 'Independiente',
    'san lorenzo': 'San Lorenzo',
    'huracan': 'Huracan',
    'velez': 'Velez Sarsfield',
    'estudiantes': 'Estudiantes La Plata',
    'gimnasia': 'Gimnasia La Plata',
    'rosario central': 'Rosario Central',
    'newells': "Newell's Old Boys",
    'lanus': 'Lanus',
    'banfield': 'Banfield',
    'talleres': 'Talleres Cordoba',
    'belgrano': 'Belgrano Cordoba',
    'instituto': 'Instituto Cordoba',
    'union': 'Union Santa Fe',
    'colon': 'Colon Santa Fe',
    'defensa y justicia': 'Defensa y Justicia',
    'godoy cruz': 'Godoy Cruz',
    'mendoza': 'Godoy Cruz',
    'atletico tucuman': 'Atletico Tucuman',
    'tucuman': 'Atletico Tucuman',
    'sarmiento': 'Sarmiento Junin',
    'junin': 'Sarmiento Junin',
    'central cordoba': 'Central Cordoba SdE',
    'santiago del estero': 'Central Cordoba SdE',
    'platense': 'Platense',
    'tigre': 'Tigre',
    'arsenal': 'Arsenal Sarandi',
    'sarandi': 'Arsenal Sarandi',
    'aldevi': 'Aldosivi',
    'aldosivi': 'Aldosivi',
    'barracas': 'Barracas Central',
    'central': 'Barracas Central',
}

function resolverEquipo(input) {
    const clave = normalizar(input)
    return EQUIPOS_MAP[clave] || input
}

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid

        if (argumentos.length < 2) {
            await sock.sendMessage(chat, {
                text: 'Uso: /historial <equipo1> <equipo2>\nEjemplo: /historial boca river'
            })
            return
        }

        const input = argumentos.join(' ')
        const partes = input.split(' vs ').map(s => s.trim())
        let eq1, eq2

        if (partes.length === 2) {
            eq1 = resolverEquipo(partes[0])
            eq2 = resolverEquipo(partes[1])
        } else {
            eq1 = resolverEquipo(argumentos[0])
            eq2 = resolverEquipo(argumentos.slice(1).join(' '))
        }

        try {
            await sock.sendMessage(chat, { text: `Buscando historial ${eq1} vs ${eq2}...` })

            // ESPN H2H API
            const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/teams/${encodeURIComponent(eq1)}/vs/${encodeURIComponent(eq2)}`

            const response = await fetch(url)
            if (!response.ok) {
                // Fallback: buscar en scoreboard de últimos años
                return buscarEnScoreboard(chat, sock, eq1, eq2)
            }

            const data = await response.json()
            // La API H2H de ESPN no siempre está disponible, mejor usar scoreboard histórico
            return buscarEnScoreboard(chat, sock, eq1, eq2)

        } catch (e) {
            console.error('Error historial:', e)
            await sock.sendMessage(chat, { text: 'Error buscando historial. Probá más tarde.' })
        }
    }
}

async function buscarEnScoreboard(chat, sock, eq1, eq2) {
    try {
        // Buscar en últimos 5 años
        const hoy = new Date()
        const hace5 = new Date(hoy.getFullYear() - 5, 0, 1)
        const fechaInicio = hace5.toISOString().slice(0, 10).replace(/-/g, '')
        const fechaFin = hoy.toISOString().slice(0, 10).replace(/-/g, '')

        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard?dates=${fechaInicio}-${fechaFin}&limit=500`

        const response = await fetch(url)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        const eventos = data.events || []

        const partidos = []

        for (const ev of eventos) {
            const comp = ev.competitions?.[0]
            if (!comp) continue

            const estado = comp.status?.type?.state || 'pre'
            if (estado !== 'post') continue

            const equipos = comp.competitors || []
            const local = equipos.find(e => e.homeAway === 'home')
            const visita = equipos.find(e => e.homeAway === 'away')

            const nombreLocal = local?.team?.displayName || ''
            const nombreVisita = visita?.team?.displayName || ''

            const coincide = (nombreLocal.includes(eq1) && nombreVisita.includes(eq2)) ||
                           (nombreLocal.includes(eq2) && nombreVisita.includes(eq1))

            if (!coincide) continue

            const fecha = comp.date ? new Date(comp.date) : null
            const gLocal = local?.score || '0'
            const gVisita = visita?.score || '0'

            const eq1EsLocal = nombreLocal.includes(eq1)
            const gEq1 = eq1EsLocal ? gLocal : gVisita
            const gEq2 = eq1EsLocal ? gVisita : gLocal

            let resultado = ''
            if (parseInt(gEq1) > parseInt(gEq2)) resultado = 'G'
            else if (parseInt(gEq1) === parseInt(gEq2)) resultado = 'E'
            else resultado = 'P'

            partidos.push({
                fecha,
                local: nombreLocal,
                visita: nombreVisita,
                gLocal,
                gVisita,
                resultado,
                eq1EsLocal
            })
        }

        if (partidos.length === 0) {
            await sock.sendMessage(chat, { text: `No se encontraron partidos entre ${eq1} y ${eq2}.` })
            return
        }

        // Ordenar por fecha descendente
        partidos.sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0))

        const lineas = [`Historial: ${eq1} vs ${eq2}`, `(${partidos.length} partidos)`, '']

        for (const p of partidos.slice(0, 20)) {
            const fechaStr = p.fecha ? p.fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '?'
            const sede = p.eq1EsLocal ? '(L)' : '(V)'
            lineas.push(`${fechaStr}  ${p.gLocal}-${p.gVisita}  ${p.local} vs ${p.visita}  ${sede}`)
        }

        // Resumen
        const g = partidos.filter(p => p.resultado === 'G').length
        const e = partidos.filter(p => p.resultado === 'E').length
        const p = partidos.filter(p => p.resultado === 'P').length
        lineas.push('')
        lineas.push(`${eq1}: ${g}G - ${e}E - ${p}P`)
        lineas.push(`${eq2}: ${p}G - ${e}E - ${g}P`)

        await sock.sendMessage(chat, { text: lineas.join('\n') })

    } catch (e) {
        console.error('Error historial scoreboard:', e)
        await sock.sendMessage(chat, { text: 'Error buscando historial. Probá más tarde.' })
    }
}