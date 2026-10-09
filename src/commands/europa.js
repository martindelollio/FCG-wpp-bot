const LIGAS_EUROPA = {
    'premier': { league: 'eng.1', nombre: 'Premier League', emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    'laliga': { league: 'esp.1', nombre: 'La Liga', emoji: '🇪🇸' },
    'serie a': { league: 'ita.1', nombre: 'Serie A', emoji: '🇮🇹' },
    'bundesliga': { league: 'ger.1', nombre: 'Bundesliga', emoji: '🇩🇪' },
    'ligue 1': { league: 'fra.1', nombre: 'Ligue 1', emoji: '🇫🇷' },
    'champions': { league: 'uefa.champions', nombre: 'Champions League', emoji: '🏆' },
    'europa league': { league: 'uefa.europa', nombre: 'Europa League', emoji: '🏆' },
}

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid

        let ligas = Object.values(LIGAS_EUROPA)

        if (argumentos.length > 0) {
            const input = argumentos.join(' ').toLowerCase()
            const filtradas = Object.values(LIGAS_EUROPA).filter(l =>
                input.includes(l.nombre.toLowerCase()) ||
                Object.keys(LIGAS_EUROPA).some(k => input.includes(k) && LIGAS_EUROPA[k] === l)
            )
            if (filtradas.length > 0) ligas = filtradas
        }

        try {
            await sock.sendMessage(chat, { text: 'Buscando partidos europeos...' })

            const hoy = new Date()
            const fecha = hoy.toISOString().slice(0, 10).replace(/-/g, '')

            const todasLineas = []

            for (const liga of ligas) {
                const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${liga.league}/scoreboard?dates=${fecha}&limit=50`

                try {
                    const response = await fetch(url)
                    if (!response.ok) continue

                    const data = await response.json()
                    const eventos = data.events || []

                    if (eventos.length === 0) continue

                    const lineasLiga = [`${liga.emoji} ${liga.nombre}`, '']

                    for (const ev of eventos.slice(0, 8)) {
                        const comp = ev.competitions?.[0]
                        if (!comp) continue

                        const equipos = comp.competitors || []
                        const local = equipos.find(e => e.homeAway === 'home')
                        const visita = equipos.find(e => e.homeAway === 'away')

                        const nombreLocal = local?.team?.displayName || '?'
                        const nombreVisita = visita?.team?.displayName || '?'

                        const status = comp.status?.type
                        const estadoState = status?.state
                        const displayClock = comp.status?.displayClock
                        const period = comp.status?.period

                        const gLocal = local?.score || '0'
                        const gVisita = visita?.score || '0'

                        let infoPartido = ''

                        if (estadoState === 'in') {
                            const tiempo = displayClock || (period === 2 ? '2T' : '1T')
                            infoPartido = `EN VIVO ${tiempo}  ${gLocal} - ${gVisita}`
                        } else if (estadoState === 'post') {
                            infoPartido = `FT  ${gLocal} - ${gVisita}`
                        } else {
                            const hora = comp.date
                                ? new Date(comp.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                                : '?'
                            infoPartido = hora
                        }

                        lineasLiga.push(`${nombreLocal} vs ${nombreVisita}`)
                        lineasLiga.push(`  ${infoPartido}`)
                    }

                    if (lineasLiga.length > 2) {
                        todasLineas.push(...lineasLiga)
                        todasLineas.push('')
                    }
                } catch (e) {
                    console.error(`Error liga ${liga.nombre}:`, e)
                }
            }

            if (todasLineas.length === 0) {
                await sock.sendMessage(chat, { text: 'No hay partidos programados para hoy en las ligas seleccionadas.' })
                return
            }

            // Agregar header
            todasLineas.unshift(`Partidos Europa - ${hoy.toLocaleDateString('es-AR')}`)
            todasLineas.unshift('')

            await sock.sendMessage(chat, { text: todasLineas.join('\n').trim() })

        } catch (e) {
            console.error('Error europa:', e)
            await sock.sendMessage(chat, { text: 'Error obteniendo partidos. Probá más tarde.' })
        }
    }
}