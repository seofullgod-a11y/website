/**
 * Studio (/studio): sign in, post a devlog update with a clip, watch it go live,
 * and edit / hide / delete what's there. Talks to server/devlog.mjs (/studio/api/*).
 * Clips are sent in 8 MB pieces, so a slow phone connection can pick up where it stopped.
 */
export {};

type Category = { key: string; label: string; hint: string };
type Project = { slug: string; title: string };
type Entry = {
  id: string;
  date: string;
  project: string | null;
  category: string;
  title: string;
  text: string;
  link: string;
  hidden: boolean;
  status: 'uploading' | 'processing' | 'live' | 'failed';
  error?: string;
  media: { type: 'video' | 'image'; duration?: number } | null;
  thumb: string | null;
  clip: string | null;
  upload?: { size: number; name: string };
  received?: number;
};
type Session = {
  enabled: boolean;
  authed: boolean;
  persistent?: boolean;
  onRailway?: boolean;
  ffmpeg?: boolean;
  disk?: { free: number; total: number } | null;
  today?: string;
  config?: { categories: Category[]; projects: Project[]; featured: string | null };
};

const CHUNK = 8 * 1024 * 1024;
const MAX = 1536 * 1024 * 1024;

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const views = [...document.querySelectorAll<HTMLElement>('[data-view]')];
const show = (name: string) => views.forEach((v) => (v.hidden = v.dataset.view !== name));

const MESSAGES: Record<string, string> = {
  'wrong-password': 'รหัสผ่านไม่ถูกต้อง',
  'too-many': 'ลองผิดหลายครั้งเกินไป รอ 15 นาทีแล้วลองใหม่',
  'no-volume': 'ยังไม่ได้ต่อ Volume ใน Railway — ต้องต่อก่อนถึงจะโพสต์ได้ (ดูวิธีด้านบน)',
  'file-too-large': 'ไฟล์ใหญ่เกิน 1.5 GB',
  'disk-full': 'พื้นที่ใน Volume ไม่พอ — ขยาย Volume ใน Railway หรือลบอัปเดตเก่า',
  'signed-out': 'หมดเวลาเข้าสู่ระบบ กรุณาเข้าใหม่',
  title: 'ใส่หัวข้อก่อน',
  category: 'เลือกหมวดก่อน',
  link: 'ลิงก์ต้องขึ้นต้นด้วย https://',
  date: 'วันที่ไม่ถูกต้อง',
  origin: 'คำขอนี้ไม่ได้มาจากหน้า Studio',
  disabled: 'Studio ยังปิดอยู่',
};
const say = (code?: string) => MESSAGES[code ?? ''] ?? 'มีบางอย่างผิดพลาด ลองใหม่อีกครั้ง';

class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public data: Record<string, unknown> = {},
  ) {
    super(code);
  }
}
async function api<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/studio/api/${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { ...(init.body && typeof init.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && data.error === 'signed-out') show('login');
    throw new ApiError(data.error ?? 'server', res.status, data);
  }
  return data as T;
}

const bytes = (n: number) =>
  n >= 1024 ** 3 ? `${(n / 1024 ** 3).toFixed(1)} GB` : n >= 1024 ** 2 ? `${Math.round(n / 1024 ** 2)} MB` : `${Math.ceil(n / 1024)} KB`;
