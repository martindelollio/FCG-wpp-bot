import fs from 'node:fs';
import path from 'node:path';

const authDir = path.resolve('./auth');
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutos

function limpiar() {
    if (!fs.existsSync(authDir)) {
        console.log('[limpiar-auth] No existe la carpeta auth/');
        return;
    }

    const files = fs.readdirSync(authDir, { withFileTypes: true });
    
    // Patrones de archivos temporales/backup que SÍ se pueden borrar
    // NO borrar pre-key-*.json ni session-*.json ni sender-key-*.json: son claves de cifrado activas
    const patronesTemporales = [
        /\.(tmp|temp|bak|backup)$/i,
    ];

    // Archivos que NUNCA se tocan
    const protegidos = ['creds.json'];

    let borrados = 0;

    for (const file of files) {
        if (!file.isFile()) continue;
        
        if (protegidos.includes(file.name)) continue;

        const esTemporal = patronesTemporales.some(p => p.test(file.name));
        
        if (esTemporal) {
            const fullPath = path.join(authDir, file.name);
            try {
                fs.unlinkSync(fullPath);
                console.log(`[limpiar-auth] Borrado: ${file.name}`);
                borrados++;
            } catch (e) {
                console.error(`[limpiar-auth] Error borrando ${file.name}:`, e.message);
            }
        }
    }

    if (borrados === 0) {
        console.log('[limpiar-auth] Nada para limpiar');
    } else {
        console.log(`[limpiar-auth] Limpieza completada: ${borrados} archivo(s) borrado(s)`);
    }
}

// Modo daemon (cada 30 min)
if (process.argv.includes('--daemon')) {
    console.log(`[limpiar-auth] Iniciado en modo daemon (cada ${INTERVAL_MS / 60000} min)`);
    limpiar(); // Ejecutar al inicio
    setInterval(limpiar, INTERVAL_MS);
    
    // Manejar señales para salida limpia
    process.on('SIGINT', () => {
        console.log('\n[limpiar-auth] Detenido');
        process.exit(0);
    });
    process.on('SIGTERM', () => process.exit(0));
}
// Modo ejecución única
else if (process.argv.includes('--now')) {
    console.log('[limpiar-auth] Ejecución manual...');
    limpiar();
}
// Modo simulación (solo lista)
else if (process.argv.includes('--dry-run')) {
    console.log('[limpiar-auth] Modo simulación (--dry-run)');
    if (!fs.existsSync(authDir)) {
        console.log('No existe la carpeta auth/');
        process.exit(0);
    }
    const files = fs.readdirSync(authDir, { withFileTypes: true });
    const patronesTemporales = [/\.(tmp|temp|bak|backup)$/i];
    const candidatos = files.filter(f => f.isFile() && patronesTemporales.some(p => p.test(f.name)));
    if (candidatos.length === 0) {
        console.log('No hay archivos temporales para borrar');
    } else {
        console.log('Se borrarían:');
        for (const f of candidatos) console.log(`  - ${f.name}`);
    }
}
// Ayuda
else {
    console.log(`
Uso: node limpiar-auth.js [opción]

Opciones:
  --now        Ejecuta limpieza una vez y sale
  --daemon     Ejecuta cada 30 min (para systemd/PM2)
  --dry-run    Solo lista qué se borraría, no borra nada

Ejemplos:
  node limpiar-auth.js --now
  node limpiar-auth.js --daemon
  node limpiar-auth.js --dry-run
`);
}