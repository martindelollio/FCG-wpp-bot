import ping from './ping.js'
import joda from './joda.js'
import sticker from './sticker.js'
import bisagra from './bisagra.js'
import video from './video.js'
import toimg from './toimg.js'
import menu from './menu.js'
import violar from './violar.js'
import ia from './ia.js'
import personalidad from './personalidad.js'
import resetPersonality from './reset-personality.js'
import iaAudio from './ia-audio.js'
import log from './log.js'
import tomp3 from './tomp3.js'
import recordatorio from './recordatorio.js'
import qr from './qr.js'
import partidos from './partidos.js'
import tabla from './tabla.js'
import goleadores from './goleadores.js'
import proximos from './proximos.js'
import ultimos from './ultimos.js'
import historial from './historial.js'
import copas from './copas.js'
import europa from './europa.js'
import seleccion from './seleccion.js'
import penales from './penales.js'
import iaContexto from './ia-contexto.js'
import iaContextoVer from './ia-contextover.js'
import iaMemoria from './ia-memoria.js'
import iaTokens from './ia-tokens.js'
import luis from './luis.js'

export const comandos = {
    ping,
    joda,
    menu,
    sticker,
    s: sticker,
    bisagra,
    b: bisagra,
    video,
    v: video,
    toimg,
    violar,
    fede: violar,
    'ia': iaAudio,
    personalidad,
    'reset-personality': resetPersonality,
    r: resetPersonality,
    'ia-audio': iaAudio,
    log,
    tomp3,
    recordatorio,
    qr,
    partidos,
    tabla,
    goleadores,
    proximos,
    ultimos,
    historial,
    copas,
    europa,
    seleccion,
    penales,
    'ia-contexto': iaContexto,
    'ia-contextover': iaContextoVer,
    'ia-memoria': iaMemoria,
    'ia-tokens': iaTokens,
    luis
}
