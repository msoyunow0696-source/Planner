// =====================================================
// Alpha Drive — уведомления в браузер: iPhone (Alpha Drive на экране «Домой»),
// компьютер с Windows (Edge, Chrome), Android-браузер.
// Supabase Edge Function «push». Её вызывает база (триггер mb_push_notify)
// при каждом новом уведомлении: {id} записи из mb_records.
// Секрет (Supabase → Edge Functions → Secrets): VAPID_PRIVATE_KEY.
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase подставляет сам.
// Защита: отправляем только свежее уведомление (до 10 минут) и только один раз
// (таблица mb_push_sent), поэтому вызвать функцию вручную бесполезно.
// Шифрование — стандарт Web Push (RFC 8291, aes128gcm) и подпись VAPID (RFC 8292)
// на WebCrypto, без сторонних библиотек.
// =====================================================
export const VAPID_PUBLIC = 'BMzQNqLFnqa-Ta9dQENS7wI8cdS0bcD0pnCsSBON_yv_BKJjqR1-EcmyVBtJp_jKUySv3trudjdOpFJmGW6UePU';
const SUBJECT = 'https://alphadrive.pages.dev';
const FRESH = 10 * 60_000;

const enc = new TextEncoder();
export const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let i = 0; for (const p of parts) { out.set(p, i); i += p.length; }
  return out;
};
async function hkdf(salt: Uint8Array, ikm: Uint8Array, info: Uint8Array, bytes: number) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}

// Тело уведомления, зашифрованное для одного браузера (RFC 8291 + RFC 8188, одна запись)
export async function encrypt(payload: string, p256dh: string, auth: string) {
  const uaPublic = unb64u(p256dh);
  const local = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, local.privateKey, 256));
  const ikm = await hkdf(unb64u(auth), shared, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const data = concat(enc.encode(payload), new Uint8Array([2]));   // 2 — последняя запись
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, data));
  const header = new Uint8Array(21); header.set(salt); new DataView(header.buffer).setUint32(16, 4096); header[20] = asPublic.length;
  return concat(header, asPublic, cipher);
}

// Подпись сервера (VAPID): браузерная служба уведомлений проверяет, что пишем мы
export async function vapidAuth(endpoint: string, privateD: string) {
  const pub = unb64u(VAPID_PUBLIC);
  const key = await crypto.subtle.importKey('jwk',
    { kty: 'EC', crv: 'P-256', d: privateD, x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const part = (o: unknown) => b64u(enc.encode(JSON.stringify(o)));
  const unsigned = part({ typ: 'JWT', alg: 'ES256' }) + '.' +
    part({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SUBJECT });
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(unsigned)));
  return `vapid t=${unsigned}.${b64u(sig)}, k=${VAPID_PUBLIC}`;
}

export type Sub = { endpoint: string; p256dh: string; auth: string };
// Отправить одному браузеру. Ответ 404/410 — подписка больше не действует
export async function sendPush(sub: Sub, payload: string, privateD: string) {
  const body = await encrypt(payload, sub.p256dh, sub.auth);
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': await vapidAuth(sub.endpoint, privateD),
      'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
      'TTL': '86400', 'Urgency': 'high',
    },
    body,
  });
}

// Тексты уведомлений в базе — по-русски; переводим на язык, выбранный в приложении
const TR: [RegExp, (...m: string[]) => [string, string]][] = [
  [/^Сообщение от (.+?): (.*)$/s, (_, a, b) => [`${a} hat iberdi: ${b}`, `Message from ${a}: ${b}`]],
  [/^Новый комментарий к «(.+)»$/s, (_, a) => [`Täze teswir «${a}»`, `New comment on «${a}»`]],
  [/^Новое объявление по вашему поиску: «(.+)$/s, (_, a) => [`Gözlegiňiz boýunça täze bildiriş: «${a}`, `New listing for your search: «${a}`]],
  [/^Ответ поддержки:(.*)$/s, (_, a) => [`Goldaw gullugynyň jogaby:${a}`, `Support reply:${a}`]],
  [/^Цена снижена: «(.+)» — ([\d ]+) TMT \(было ([\d ]+)\)$/s, (_, a, b, c) => [`Baha arzanlady: «${a}» — ${b} TMT (${c} bolupdy)`, `Price reduced: “${a}” — ${b} TMT (was ${c})`]],
];
export function translate(text: string, lang: string) {
  if (lang !== 'tm' && lang !== 'en') return text;
  for (const [re, fn] of TR) { const m = text.match(re); if (m) return fn(...m)[lang === 'tm' ? 0 : 1]; }
  return text;
}

// ====== Сама функция ======
if (typeof Deno !== 'undefined') Deno.serve(async req => {
  const SB_URL = Deno.env.get('SUPABASE_URL')!, KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, D = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!D) return new Response('VAPID_PRIVATE_KEY не задан', { status: 500 });
  const rest = (path: string, init: RequestInit = {}) => fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== 'string' || id.length > 64) return new Response('bad', { status: 400 });

  // Уведомление из базы, а не из запроса: текст и получателя подделать нельзя
  const [rec] = await (await rest(`mb_records?coll=eq.notifs&id=eq.${encodeURIComponent(id)}&select=owner,data`)).json();
  if (!rec?.owner || Date.now() - Number(rec.data?.time || 0) > FRESH) return new Response('skip');
  // Один раз: вторая попытка с тем же id ничего не вставит
  const sent = await rest('mb_push_sent', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify({ id }) });
  if (!sent.ok || !(await sent.json()).length) return new Response('already');

  const subs = await (await rest(`mb_push?uid=eq.${rec.owner}&select=endpoint,p256dh,auth,lang`)).json();
  const chat = rec.data.chat ? String(rec.data.chat) : '';
  let ok = 0;
  await Promise.all(subs.map(async (s: Sub & { lang: string }) => {
    const payload = JSON.stringify({ title: 'Alpha Drive', body: translate(String(rec.data.text || ''), s.lang), tag: id, open: chat ? 'chat=' + chat : 'notifs' });
    try {
      const r = await sendPush(s, payload, D);
      if (r.status === 404 || r.status === 410) await rest(`mb_push?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE' });
      else if (r.ok) ok++;
      else console.warn('push', r.status, await r.text());
    } catch (e) { console.warn('push', e); }
  }));
  // Иногда чистим журнал «уже отправлено» старше недели
  if (Math.random() < 0.05) await rest(`mb_push_sent?sent_at=lt.${new Date(Date.now() - 7 * 86400_000).toISOString()}`, { method: 'DELETE' });
  return new Response(JSON.stringify({ sent: ok, of: subs.length }), { headers: { 'Content-Type': 'application/json' } });
});
