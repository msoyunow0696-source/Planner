// =====================================================
// Alpha Drive — письма: подтверждение почты и «Забыли пароль?»
// Supabase Edge Function «mail». Письма уходят через Gmail (SMTP, порт 465).
// Секреты (Supabase → Edge Functions → Secrets): GMAIL_USER, GMAIL_APP_PASSWORD.
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY Supabase подставляет сам.
// Настройка функции: «Verify JWT» выключить — ссылки из писем открываются без входа.
//
// Действия (POST JSON, поле action):
//   verify-send {email, lang}   — нужен вход (Authorization: Bearer <токен пользователя>)
//   verify      {token}         — со страницы сайта по ссылке из письма
//   reset-send  {email, lang}   — «Забыли пароль?», вход не нужен
//   reset       {token, password}
// =====================================================
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import nodemailer from 'npm:nodemailer@6.9.14';

const SITE = 'https://msoyunow0696-source.github.io/Planner/mail.html';
const HOUR = 3600_000;
const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const token = () => [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, '0')).join('');

// ====== Тексты писем на трёх языках ======
const T = {
  ru: {
    verifySubj: 'Подтвердите почту — Alpha Drive', verifyTitle: 'Подтвердите почту',
    verifyText: 'Нажмите кнопку, чтобы подтвердить эту почту для аккаунта Alpha Drive. После этого вы сможете входить по почте и восстанавливать пароль.',
    verifyBtn: 'Подтвердить почту',
    resetSubj: 'Новый пароль — Alpha Drive', resetTitle: 'Восстановление пароля',
    resetText: 'Кто-то (надеемся, вы) попросил сменить пароль от аккаунта Alpha Drive. Нажмите кнопку и придумайте новый пароль.',
    resetBtn: 'Задать новый пароль',
    foot: 'Ссылка действует 24 часа. Если это были не вы — просто удалите письмо, с аккаунтом ничего не случится.',
  },
  tm: {
    verifySubj: 'E-poçtany tassyklaň — Alpha Drive', verifyTitle: 'E-poçtany tassyklaň',
    verifyText: 'Alpha Drive hasaby üçin bu e-poçtany tassyklamak üçin düwmä basyň. Şondan soň e-poçta bilen girip we paroly dikeldip bilersiňiz.',
    verifyBtn: 'E-poçtany tassykla',
    resetSubj: 'Täze parol — Alpha Drive', resetTitle: 'Paroly dikeltmek',
    resetText: 'Kimdir biri (umyt edýäris, siz) Alpha Drive hasabynyň parolyny çalyşmagy haýyş etdi. Düwmä basyp, täze parol oýlap tapyň.',
    resetBtn: 'Täze parol goý',
    foot: 'Salgylanma 24 sagat işleýär. Eger bu siz bolmasaňyz — haty pozuň, hasabyňyza hiç zat bolmaz.',
  },
  en: {
    verifySubj: 'Confirm your email — Alpha Drive', verifyTitle: 'Confirm your email',
    verifyText: 'Tap the button to confirm this email for your Alpha Drive account. After that you can sign in with email and recover your password.',
    verifyBtn: 'Confirm email',
    resetSubj: 'New password — Alpha Drive', resetTitle: 'Password recovery',
    resetText: 'Someone (hopefully you) asked to change the password of your Alpha Drive account. Tap the button and choose a new password.',
    resetBtn: 'Set a new password',
    foot: 'The link works for 24 hours. If this was not you, just delete this email — nothing will happen to your account.',
  },
};
type Lang = keyof typeof T;

function letter(lang: Lang, kind: 'verify' | 'reset', link: string) {
  const t = T[lang] || T.ru;
  const title = kind === 'verify' ? t.verifyTitle : t.resetTitle;
  const text = kind === 'verify' ? t.verifyText : t.resetText;
  const btn = kind === 'verify' ? t.verifyBtn : t.resetBtn;
  const html = `<!doctype html><html><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#fffbea">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:28px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#16150f;border:1px solid #2c2a1d;border-radius:18px;padding:28px">
    <tr><td style="font-size:22px;font-weight:800">Alpha <span style="color:#ffd60a">Drive</span></td></tr>
    <tr><td style="padding-top:18px;font-size:20px;font-weight:700">${title}</td></tr>
    <tr><td style="padding-top:10px;font-size:15px;line-height:1.5;color:#d9d3b8">${text}</td></tr>
    <tr><td style="padding-top:22px"><a href="${link}" style="display:inline-block;background:#ffd60a;color:#141100;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:14px">${btn}</a></td></tr>
    <tr><td style="padding-top:20px;font-size:12px;line-height:1.5;color:#8f8a73">${t.foot}<br><br><a href="${link}" style="color:#8f8a73;word-break:break-all">${link}</a></td></tr>
  </table></td></tr></table></body></html>`;
  return { subject: kind === 'verify' ? t.verifySubj : t.resetSubj, html, text: `${title}\n\n${text}\n\n${link}\n\n${t.foot}` };
}

