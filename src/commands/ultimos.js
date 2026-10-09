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

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid

        if (argumentos.length === 0) {
            await sock.sendMessage(chat, {
                text: 'Uso: /ultimos <equipo>\nEjemplo: /ultimos boca\nEquipos: boca, river, racing, independiente, san lorenzo, huracan, velez, estudiantes, gimnasia, rosario central, newells, lanus, banfield, talleres, belgrano, instituto, union, colon, defensa, godoy cruz, atletico tucuman, sarmiento, central cordoba, platense, tigre, arsenal, aldosivi, barracas'
            })
            return
        }

        const input = argumentos.join(' ')
        const clave = normalizar(input)
        const equipoBuscado = EQUIPOS_MAP[clave] || input

        try {
            await sock.sendMessage(chat, { text: `Buscando últimos partidos de ${equipoBuscado}...` })

            // Últimos 30 días
            const hoy = new Date()
            const inicio = new Date(hoy.getTime() - 30 * 86400000)
            const fechaInicio = inicio.toISOString().slice(0, 10).replace(/-/g, '')
            const fechaFin = hoy.toISOString().slice(0, 10).replace(/-/g, '')

            const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard?dates=${fechaInicio}-${fechaFin}&limit=100`

            const response = await fetch(url)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const data = await response.json()
            const eventos = data.events || []

            const partidos = []

            for (const ev of eventos) {
                const comp = ev.competitions?.[0]
                if (!comp) continue

                const equipos = comp.competitors || []
                const local = equipos.find(e => e.homeAway === 'home')
                const visita = equipos.find(e => e.homeAway === 'away')

                const nombreLocal = local?.team?.displayName || ''
                const nombreVisita = visita?.team?.displayName || ''

                const coincide = normalizar(nombreLocal).includes(clave) || normalizar(nombreVisita).includes(clave)
                    || normalizar(nombreLocal).includes(normalizar(equipoBuscado)) || normalizar(nombreVisita).includes(normalizar(equipoBuscado))

                if (!coincide) continue

                const estado = comp.status?.type?.state || 'pre'
                if (estado !== 'post') continue // Solo finalizados

                const fecha = comp.date ? new Date(comp.date) : null
                const displayClock = comp.status?.displayClock || 'FT'

                const gLocal = local?.score || '0'
                const gVisita = visita?.score || '0'

                const esLocal = normalizar(nombreLocal).includes(clave) || normalizar(nombreLocal).includes(normalizar(equipoBuscado))
                const rival = esLocal ? nombreVisita : nombreLocal
                const localStr = esLocal ? '(L)' : '(V)'

                // Resultado desde perspectiva del equipo buscado
                const gFavor = esLocal ? gLocal : gVisita
                const gContra = esLocal ? gVisita : gLocal
                let resultado = ''
                if (parseInt(gFavor) > parseInt(gContra)) resultado = '✅ G'
                else if (parseInt(gFavor) === parseInt(gContra)) resultado = '➖ E'
                else resultado = '❌ P'

                partidos.push({ fecha, info: `${gFavor}-${gContra}  ${resultado}`, rival, localStr, displayClock })
            }

            if (partidos.length === 0) {
                await sock.sendMessage(chat, { text: `No se encontraron partidos finalizados para "${equipoBuscado}" en los últimos 30 días.` })
                return
            }

            // Ordenar por fecha descendente (más reciente primero)
            partidos.sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0))

            const lineas = [`Últimos partidos - ${equipoBuscado}`, '']

            for (const p of partidos.slice(0, 10)) {
                const fechaStr = p.fecha ? p.fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '?'
                lineas.push(`${fechaStr}  vs ${p.rival} ${p.localStr}  ${p.info}`)
            }

            // Resumen
            const g = partidos.filter(p => p.info.includes('✅')).length
            const e = partidos.filter(p => p.info.includes('➖')).length
            const p = partidos.filter(p => p.info.includes('❌')).length
            lineas.push('')
            lineas.push(`Resumen: ${g}G - ${e}E - ${p}P (${partidos.length} PJ)`)

            await sock.sendMessage(chat, { text: lineas.join('\n') })

        } catch (e) {
            console.error('Error ultimos:', e)
            await sock.sendMessage(chat, { text: 'Error buscando partidos. Probá más tarde.' })
        }
    }
}