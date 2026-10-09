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
    'ia':iaAudio,
    personalidad,
    'reset-personality': resetPersonality,
    r: resetPersonality,
    'ia-audio': iaAudio,
    log,
    tomp3,
}
