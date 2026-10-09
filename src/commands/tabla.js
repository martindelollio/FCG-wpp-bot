export default {
    async ejecutar({ sock, mensaje, argumentos }) {
        const chat = mensaje.key.remoteJid

        try {
            await sock.sendMessage(chat, { text: 'Obteniendo tabla...' })

            // ESPN standings API for Liga Argentina
            const url = 'https://site.web.api.espn.com/apis/v2/sports/soccer/arg.1/standings?region=us&lang=en&contentorigin=espn'

            const response = await fetch(url)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const data = await response.json()
            const standings = data.children?.[0]?.standings?.entries || []

            if (standings.length === 0) {
                await sock.sendMessage(chat, { text: 'No hay datos de tabla disponibles.' })
                return
            }

            const lineas = ['Tabla Liga Argentina', '']

            for (const eq of standings) {
                const pos = eq.stats?.find(s => s.name === 'rank')?.displayValue || '?'
                const nombre = eq.team?.displayName || '?'
                const pts = eq.stats?.find(s => s.name === 'points')?.displayValue || '0'
                const pj = eq.stats?.find(s => s.name === 'gamesPlayed')?.displayValue || '0'
                const pg = eq.stats?.find(s => s.name === 'wins')?.displayValue || '0'
                const pe = eq.stats?.find(s => s.name === 'draws')?.displayValue || '0'
                const pp = eq.stats?.find(s => s.name === 'losses')?.displayValue || '0'
                const gf = eq.stats?.find(s => s.name === 'goalsFor')?.displayValue || '0'
                const gc = eq.stats?.find(s => s.name === 'goalsAgainst')?.displayValue || '0'
                const dg = eq.stats?.find(s => s.name === 'goalDifferential')?.displayValue || '0'

                lineas.push(`${pos.padStart(2)}. ${nombre.padEnd(20)} ${pts} pts | PJ ${pj} | ${pg}-${pe}-${pp} | ${gf}:${gc} (${dg > 0 ? '+' : ''}${dg})`)
            }

            await sock.sendMessage(chat, { text: lineas.join('\n') })

        } catch (e) {
            console.error('Error tabla:', e)
            await sock.sendMessage(chat, { text: 'Error obteniendo tabla. Probá más tarde.' })
        }
    }
}