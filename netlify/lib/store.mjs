// Almacenamiento persistente en Netlify Blobs (privado: solo se accede desde las funciones del servidor).
// Claves:  m/<id>        reunión
//          ms/token      conexión con Microsoft 365 (token de actualización cifrado)
//          ms/state/<s>  inicio de autorización OAuth pendiente (10 min)
//          rl/<hash>     intentos de acceso fallidos por IP
import { getStore } from '@netlify/blobs';
import { env } from './config.mjs';

const REGION = 'eu-central-1'; // Fráncfort: los datos se quedan en la UE

let _store;
export function store() {
  if (globalThis.__ODLC_TEST_STORE) return globalThis.__ODLC_TEST_STORE; // solo en pruebas locales
  if (!_store) {
    _store = getStore({ name: env('ODLC_STORE_NAME', 'odlc-reuniones'), consistency: 'strong', region: REGION });
  }
  return _store;
}

export async function getJSON(key) {
  return store().get(key, { type: 'json' });
}
export async function setJSON(key, value) {
  return store().setJSON(key, value);
}
export async function del(key) {
  return store().delete(key);
}

export async function listMeetings() {
  const { blobs } = await store().list({ prefix: 'm/' });
  const items = await Promise.all(blobs.map((b) => getJSON(b.key)));
  return items.filter(Boolean);
}
