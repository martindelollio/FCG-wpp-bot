const COPAS = {
    'copa argentina': { league: 'arg.2', nombre: 'Copa Argentina' },
    'libertadores': { league: 'conmebol.libertadores', nombre: 'Copa Libertadores' },
    'sudamericana': { league: 'conmebol.sudamericana', nombre: 'Copa Sudamericana' },
}

export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid

        let liga = 'arg.2' // Copa Argentina por defecto
        let nombreCopa = 'Copa Argentina'

        if (argumentos.length > 0) {
            const input = argumentos.join(' ').toLowerCase()
            const encontrada = Object.keys(COPAS).find(k => input.includes(k))
            if (encontrada) {
                liga = COPAS[encontrada].league
                nombreCopa = COPAS[encontrada].nombre
            }
        }

        try {
            await sock.sendMessage(chat, { text: `Buscando partidos ${nombreCopa}...` })

            const hoy = new Date()
            const fecha = hoy.toISOString().slice(0, 10).replace(/-/g, '')

            const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${liga}/scoreboard?dates=${fecha}&limit=50`

            const response = await fetch(url)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const data = await response.json()
            const eventos = data.events || []

            if (eventos.length === 0) {
                await sock.sendMessage(chat, { text: `No hay partidos programados para hoy en ${nombreCopa}.` })
                return
            }

            const lineas = [`${nombreCopa} - ${hoy.toLocaleDateString('es-AR')}`, '']

            for (const ev of eventos) {
                const comp = ev.competitions?.[0]
                if (!comp) continue

                const equipos = comp.competitors || []
                const local = equipos.find(e => e.homeAway === 'home')
                const visita = equipos.find(e => e.homeAway === 'away')

                const nombreLocal = local?.team?.displayName || '?'
                const nombreVisita = visita?.team?.displayName || '?'

                const status = comp.status?.type
                const estado = status?.name || 'Programado'
                const estadoId = status?.id
                const estadoState = status?.state
                const displayClock = comp.status?.displayClock
                const period = comp.status?.period

                const gLocal = local?.score || '0'
                const gVisita = visita?.score || '0'

                let infoPartido = ''

                if (estadoState === 'in' || estado === 'En vivo' || estado === 'Live') {
                    const tiempo = displayClock || (period === 2 ? '2T' : '1T')
                    infoPartido = `EN VIVO ${tiempo}  ${gLocal} - ${gVisita}`
                } else if (estadoState === 'post' || estado === 'Final' || estado === 'Finalizado') {
                    infoPartido = `FT  ${gLocal} - ${gVisita}`
                } else {
                    const hora = comp.date
                        ? new Date(comp.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                        : '?'
                    infoPartido = hora
                }

                lineas.push(`${nombreLocal} vs ${nombreVisita}`)
                lineas.push(`  ${infoPartido}`)
                lineas.push('')
            }

            await sock.sendMessage(chat, { text: lineas.join('\n').trim() })

        } catch (e) {
            console.error('Error copas:', e)
            await sock.sendMessage(chat, { text: 'Error obteniendo partidos. Probá más tarde.' })
        }
    }
}