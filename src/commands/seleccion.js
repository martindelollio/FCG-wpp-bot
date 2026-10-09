export default {
    async ejecutar({ sock, mensaje }) {
        const chat = mensaje.key.remoteJid

        try {
            await sock.sendMessage(chat, { text: 'Buscando partidos de la Selección...' })

            // Buscar en un rango amplio (últimos 6 meses - próximos 6 meses)
            const hoy = new Date()
            const hace6 = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1)
            const dentro6 = new Date(hoy.getFullYear(), hoy.getMonth() + 6, 0)

            const fechaInicio = hace6.toISOString().slice(0, 10).replace(/-/g, '')
            const fechaFin = dentro6.toISOString().slice(0, 10).replace(/-/g, '')

            // Buscar en competiciones internacionales donde juega Argentina
            // Argentina ID en ESPN suele ser 6 (national team)
            const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${fechaInicio}-${fechaFin}&limit=100&team=6`

            const response = await fetch(url)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const data = await response.json()
            const eventos = data.events || []

            // Filtrar solo donde juega Argentina
            const partidosArg = eventos.filter(ev => {
                const comp = ev.competitions?.[0]
                if (!comp) return false
                const equipos = comp.competitors || []
                return equipos.some(e => e.team?.displayName?.includes('Argentina'))
            })

            if (partidosArg.length === 0) {
                await sock.sendMessage(chat, { text: 'No hay partidos programados ni recientes de la Selección Argentina en el rango buscado.' })
                return
            }

            const pasados = []
            const futuros = []

            for (const ev of partidosArg) {
                const comp = ev.competitions?.[0]
                if (!comp) continue

                const equipos = comp.competitors || []
                const local = equipos.find(e => e.homeAway === 'home')
                const visita = equipos.find(e => e.homeAway === 'away')

                const nombreLocal = local?.team?.displayName || '?'
                const nombreVisita = visita?.team?.displayName || '?'

                const rival = nombreLocal.includes('Argentina') ? nombreVisita : nombreLocal
                const esLocal = nombreLocal.includes('Argentina')
                const sede = esLocal ? '(L)' : '(V)'

                const status = comp.status?.type
                const estadoState = status?.state
                const displayClock = comp.status?.displayClock
                const period = comp.status?.period

                const gLocal = local?.score || '0'
                const gVisita = visita?.score || '0'

                const gArg = esLocal ? gLocal : gVisita
                const gRival = esLocal ? gVisita : gLocal

                let info = ''
                if (estadoState === 'in') {
                    const tiempo = displayClock || (period === 2 ? '2T' : '1T')
                    info = `EN VIVO ${tiempo}  ${gArg} - ${gRival}`
                } else if (estadoState === 'post') {
                    info = `FT  ${gArg} - ${gRival}`
                } else {
                    const fecha = comp.date ? new Date(comp.date) : null
                    info = fecha ? fecha.toLocaleString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '?'
                }

                const competicion = comp.notes?.[0]?.headline || ev.league?.name || 'Amistoso'

                const item = { fecha: comp.date ? new Date(comp.date) : null, rival, sede, info, competicion, estadoState }

                if (estadoState === 'post') pasados.push(item)
                else futuros.push(item)
            }

            const lineas = ['🇦🇷 Selección Argentina', '']

            if (futuros.length > 0) {
                lineas.push('📅 PRÓXIMOS PARTIDOS')
                futuros.sort((a, b) => (a.fecha?.getTime() || 0) - (b.fecha?.getTime() || 0))
                for (const p of futuros.slice(0, 5)) {
                    const fechaStr = p.fecha ? p.fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }) : '?'
                    lineas.push(`  ${fechaStr}  vs ${p.rival} ${p.sede}  ${p.info}`)
                    lineas.push(`    ${p.competicion}`)
                }
                lineas.push('')
            }

            if (pasados.length > 0) {
                lineas.push('✅ ÚLTIMOS RESULTADOS')
                pasados.sort((a, b) => (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0))
                for (const p of pasados.slice(0, 5)) {
                    const fechaStr = p.fecha ? p.fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) : '?'
                    lineas.push(`  ${fechaStr}  vs ${p.rival} ${p.sede}  ${p.info}`)
                    lineas.push(`    ${p.competicion}`)
                }
            }

            await sock.sendMessage(chat, { text: lineas.join('\n').trim() })

        } catch (e) {
            console.error('Error seleccion:', e)
            await sock.sendMessage(chat, { text: 'Error obteniendo partidos. Probá más tarde.' })
        }
    }
}