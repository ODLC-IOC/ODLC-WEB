// /reuniones — panel privado. Sin sesión válida solo se entrega la pantalla de acceso.
import { html } from '../lib/http.mjs';
import { configured, isAuthenticated } from '../lib/auth.mjs';
import { loginPage, panelPage } from '../lib/pages.mjs';

export default async (req) => {
  const missing = configured();
  if (missing.length) return html(loginPage({ missing }), 503);
  if (!isAuthenticated(req)) return html(loginPage());
  return html(panelPage());
};

export const config = { path: ['/reuniones', '/reuniones/'] };
