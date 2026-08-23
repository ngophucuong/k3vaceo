import { json, parseCookies } from '../lib/http.js';
import { clearSessionCookieHeader } from '../auth.js';
import { sha256Hex } from '../lib/crypto.js';

export async function postLogout(request, env) {
  const token = parseCookies(request).s;
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run();
  }
  const isHttps = new URL(request.url).protocol === 'https:';
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookieHeader(isHttps) });
}