async function send(to: string, mail: { subject: string; html: string; text: string }) {
  const user = Deno.env.get('GMAIL_USER'), pass = Deno.env.get('GMAIL_APP_PASSWORD');
  if (!user || !pass) throw new Error('mail-not-configured');
  const tr = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
  await tr.sendMail({ from: `Alpha Drive <${user}>`, to, ...mail });
}

// Не больше 3 писем в час на одну почту — защита от рассылки спама через нашу форму
async function tooMany(email: string) {
  const { count } = await admin.from('mb_email_tokens').select('token', { count: 'exact', head: true })
    .eq('email', email).gt('created_at', new Date(Date.now() - HOUR).toISOString());
  return (count || 0) >= 3;
}

async function newToken(uid: string, email: string, kind: 'verify' | 'reset') {
  const t = token();
  const { error } = await admin.from('mb_email_tokens').insert({ token: t, uid, email, kind, expires_at: new Date(Date.now() + 24 * HOUR).toISOString() });
  if (error) throw error;
  return t;
}

async function takeToken(t: string, kind: 'verify' | 'reset') {
  const { data } = await admin.from('mb_email_tokens').select('*').eq('token', String(t || '')).eq('kind', kind).maybeSingle();
  if (!data || data.used || new Date(data.expires_at).getTime() < Date.now()) return null;
  await admin.from('mb_email_tokens').update({ used: true }).eq('token', data.token);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'method' }, 405);
  let body: Record<string, string> = {};
  try { body = await req.json(); } catch { return reply({ error: 'bad-json' }, 400); }
  const lang = (['ru', 'tm', 'en'].includes(body.lang) ? body.lang : 'ru') as Lang;

  try {
    // ====== Отправить письмо «Подтвердите почту» ======
    if (body.action === 'verify-send') {
      const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: { user } } = await admin.auth.getUser(jwt);
      if (!user) return reply({ error: 'auth' }, 401);
      const email = String(body.email || '').trim().toLowerCase();
      if (!EMAIL_RE.test(email) || email.length > 120) return reply({ error: 'email' }, 400);
      // Почту уже подтвердил кто-то другой?
      const { data: taken } = await admin.rpc('mb_email_taken', { p_email: email });
      const mine = (user.user_metadata?.email || '').toLowerCase() === email && user.user_metadata?.email_verified === 'true';
      if (taken && !mine) return reply({ error: 'taken' }, 409);
      if (await tooMany(email)) return reply({ error: 'too-many' }, 429);
      // Новая почта — пока не подтверждена
      await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, email, email_verified: mine ? 'true' : 'false' } });
      const t = await newToken(user.id, email, 'verify');
      await send(email, letter(lang, 'verify', `${SITE}?verify=${t}&lang=${lang}`));
      return reply({ ok: true });
    }

    // ====== Нажали кнопку в письме ======
    if (body.action === 'verify') {
      const tk = await takeToken(body.token, 'verify');
      if (!tk) return reply({ error: 'expired' }, 400);
      const { data: { user } } = await admin.auth.admin.getUserById(tk.uid);
      if (!user) return reply({ error: 'expired' }, 400);
      if ((user.user_metadata?.email || '').toLowerCase() !== tk.email) return reply({ error: 'expired' }, 400);
      const { data: taken } = await admin.rpc('mb_email_taken', { p_email: tk.email });
      if (taken && user.user_metadata?.email_verified !== 'true') return reply({ error: 'taken' }, 409);
      await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...user.user_metadata, email_verified: 'true' } });
      return reply({ ok: true, email: tk.email });
    }

    // ====== «Забыли пароль?» — письмо со ссылкой ======
    if (body.action === 'reset-send') {
      const email = String(body.email || '').trim().toLowerCase();
      // Ответ всегда одинаковый, чтобы по форме нельзя было узнать, чья это почта
      if (!EMAIL_RE.test(email) || await tooMany(email)) return reply({ ok: true });
      const { data: phone } = await admin.rpc('mb_phone_for_email', { p_email: email });
      if (!phone) return reply({ ok: true });
      const { data: rec } = await admin.from('mb_records').select('id').eq('coll', 'users').eq('data->>phone', phone).maybeSingle();
      if (!rec) return reply({ ok: true });
      const t = await newToken(rec.id, email, 'reset');
      await send(email, letter(lang, 'reset', `${SITE}?reset=${t}&lang=${lang}`));
      return reply({ ok: true });
    }

    // ====== Новый пароль со страницы сайта ======
    if (body.action === 'reset') {
      const password = String(body.password || '');
      if (password.length < 6 || password.length > 72) return reply({ error: 'password' }, 400);
      const tk = await takeToken(body.token, 'reset');
      if (!tk) return reply({ error: 'expired' }, 400);
      const { error } = await admin.auth.admin.updateUserById(tk.uid, { password });
      if (error) return reply({ error: 'password' }, 400);
      return reply({ ok: true });
    }

    return reply({ error: 'action' }, 400);
  } catch (e) {
    console.error(e);
    return reply({ error: String((e as Error).message || e) === 'mail-not-configured' ? 'mail-not-configured' : 'server' }, 500);
  }
});
