
export default {

    async ejecutar({ sock, mensaje }) {

        const chat = mensaje.key.remoteJid

        const menu = `
=== FCG BOT ===

COMANDOS
  /ping
  /joda
  /bisagra, /b
  /video, /v
  /tomp3
  /sticker, /s
  /toimg
  /violar, /fede
  /ia
  /ia-audio
  /personalidad
  /reset-personality, /r
  /recordatorio
  /qr
  /partidos
  /tabla
  /goleadores
  /proximos
  /ultimos
  /historial
  /copas
  /europa
  /seleccion
  /penales
  /ia-contexto
  /ia-contextover
  /ia-memoria
  /ia-tokens
  /log
  /menu

IA
  /ia <pregunta>
  /ia [momo] <pregunta>
  /ia-audio <pregunta>
  /ia-audio [momo] <pregunta>

PERSONALIDADES
  /personalidad
  /personalidad momo
  /reset-personality

SISTEMA
  /log

MEDIA
  /tomp3 <URL>
    Descarga solo audio (MP3 192kbps)

UTILIDADES
  /recordatorio <tiempo> <msg>
    Ej: /recordatorio 30m Revisar horno
    Unidades: s, m, h, d (max 30 días)

  /qr <texto>
    Genera código QR como imagen

FÚTBOL
  /partidos
    Partidos de hoy Liga Argentina (EN VIVO/FT/hora)

  /tabla
    Tabla de posiciones Liga Argentina

  /goleadores
    Top 15 goleadores del torneo

  /proximos <equipo>
    Próximos partidos (30 días)

  /ultimos <equipo>
    Últimos resultados + resumen

  /historial <eq1> <eq2>
    Historial cara a cara

  /copas [copa]
    Copa Argentina / Libertadores / Sudamericana

  /europa [liga]
    Premier, LaLiga, Serie A, Bundesliga, Ligue 1, Champions

  /seleccion
    Próximos y últimos de Argentina

JUEGOS
  /penales
    Tanda de penales vs Bot (5 tiros c/u)

IA AVANZADA
  /ia-contexto on|off|clear
    Memoria de conversación (solo admins)

  /ia-contextover
    Ver memoria de conversación actual

  /ia-memoria [@usuario]
    Ver memoria personal de un usuario
    /ia-memoria          → Tu memoria
    /ia-memoria @juan    → Memoria de Juan
    /ia-memoria todos    → Todas (solo admins)
    /ia-memoria limpiar @juan → Borrar memoria (admin/propio)

  /ia-tokens [global|limpiar]
    Ver uso de tokens
    /ia-tokens           → Este grupo
    /ia-tokens global    → Todos los grupos (admin)
    /ia-tokens limpiar   → Borrar stats (admin)
`

        await sock.sendMessage(
            chat,
            {
                text: menu
            }
        )
    }
}
