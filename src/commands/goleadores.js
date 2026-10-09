export default {
    async ejecutar({ sock, mensaje }) {
        const chat = mensaje.key.remoteJid

        try {
            await sock.sendMessage(chat, { text: 'Obteniendo goleadores...' })

            // Obtener goleadores del scoreboard (última fecha con datos)
            const hoy = new Date()
            const fecha = hoy.toISOString().slice(0, 10).replace(/-/g, '')
            const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard?dates=${fecha}&limit=50`

            const response = await fetch(url)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const data = await response.json()
            const eventos = data.events || []

            // Recopilar todos los líderes de goles de todos los partidos
            const goleadoresMap = new Map()

            for (const ev of eventos) {
                const comp = ev.competitions?.[0]
                if (!comp) continue

                const leaders = comp.leaders || []
                for (const cat of leaders) {
                    if (cat.name === 'goals' || cat.displayName === 'Goals') {
                        for (const l of cat.leaders || []) {
                            const nombre = l.athlete?.displayName || '?'
                            const equipoId = l.athlete?.team?.id
                            const goles = l.displayValue || '0'
                            const jersey = l.athlete?.jersey || ''
                            const pos = l.athlete?.position?.abbreviation || ''

                            // Buscar nombre del equipo
                            let equipo = ''
                            if (equipoId) {
                                const equipos = comp.competitors || []
                                const eq = equipos.find(e => e.team?.id === String(equipoId))
                                equipo = eq?.team?.displayName || ''
                            }

                            const clave = `${nombre}-${equipo}`
                            const actual = goleadoresMap.get(clave) || 0
                            goleadoresMap.set(clave, Math.max(actual, parseInt(goles)))
                        }
                    }
                }
            }

            if (goleadoresMap.size === 0) {
                await sock.sendMessage(chat, { text: 'No hay datos de goleadores disponibles.' })
                return
            }

            // Ordenar por goles descendente
            const ordenados = Array.from(goleadoresMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15)

            const lineas = ['Goleadores Liga Argentina', '']

            for (let i = 0; i < ordenados.length; i++) {
                const [clave, goles] = ordenados[i]
                const [nombre, equipo] = clave.split('-')
                const pos = '' // No tenemos posición fácil desde acá
                lineas.push(`${(i + 1).toString().padStart(2)}. ${nombre} (${equipo || '?'}) - ${goles} gol${goles !== 1 ? 'es' : ''}`)
            }

            await sock.sendMessage(chat, { text: lineas.join('\n') })

        } catch (e) {
            console.error('Error goleadores:', e)
            await sock.sendMessage(chat, { text: 'Error obteniendo goleadores. Probá más tarde.' })
        }
    }
}