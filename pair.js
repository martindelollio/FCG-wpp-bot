import makeWASocket, {
    useMultiFileAuthState
} from '@whiskeysockets/baileys'

async function pairPhone() {
    const phoneNumber = process.argv[2]
    
    if (!phoneNumber) {
        console.log('Uso: node pair.js TU_NUMERO')
        console.log('Ejemplo: node pair.js 5491123456789')
        console.log('')
        console.log('Formato: Código de país + código de área + número (sin +, sin espacios, sin 0 inicial)')
        console.log('Argentina: 549 + código de área + número')
        process.exit(1)
    }

    const { state, saveCreds } = await useMultiFileAuthState('./auth')

    const sock = makeWASocket({
        auth: state,
        browser: ['FCGbot', 'Chrome', '120.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    let codeGenerated = false

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr && !codeGenerated) {
            console.log('📱 QR detectado, intentando generar código de emparejamiento...')
            try {
                const code = await sock.requestPairingCode(phoneNumber)
                codeGenerated = true
                console.log('')
                console.log('╔═══════════════════════════════════════════╗')
                console.log(`║  CÓDIGO DE EMPAREJAMIENTO: ${code}  ║`)
                console.log('╚═══════════════════════════════════════════╝')
                console.log('')
                console.log('📱 En tu WhatsApp del chip NUEVO:')
                console.log('   1. Abre WhatsApp')
                console.log('   2. Configuración (⚙️) > Dispositivos vinculados')
                console.log('   3. Toca "Vincular dispositivo"')
                console.log('   4. Toca "Vincular con código" (abajo)')
                console.log(`   5. Ingresa el código: ${code}`)
                console.log('')
                console.log('⏳ Esperando escaneo... (expira en ~2 minutos)')
            } catch (error) {
                console.error('❌ Error generando código:', error.message)
            }
        }

        if (connection === 'open') {
            console.log('✅ ¡Emparejamiento exitoso! Bot conectado.')
            process.exit(0)
        }

        if (connection === 'close') {
            if (!codeGenerated) {
                console.log('❌ Conexión cerrada antes de generar código:', lastDisconnect?.error?.message)
                process.exit(1)
            }
        }
    })
}

pairPhone()