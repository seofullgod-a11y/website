/**
 * Contact page form (ContactPage.astro).
 * Checks the fields, sends them to /api/contact as JSON and shows the result in place.
 * Anything that goes wrong offers the same message by email instead (mailto, pre-written).
 * Without JavaScript the form still posts normally — the server handles both.
 */

type Msgs = Record<'required' | 'email' | 'link' | 'short' | 'long' | 'rate' | 'failed' | 'offline', string>;
type Labels = Record<'name' | 'email' | 'roles' | 'message' | 'link', string>;

const EMAIL = /^[^\s@<>()",;:\\]+@[^\s@<>()",;:\\]+\.[^\s@<>()",;:\\]{2,}$/;
const MIN_MESSAGE = 10;
const MAX_MESSAGE = 4000;

/* ── Copy the email address ── */
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
  if (!navigator.clipboard?.writeText) return;
  btn.hidden = false;
  const label = btn.textContent ?? '';
  let timer = 0;
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy ?? '');
      btn.textContent = btn.dataset.copied ?? label;
      btn.classList.add('is-done');
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        btn.textContent = label;
        btn.classList.remove('is-done');
      }, 1800);
    } catch {
      /* the link next to it still works */
    }
  });
});

/* ── The form ── */
const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
if (form) {
  const panel = form.parentElement!;
  const msgs = JSON.parse(form.dataset.msgs ?? '{}') as Msgs;
  const labels = JSON.parse(form.dataset.labels ?? '{}') as Labels;
  const sent = panel.querySelector<HTMLElement>('[data-contact-sent]')!;
  const sentText = panel.querySelector<HTMLElement>('[data-contact-sent-text]')!;
  const again = panel.querySelector<HTMLButtonElement>('[data-contact-again]');
  const alertBox = form.querySelector<HTMLElement>('[data-contact-alert]')!;
  const alertText = form.querySelector<HTMLElement>('[data-contact-alert-text]')!;
  const fallback = form.querySelector<HTMLAnchorElement>('[data-contact-fallback]');
  const submit = form.querySelector<HTMLButtonElement>('[data-contact-submit]')!;
  const submitLabel = form.querySelector<HTMLElement>('[data-contact-submit-label]')!;
  const idle = submitLabel.textContent ?? '';
  const t = form.querySelector<HTMLInputElement>('[data-contact-t]');
  if (t) t.value = String(Date.now());

  const field = (name: string) => form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
  const value = (name: string) => (field(name)?.value ?? '').trim();
  const roles = () =>
    [...form.querySelectorAll<HTMLInputElement>('input[name="roles"]:checked')].map((i) => i.value);

  const setError = (name: string, text: string) => {
    const input = field(name);
    const out = form.querySelector<HTMLElement>(`[data-err-for="${name}"]`);
    if (out) out.textContent = text;
    if (input) {
      if (text) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  };
  const clearErrors = () => ['name', 'email', 'message', 'link'].forEach((n) => setError(n, ''));

  // Errors go away as soon as someone starts fixing them.
  form.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.name && target.getAttribute('aria-invalid')) setError(target.name, '');
  });

  const check = () => {
    const problems: [string, string][] = [];
    const link = value('link');
    if (!value('name')) problems.push(['name', msgs.required]);
    if (!value('email')) problems.push(['email', msgs.required]);
    else if (!EMAIL.test(value('email'))) problems.push(['email', msgs.email]);
    const m = value('message');
    if (!m) problems.push(['message', msgs.required]);
    else if (m.length < MIN_MESSAGE) problems.push(['message', msgs.short]);
    else if (m.length > MAX_MESSAGE) problems.push(['message', msgs.long]);
    if (link && !/^https?:\/\/[^\s]+\.[^\s]+/i.test(link)) problems.push(['link', msgs.link]);
    return problems;
  };

  /** The same message, ready to send from their own email app. */
  const mailto = () => {
    const to = form.dataset.email ?? '';
    const lines = [
      value('message'),
      '',
      '—',
      `${labels.name}: ${value('name')}`,
      `${labels.email}: ${value('email')}`,
      ...(roles().length ? [`${labels.roles}: ${roles().join(', ')}`] : []),
      ...(value('link') ? [`${labels.link}: ${value('link')}`] : []),
    ];
    return `mailto:${to}?subject=${encodeURIComponent(form.dataset.subject ?? '')}&body=${encodeURIComponent(lines.join('\n'))}`;
  };

  const showAlert = (text: string) => {
    alertText.textContent = text;
    if (fallback) fallback.href = mailto();
    alertBox.hidden = false;
  };

  const busy = (on: boolean) => {
    submit.disabled = on;
    submit.setAttribute('aria-busy', String(on));
    submitLabel.textContent = on ? (form.dataset.sending ?? idle) : idle;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    clearErrors();
    alertBox.hidden = true;

    const problems = check();
    if (problems.length) {
      problems.forEach(([n, text]) => setError(n, text));
      field(problems[0][0])?.focus();
      return;
    }

    busy(true);
    let status = 0;
    let body: { ok?: boolean; error?: string; field?: string } = {};
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: value('name'),
          email: value('email'),
          roles: roles(),
          message: value('message'),
          link: value('link'),
          hp: (field('hp')?.value ?? '').trim(),
          // How long the page was open before sending (bots are instant).
          t: t?.value ? Date.now() - Number(t.value) : 0,
        }),
      });
      status = res.status;
      body = await res.json().catch(() => ({}));
    } catch {
      status = 0;
    }
    busy(false);

    if (status === 200 && body.ok) {
      const name = value('name').split(/\s+/)[0] ?? '';
      sentText.textContent = (form.dataset.sent ?? '')
        .replace('{name}', name)
        .replace('{email}', form.dataset.email ?? '');
      form.hidden = true;
      sent.hidden = false;
      sent.focus({ preventScroll: true });
      if (sent.getBoundingClientRect().top < 0) sent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (status === 422 && body.field) {
      const kind = body.error && body.error in msgs ? (body.error as keyof Msgs) : 'required';
      setError(body.field, msgs[kind]);
      field(body.field)?.focus();
      return;
    }
    showAlert(status === 429 ? msgs.rate : status === 503 ? msgs.offline : msgs.failed);
  });

  again?.addEventListener('click', () => {
    form.reset();
    if (t) t.value = String(Date.now());
    clearErrors();
    alertBox.hidden = true;
    sent.hidden = true;
    form.hidden = false;
    field('name')?.focus();
  });
}
