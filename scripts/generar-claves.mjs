// Genera los valores de las variables de entorno del panel de reuniones.
// Uso:  node scripts/generar-claves.mjs
// Pide la contraseña sin mostrarla y escribe en pantalla el hash scrypt (no la contraseña)
// y dos claves aleatorias. Copia cada valor en Netlify > Project configuration > Environment variables.
import crypto from 'node:crypto';
import readline from 'node:readline';
import { hashPassword } from '../netlify/lib/auth.mjs';

function ask(q) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(q)) process.stdout.write(s); };
    rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); resolve(a); });
  });
}

const p1 = await ask('Nueva contraseña del panel: ');
const p2 = await ask('Repítela: ');
if (p1 !== p2) { console.error('No coinciden.'); process.exit(1); }
if (p1.length < 12) { console.error('Usa al menos 12 caracteres.'); process.exit(1); }
console.log('\nODLC_ADMIN_EMAIL=isabel@odlc.es');
console.log('ODLC_ADMIN_PASSWORD_HASH=' + hashPassword(p1));
console.log('ODLC_SESSION_SECRET=' + crypto.randomBytes(48).toString('base64url'));
console.log('ODLC_TOKEN_KEY=' + crypto.randomBytes(32).toString('base64'));
