export default {
    async ejecutar({ sock, mensaje }) {
        const chat = mensaje.key.remoteJid

        try {
            await sock.sendMessage(chat, { text: 'Buscando partidos...' })

            const hoy = new Date()
            const fecha = hoy.toISOString().slice(0, 10).replace(/-/g, '')

            // ESPN API para Liga Argentina (arg.1 = Primera División)
            const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/arg.1/scoreboard?dates=${fecha}&limit=50`

            const response = await fetch(url)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const data = await response.json()
            const eventos = data.events || []

            if (eventos.length === 0) {
                await sock.sendMessage(chat, { text: 'No hay partidos programados para hoy en la Liga Argentina.' })
                return
            }

            const lineas = [`Partidos Liga Argentina - ${hoy.toLocaleDateString('es-AR')}`, '']

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
                const estadoState = status?.state // 'pre', 'in', 'post'
                const displayClock = comp.status?.displayClock // ej: "46'", "HT", "FT"
                const period = comp.status?.period // 1, 2, etc

                const gLocal = local?.score || '0'
                const gVisita = visita?.score || '0'

                let infoPartido = ''

                if (estadoState === 'in' || estado === 'En vivo' || estado === 'Live') {
                    // EN VIVO: muestra minuto y marcador
                    const tiempo = displayClock || (period === 2 ? '2T' : '1T')
                    infoPartido = `EN VIVO ${tiempo}  ${gLocal} - ${gVisita}`
                } else if (estadoState === 'post' || estado === 'Final' || estado === 'Finalizado') {
                    // FINALIZADO: muestra FT y marcador
                    infoPartido = `FT  ${gLocal} - ${gVisita}`
                } else {
                    // PROGRAMADO: muestra hora
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
            console.error('Error partidos:', e)
            await sock.sendMessage(chat, { text: 'Error obteniendo partidos. Probá más tarde.' })
        }
    }
}