const thaiDate = (ymd: string) =>
  new Intl.DateTimeFormat('th-TH-u-ca-gregory', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${ymd}T00:00:00Z`),
  );
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

let session: Session;
let entries: Entry[] = [];
const catLabel = (k: string) => session.config?.categories.find((c) => c.key === k)?.label ?? k;

/* ── Sign in ─────────────────────────────────────────────────── */
async function boot() {
  try {
    session = await api<Session>('session');
  } catch {
    $('[data-view="loading"]').textContent = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองรีเฟรชอีกครั้ง';
    return;
  }
  if (!session.enabled) return show('disabled');
  if (!session.authed) {
    show('login');
    $<HTMLInputElement>('[data-login] input[name="password"]').focus();
    return;
  }
  startApp();
}

$<HTMLFormElement>('[data-login]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget as HTMLFormElement;
  const msg = $('[data-login-msg]');
  const btn = $<HTMLButtonElement>('button', form);
  btn.disabled = true;
  msg.textContent = '';
  try {
    await api('login', { method: 'POST', body: JSON.stringify({ password: new FormData(form).get('password') }) });
    form.reset();
    await boot();
  } catch (err) {
    msg.textContent = say((err as ApiError).code);
    msg.classList.add('is-error');
  } finally {
    btn.disabled = false;
  }
});

$('[data-logout]').addEventListener('click', async () => {
  await api('logout', { method: 'POST' }).catch(() => {});
  location.reload();
});

/* ── The app ─────────────────────────────────────────────────── */
const form = $<HTMLFormElement>('[data-new]');
const fileInput = $<HTMLInputElement>('[data-file]');
let file: File | null = null;
let started = false;

function startApp() {
  show('app');
  $('[data-logout]').hidden = false;
  const cfg = session.config!;

  // Warnings: no volume / no ffmpeg
  const warn = $('[data-warn]');
  const notes: string[] = [];
  if (!session.persistent)
    notes.push(
      '<b>ยังไม่ได้ต่อ Volume</b> — ต้องมีที่เก็บถาวรก่อน ไม่อย่างนั้นอัปเดตจะหายทุกครั้งที่ deploy: ใน Railway กด <b>⌘K</b> (หรือคลิกขวาที่ว่างในโปรเจกต์) → <b>Volume</b> → เลือก service ของเว็บ → Mount path <code>/data</code> → รอ deploy ใหม่ แล้วรีเฟรชหน้านี้',
    );
  if (!session.ffmpeg)
    notes.push(
      '<b>ไม่พบ ffmpeg บนเซิร์ฟเวอร์</b> — คลิปจะยังประมวลผลไม่ได้ ลองกด Redeploy ใน Railway ก่อน ถ้ายังไม่หาย ให้เพิ่ม Variable <code>RAILPACK_DEPLOY_APT_PACKAGES</code> = <code>ffmpeg</code> แล้ว deploy ใหม่ (คลิปที่ค้างอยู่กด “ลองประมวลผลใหม่” ได้)',
    );
  warn.innerHTML = notes.join('<br><br>');
  warn.hidden = !notes.length;
  submit.disabled = !session.persistent;

  if (!started) {
    started = true;
    // Projects
    $('[data-projects]').innerHTML = cfg.projects
      .map((p) => `<option value="${esc(p.slug)}"${p.slug === cfg.featured ? ' selected' : ''}>${esc(p.title)}</option>`)
      .join('');
    // Categories
    $('[data-cats]').innerHTML = cfg.categories
      .map(
        (c) =>
          `<label class="st-chip"><input type="radio" name="category" value="${esc(c.key)}" required><span><b>${esc(c.label)}</b><i>${esc(c.hint)}</i></span></label>`,
      )
      .join('');
    $<HTMLInputElement>('input[name="date"]', form).value = session.today ?? '';
    $<HTMLInputElement>('input[name="date"]', form).max = session.today ?? '';
  }
  const d = session.disk;
  $('[data-storage]').textContent = d ? `พื้นที่ว่าง ${bytes(d.free)} จาก ${bytes(d.total)}` : '';
  refresh();
}

/* ── Picking a file ── */
function setFile(f: File | null) {
  file = f;
  const box = $('[data-preview]');
  const media = $('[data-preview-media]');
  media.replaceChildren();
  if (!f) {
    box.hidden = true;
    fileInput.value = '';
    return;
  }
  const url = URL.createObjectURL(f);
  if (f.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    media.append(img);
  } else {
    const v = document.createElement('video');
    v.src = url;
    v.muted = true;
    v.playsInline = true;
    v.preload = 'metadata';
    v.addEventListener('loadedmetadata', () => {
      const s = Math.round(v.duration);
      if (Number.isFinite(s)) $('[data-file-info]').textContent += ` · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      v.currentTime = Math.min(1, v.duration / 4);
    });
    media.append(v);
  }
  $('[data-file-info]').textContent = `${f.name} · ${bytes(f.size)}`;
  box.hidden = false;
}
fileInput.addEventListener('change', () => setFile(fileInput.files?.[0] ?? null));
$('[data-clear-file]').addEventListener('click', () => setFile(null));
const drop = $('[data-drop]');
drop.addEventListener('dragover', () => drop.classList.add('is-over'));
drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
drop.addEventListener('drop', () => drop.classList.remove('is-over'));

