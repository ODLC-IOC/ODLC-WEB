// Datos fijos de OdlC y lectura de la configuración del servidor (variables de entorno de Netlify).
// Ningún secreto se escribe en el código: todos se leen de process.env en tiempo de ejecución.

export const ODLC = {
  nombre: 'Isabel Olivares de la Cerda',
  empresa: 'OdlC',
  email: 'isabel@odlc.es',
  web: 'https://odlc.es',
  tz: 'Europe/Madrid',
};

export function env(name, fallback = '') {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

export const SITE_URL = () => env('ODLC_SITE_URL', 'https://odlc.es').replace(/\/$/, '');
export const ADMIN_EMAIL = () => env('ODLC_ADMIN_EMAIL', ODLC.email).trim().toLowerCase();

export const DURACIONES = [15, 30, 45, 60, 90];
