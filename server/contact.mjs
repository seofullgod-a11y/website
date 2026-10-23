/**
 * The contact form → your inbox.
 *
 * POST /api/contact (JSON from the page, or a plain form post without JavaScript).
 * Sends the message with Resend's HTTPS API — Railway's Free/Trial/Hobby plans block
 * SMTP, so a Gmail password would not work there.
 *
 * Railway → Variables:
 *   RESEND_API_KEY   re_…  (resend.com → API Keys). Without it the form shows
 *                    "send it by email instead" with the message already written.
 *   CONTACT_TO       optional — defaults to site.ts → email
 *   CONTACT_FROM     optional — defaults to "seftsaint <onboarding@resend.dev>".
 *                    With that sender Resend only delivers to the address you signed up
 *                    with, so sign up with the same email as CONTACT_TO (or verify a domain).
 *
 * Protection: same-origin only, a hidden field bots fill in, a minimum time on the page,
 * 5 messages per hour per address and 90 per day in total (Resend's free plan allows 100).
 * Messages are not stored on the server — they only go to the inbox.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MAX_BODY = 32 * 1024;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;
const PER_IP_HOUR = 5;
const EMAIL = /^[^\s@<>()",;:\\]+@[^\s@<>()",;:\\]+\.[^\s@<>()",;:\\]{2,}$/;

export function createContact({ distRoot }) {
  let cfg = {};
  try {
    cfg = JSON.parse(fs.readFileSync(path.join(distRoot, 'server-config.json'), 'utf8'));
  } catch {
    console.warn('[contact] dist/server-config.json missing — using defaults');
  }
  const KEY = process.env.RESEND_API_KEY || '';
  const TO = process.env.CONTACT_TO || cfg.email || '';
  const FROM = process.env.CONTACT_FROM || `${cfg.name || 'seftsaint'} <onboarding@resend.dev>`;
  const API = process.env.RESEND_API_URL || 'https://api.resend.com/emails';
  const DAILY = Number(process.env.CONTACT_DAILY_LIMIT) || 90;
  const game = cfg.contact?.game || 'seftsaint';
  const allowedRoles = new Set(cfg.contact?.roles ?? []);
  const L = {
    name: 'Name',
    email: 'Email',
    roles: 'How they’d partner',
    message: 'About them',
    link: 'Link',
    ...(cfg.contact?.labels ?? {}),
  };
  const timeZone = cfg.timeZone || 'Asia/Bangkok';
  const mask = (e) => String(e).replace(/^(.).*(@.*)$/, '$1***$2');
  console.log(
    KEY && TO
      ? `[contact] form → ${mask(TO)} via Resend`
      : '[contact] RESEND_API_KEY not set — the form offers “send it by email instead”',
  );

  /* ── Limits ── */
  const perIp = new Map();
  let day = { key: '', n: 0 };
  const ipOf = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim();
  const limited = (ip) => {
    const now = Date.now();
    const today = new Date().toISOString().slice(0, 10);
    if (day.key !== today) day = { key: today, n: 0 };
    const a = perIp.get(ip);
    if (a && a.reset < now) perIp.delete(ip);
    if (perIp.size > 5000) perIp.clear();
    return (perIp.get(ip)?.n ?? 0) >= PER_IP_HOUR || day.n >= DAILY;
  };
  const count = (ip) => {
    const a = perIp.get(ip) ?? { n: 0, reset: Date.now() + 3600e3 };
    a.n++;
    perIp.set(ip, a);
    day.n++;
  };

  /* ── HTTP helpers ── */
  const json = (res, status, body) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    });
    res.end(JSON.stringify(body));
  };
  const sameOrigin = (req) => {
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    const from = req.headers.origin || req.headers.referer;
    if (!from || !host) return false;
    try {
      return new URL(from).host === host;
    } catch {
      return false;
    }
  };
  const readBody = async (req) => {
    let size = 0;
    const chunks = [];
    for await (const c of req) {
      size += c.length;
      if (size > MAX_BODY) throw Object.assign(new Error('too large'), { status: 413 });
      chunks.push(c);
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    const type = String(req.headers['content-type'] || '').toLowerCase();
    if (type.includes('application/json')) {
      try {
        const v = JSON.parse(raw || '{}');
        if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('shape');
        return v;
      } catch {
        throw Object.assign(new Error('bad json'), { status: 400 });
      }
    }
    if (type.includes('application/x-www-form-urlencoded')) {
      const p = new URLSearchParams(raw);
      const out = Object.fromEntries(p);
      out.roles = p.getAll('roles');
      return out;
    }
    throw Object.assign(new Error('type'), { status: 415 });
  };

  /* ── Validation ── */
  const text = (v, max) =>
    String(v ?? '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f\u2028\u2029]/g, '')
      .trim()
      .slice(0, max);
  const oneLine = (v, max) => text(v, max).replace(/\s+/g, ' ');
  function validate(input) {
    const name = oneLine(input.name, 100);
    const email = oneLine(input.email, 254);
    const message = text(input.message, MAX_MESSAGE + 1);
    const link = oneLine(input.link, 301);
    const list = Array.isArray(input.roles) ? input.roles : input.roles ? [input.roles] : [];
    const roles = [...new Set(list.map((r) => oneLine(r, 60)))].filter((r) => allowedRoles.has(r)).slice(0, 10);
    if (!name) return { field: 'name', error: 'required' };
    if (!email) return { field: 'email', error: 'required' };
    if (!EMAIL.test(email)) return { field: 'email', error: 'email' };
    if (!message) return { field: 'message', error: 'required' };
    if (message.length < MIN_MESSAGE) return { field: 'message', error: 'short' };
    if (message.length > MAX_MESSAGE) return { field: 'message', error: 'long' };
    if (link) {
      let ok = link.length <= 300 && /^https?:\/\/\S+\.\S+/i.test(link);
      try {
        ok = ok && ['http:', 'https:'].includes(new URL(link).protocol);
      } catch {
        ok = false;
      }
      if (!ok) return { field: 'link', error: 'link' };
    }
    return { data: { name, email, message, link, roles } };
  }

  /* ── The email ── */
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function compose(d, host) {
    const when = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
    const subject = `${game} — partner: ${d.name.slice(0, 60)}`;
    const rows = [
      [L.name, d.name],
      [L.email, d.email],
      ...(d.roles.length ? [[L.roles, d.roles.join(', ')]] : []),
      ...(d.link ? [[L.link, d.link]] : []),
    ];
    const footer = `Sent from the contact page on ${host || 'your site'} — ${when} (${timeZone}). Reply to this email to answer them directly.`;
    const text = [
      `New message from the ${game} contact page`,
      '',
      ...rows.map(([k, v]) => `${k}: ${v}`),
      '',
      `${L.message}:`,
      d.message,
      '',
      '—',
      footer,
    ].join('\n');
    const cell = 'padding:6px 16px 6px 0;vertical-align:top;';
    const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f5f3;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#141416">
<div style="max-width:560px;margin:0 auto;background:#fff;border-top:3px solid #d51b45;padding:28px 28px 22px">
<p style="margin:0 0 4px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8b8c8f">${esc(game)} — contact page</p>
<p style="margin:0 0 20px;font-size:22px;line-height:1.3">${esc(d.name)} wants to talk</p>
<table style="border-collapse:collapse;font-size:14px;line-height:1.5">${rows
      .map(
        ([k, v]) =>
          `<tr><td style="${cell}color:#8b8c8f;white-space:nowrap">${esc(k)}</td><td style="${cell}">${
            k === L.email
              ? `<a href="mailto:${esc(v)}" style="color:#141416">${esc(v)}</a>`
              : k === L.link
                ? `<a href="${esc(v)}" style="color:#141416">${esc(v)}</a>`
                : esc(v)
          }</td></tr>`,
      )
      .join('')}</table>
<p style="margin:22px 0 6px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8b8c8f">${esc(L.message)}</p>
<div style="font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(d.message)}</div>
<p style="margin:28px 0 0;padding-top:14px;border-top:1px solid #e6e6e3;font-size:12px;line-height:1.5;color:#8b8c8f">${esc(footer)}</p>
</div></body></html>`;
    return { subject, text, html };
  }

  async function sendMail(d, host) {
    const { subject, text, html } = compose(d, host);
    const res = await fetch(API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ from: FROM, to: [TO], reply_to: d.email, subject, text, html }),
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) return true;
    const err = await res.json().catch(() => ({}));
    console.error(`[contact] not sent — Resend ${res.status} ${err.name ?? ''}: ${err.message ?? ''}`.trim());
    if (res.status === 403 && /own email|testing/i.test(String(err.message))) {
      console.error(
        '[contact] With onboarding@resend.dev Resend only delivers to the email you signed up with — sign up with the same address as CONTACT_TO, or verify a domain and set CONTACT_FROM.',
      );
    }
    if (res.status === 401) console.error('[contact] RESEND_API_KEY looks wrong — make a new key at resend.com → API Keys.');
    return false;
  }

  /* ── The endpoint ── */
  async function handle(req, res) {
    const wantsJson =
      String(req.headers.accept || '').includes('application/json') ||
      String(req.headers['content-type'] || '').includes('application/json');
    // A form post without JavaScript gets sent back to the page, where #sent / #not-sent show up.
    const reply = (status, body) => {
      if (wantsJson) return json(res, status, body);
      res.writeHead(303, { Location: `/#${status === 200 ? 'sent' : 'not-sent'}`, 'Cache-Control': 'no-store' });
      res.end();
    };

    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' });
      return res.end();
    }
    if (!sameOrigin(req)) return reply(403, { error: 'origin' });

    let input;
    try {
      input = await readBody(req);
    } catch (err) {
      return reply(err.status || 400, { error: 'bad-request' });
    }

    // Bots: the hidden field is filled in, or the form was sent the instant the page opened.
    // They get the same answer as people, so they don't learn anything.
    const elapsed = Number(input.t);
    if (text(input.hp, 200) || (elapsed > 0 && elapsed < 2500)) {
      console.log('[contact] dropped an automated message');
      return reply(200, { ok: true });
    }

    const v = validate(input);
    if (!v.data) return reply(422, { error: v.error, field: v.field });
    if (!KEY || !TO) return reply(503, { error: 'offline' });

    const ip = ipOf(req);
    if (limited(ip)) return reply(429, { error: 'rate' });
    count(ip);

    const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    try {
      if (await sendMail(v.data, host)) {
        console.log(`[contact] message from ${mask(v.data.email)} sent to ${mask(TO)}`);
        return reply(200, { ok: true });
      }
    } catch (err) {
      console.error(`[contact] not sent — ${err.name === 'TimeoutError' ? 'Resend did not answer in time' : err.message}`);
    }
    return reply(502, { error: 'failed' });
  }

  return { handle, configured: Boolean(KEY && TO) };
}