/* ── Upload in pieces (resumes after a dropped connection) ── */
function putChunk(id: string, offset: number, blob: Blob, onProgress: (sent: number) => void) {
  return new Promise<number>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `/studio/api/entries/${id}/upload?offset=${offset}`);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      let data: { received?: number; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* keep {} */
      }
      if (xhr.status === 200) resolve(data.received ?? offset + blob.size);
      else if (xhr.status === 409 && typeof data.received === 'number') resolve(data.received);
      else reject(new ApiError(data.error ?? 'server', xhr.status, data));
    };
    xhr.onerror = () => reject(new ApiError('network', 0));
    xhr.ontimeout = () => reject(new ApiError('network', 0));
    xhr.timeout = 4 * 60e3;
    xhr.send(blob);
  });
}

async function upload(id: string, f: File, progress: (done: number) => void) {
  let offset = 0;
  let tries = 0;
  while (offset < f.size) {
    const blob = f.slice(offset, offset + CHUNK);
    try {
      offset = await putChunk(id, offset, blob, (sent) => progress(offset + sent));
      tries = 0;
      progress(offset);
    } catch (err) {
      if ((err as ApiError).status >= 400 && (err as ApiError).status !== 409 && (err as ApiError).status < 500) throw err;
      if (++tries > 6) throw err;
      await new Promise((r) => setTimeout(r, Math.min(15000, 1000 * 2 ** tries)));
      // Ask where the server got to, and carry on from there.
      const s = await api<{ received: number }>(`entries/${id}/upload`).catch(() => ({ received: offset }));
      offset = s.received;
    }
  }
}

/* ── Posting ── */
const msg = $('[data-form-msg]');
const bar = $('[data-bar]');
const prog = $('[data-progress]');
const progText = $('[data-progress-text]');
const submit = $<HTMLButtonElement>('[data-submit]');
let busy = false;

function setProgress(text: string, p: number | null) {
  prog.hidden = false;
  prog.classList.toggle('is-busy', p === null);
  if (p !== null) bar.style.setProperty('--p', String(Math.max(0, Math.min(1, p))));
  progText.textContent = text;
}

window.addEventListener('beforeunload', (e) => {
  if (busy) e.preventDefault();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (busy) return;
  msg.textContent = '';
  msg.className = 'st-msg';
  const fd = new FormData(form);
  const payload = {
    date: String(fd.get('date') || ''),
    project: String(fd.get('project') || ''),
    category: String(fd.get('category') || ''),
    title: String(fd.get('title') || '').trim(),
    text: String(fd.get('text') || '').trim(),
    link: String(fd.get('link') || '').trim(),
    hidden: fd.get('hidden') === 'on',
    ...(file ? { file: { size: file.size, type: file.type, name: file.name } } : {}),
  };
  const fail = (text: string) => {
    msg.textContent = text;
    msg.classList.add('is-error');
  };
  if (!payload.category) return fail(say('category'));
  if (!payload.title) return fail(say('title'));
  if (payload.link && !/^https?:\/\//i.test(payload.link)) return fail(say('link'));
  if (file && file.size > MAX) return fail(say('file-too-large'));

  busy = true;
  submit.disabled = true;
  let lock: { release: () => Promise<void> } | null = null;
  try {
    lock = await (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock
      ?.request('screen')
      .catch(() => null) ?? null;
    const { entry } = await api<{ entry: Entry }>('entries', { method: 'POST', body: JSON.stringify(payload) });
    let final = entry;
    if (file) {
      const f = file;
      setProgress('กำลังอัปโหลด 0%', 0);
      await upload(entry.id, f, (done) => setProgress(`กำลังอัปโหลด ${Math.floor((done / f.size) * 100)}% · ${bytes(done)} / ${bytes(f.size)}`, done / f.size));
      setProgress('กำลังย่อคลิปให้พร้อมขึ้นเว็บ… (ปกติไม่เกิน 1–2 นาที ปิดหน้านี้ได้)', null);
      await api(`entries/${entry.id}/process`, { method: 'POST' });
      busy = false; // the server has the file — leaving is safe now
      final = await waitFor(entry.id);
    }
    prog.hidden = true;
    if (final.status === 'failed') {
      fail(`ประมวลผลคลิปไม่สำเร็จ: ${final.error ?? ''}`);
    } else {
      msg.innerHTML = payload.hidden
        ? 'บันทึกแล้ว (ซ่อนอยู่)'
        : `ขึ้นเว็บแล้ว ✓ <a href="/devlog/#u-${esc(final.id)}" target="_blank" rel="noopener">ดูบนเว็บ ↗</a>`;
      msg.classList.add('is-ok');
      // Ready for the next one: keep the date, project and category.
      for (const n of ['title', 'text', 'link']) ($(`[name="${n}"]`, form) as HTMLInputElement).value = '';
      $<HTMLInputElement>('[name="hidden"]', form).checked = false;
      setFile(null);
    }
  } catch (err) {
    prog.hidden = true;
    fail((err as ApiError).code === 'network' ? 'อินเทอร์เน็ตหลุดระหว่างอัปโหลด ลองกดโพสต์อีกครั้ง' : say((err as ApiError).code));
  } finally {
    busy = false;
    submit.disabled = false;
    lock?.release().catch(() => {});
    refresh();
  }
});

async function waitFor(id: string): Promise<Entry> {
  for (;;) {
    await new Promise((r) => setTimeout(r, 2500));
    const { entries: list } = await api<{ entries: Entry[] }>('entries');
    entries = list;
    render();
    const e = list.find((x) => x.id === id);
    if (!e) throw new ApiError('gone', 404);
    if (e.status === 'live' || e.status === 'failed') return e;
  }
}

/* ── The list ─────────────────────────────────────────────────── */
const listEl = $('[data-entries]');
let poll = 0;

async function refresh() {
  try {
    entries = (await api<{ entries: Entry[] }>('entries')).entries;
  } catch {
    return;
  }
  render();
  window.clearTimeout(poll);
  if (entries.some((e) => e.status === 'processing')) poll = window.setTimeout(refresh, 4000);
}

const STATUS: Record<Entry['status'], string> = {
  uploading: 'อัปโหลดไม่จบ',
  processing: 'กำลังย่อคลิป…',
  live: 'ขึ้นเว็บแล้ว',
  failed: 'ผิดพลาด',
};

function render() {
  if (!entries.length) {
    listEl.innerHTML = '<p class="st-empty">ยังไม่มีอัปเดต — โพสต์อันแรกได้จากฟอร์มด้านบน</p>';
    return;
  }
  let day = '';
  listEl.innerHTML = entries
    .map((e) => {
      const head = e.date !== day ? `<p class="st-day">${thaiDate((day = e.date))}</p>` : '';
      const badge = e.hidden && e.status === 'live' ? 'ซ่อนอยู่' : STATUS[e.status];
      const cls = e.status === 'live' && !e.hidden ? 'st-badge--live' : e.status === 'failed' ? 'st-badge--failed' : '';
      const thumb = e.thumb
        ? `<img src="${esc(e.thumb)}" alt="" loading="lazy">`
        : e.media || e.upload
          ? '…'
          : 'ข้อความ';
      const actions = [
        `<button type="button" data-act="edit">แก้ไข</button>`,
        e.status === 'live' ? `<button type="button" data-act="toggle">${e.hidden ? 'แสดงบนเว็บ' : 'ซ่อน'}</button>` : '',
        e.status === 'live' && !e.hidden ? `<a href="/devlog/#u-${esc(e.id)}" target="_blank" rel="noopener">ดูบนเว็บ ↗</a>` : '',
        e.status === 'failed' ? `<button type="button" data-act="retry">ลองประมวลผลใหม่</button>` : '',
        `<button type="button" class="is-danger" data-act="delete">ลบ</button>`,
      ].join('');
      return `${head}
      <article class="st-entry${e.hidden ? ' is-hidden' : ''}" data-id="${esc(e.id)}">
        <div class="st-entry__thumb">${thumb}</div>
        <div class="st-entry__body">
          <p class="st-entry__meta"><span>${esc(catLabel(e.category))}</span><span class="st-badge ${cls}">${esc(badge)}</span>${e.media?.duration ? `<span>${Math.round(e.media.duration)} วินาที</span>` : ''}</p>
          <p class="st-entry__title">${esc(e.title)}</p>
          ${e.text ? `<p class="st-entry__text">${esc(e.text)}</p>` : ''}
          ${e.status === 'failed' && e.error ? `<p class="st-entry__err">${esc(e.error)}</p>` : ''}
          ${e.status === 'uploading' ? `<p class="st-entry__err">อัปโหลดค้างอยู่ (${bytes(e.received ?? 0)} / ${bytes(e.upload?.size ?? 0)}) — ลบแล้วโพสต์ใหม่</p>` : ''}
          <div class="st-entry__actions">${actions}</div>
        </div>
      </article>`;
    })
    .join('');
}

listEl.addEventListener('click', async (ev) => {
  const btn = (ev.target as Element).closest<HTMLButtonElement>('button[data-act]');
  if (!btn) return;
  const card = btn.closest<HTMLElement>('.st-entry')!;
  const e = entries.find((x) => x.id === card.dataset.id);
  if (!e) return;
  const act = btn.dataset.act;
  try {
    if (act === 'toggle') {
      await api(`entries/${e.id}`, { method: 'PATCH', body: JSON.stringify({ hidden: !e.hidden }) });
      return refresh();
    }
    if (act === 'retry') {
      await api(`entries/${e.id}/retry`, { method: 'POST' });
      return refresh();
    }
    if (act === 'delete') {
      // Two taps: the first one asks.
      if (btn.dataset.armed !== '1') {
        btn.dataset.armed = '1';
        btn.textContent = 'กดอีกครั้งเพื่อลบถาวร';
        window.setTimeout(() => {
          btn.dataset.armed = '';
          btn.textContent = 'ลบ';
        }, 4000);
        return;
      }
      await api(`entries/${e.id}`, { method: 'DELETE' });
      return refresh();
    }
    if (act === 'edit') return openEdit(card, e);
  } catch (err) {
    alertIn(card, say((err as ApiError).code));
  }
});

function alertIn(card: HTMLElement, text: string) {
  let p = card.querySelector<HTMLElement>('.st-msg');
  if (!p) {
    p = document.createElement('p');
    p.className = 'st-msg is-error';
    card.querySelector('.st-entry__body')!.append(p);
  }
  p.textContent = text;
}

function openEdit(card: HTMLElement, e: Entry) {
  if (card.querySelector('.st-edit')) return;
  const cfg = session.config!;
  const f = document.createElement('form');
  f.className = 'st-edit';
  f.innerHTML = `
    <div class="st-row">
      <label class="st-field"><span>วันที่</span><input type="date" name="date" value="${esc(e.date)}" required></label>
      <label class="st-field"><span>หมวด</span><select name="category">${cfg.categories
        .map((c) => `<option value="${esc(c.key)}"${c.key === e.category ? ' selected' : ''}>${esc(c.label)}</option>`)
        .join('')}</select></label>
    </div>
    <label class="st-field"><span>หัวข้อ</span><input name="title" maxlength="120" value="${esc(e.title)}" required></label>
    <label class="st-field"><span>รายละเอียด</span><textarea name="text" maxlength="1200" rows="3">${esc(e.text ?? '')}</textarea></label>
    <label class="st-field"><span>ลิงก์โพสต์บน X</span><input type="url" name="link" value="${esc(e.link ?? '')}"></label>
    <div class="st-edit__actions"><button class="btn-solid" type="submit">บันทึก</button><button class="btn-line" type="button" data-cancel>ยกเลิก</button></div>
    <p class="st-msg" role="status"></p>`;
  card.append(f);
  f.querySelector('[data-cancel]')!.addEventListener('click', () => f.remove());
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const fd = new FormData(f);
    try {
      await api(`entries/${e.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          date: fd.get('date'),
          category: fd.get('category'),
          title: fd.get('title'),
          text: fd.get('text'),
          link: fd.get('link'),
        }),
      });
      refresh();
    } catch (err) {
      const p = f.querySelector<HTMLElement>('.st-msg')!;
      p.textContent = say((err as ApiError).code);
      p.classList.add('is-error');
    }
  });
  f.querySelector<HTMLInputElement>('[name="title"]')!.focus();
}

boot();
