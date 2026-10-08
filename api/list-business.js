/**
 * POST /api/list-business: a provider asks to be listed in the services directory.
 *
 * The form on /list-your-business posts JSON here, and this sends it to info@topblog.agency through
 * Resend, the same account and verified domain the Topblog contact form uses. It needs one
 * environment variable on the Vercel project: RESEND_API_KEY. Without it the route answers 503 and
 * the page falls back to a prefilled email, so a submission is never lost to a missing key.
 *
 * Nothing is stored. The mail is the record, and the listing is added by hand. Everything under
 * "For the listing" is meant to be published in full (the firm-supplied-data rule); the rest is not.
 */

const TO = 'info@topblog.agency';
const FROM = process.env.LISTING_FROM || 'The Nomad HQ <info@topblog.agency>';

// Nobody fills in a business name, a city, a language and an email address in under three seconds.
const MIN_FILL_MS = 3000;

const CATEGORIES = {
  doctor: 'Doctors & clinics', dentist: 'Dentists', vet: 'Veterinarians',
  therapy: 'Therapy & counselling', physio: 'Physio & chiropractic', optician: 'Opticians & eye care',
  hair: 'Hair & barbers', legal: 'Legal & visa', tax: 'Accountants & tax',
  realestate: 'Real estate & rentals', mechanic: 'Vehicle & scooter repair',
  fitness: 'Gyms & personal training', translator: 'Translators & interpreters',
  pharmacy: 'Pharmacies', school: 'Schools', other: 'Something else',
};

// Field name -> [label, max length, part of the public listing?]
const FIELDS = {
  businessName: ['Business name', 200, true],
  city: ['City', 100, true],
  category: ['Service', 40, true],
  categoryOther: ['Service (their words)', 200, true],
  languages: ['Languages', 400, true],
  website: ['Website', 300, true],
  address: ['Address', 300, true],
  phone: ['Phone', 60, true],
  whatsapp: ['WhatsApp', 60, true],
  publicEmail: ['Public email', 200, true],
  description: ['What they offer', 2000, true],
  contactName: ['Contact person', 200, false],
  email: ['Reply to', 200, false],
  message: ['Note to us', 2000, false],
};

const ORIGINS = /^https:\/\/(thenomadhq\.com|www\.thenomadhq\.com|[a-z0-9-]+\.vercel\.app)$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const clean = (v, max) => (typeof v === 'string' ? v.replace(/\s+$/g, '').replace(/^\s+/g, '').slice(0, max) : '');

function websiteUrl(raw) {
  if (!raw) return '';
  const candidate = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
  try {
    const u = new URL(candidate);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return '';
    return u.toString();
  } catch { return ''; }
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 50000) throw new Error('too large');
  }
  return raw ? JSON.parse(raw) : {};
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'Use POST.' });
  }
  const origin = req.headers.origin;
  if (origin && !ORIGINS.test(origin)) return send(res, 403, { error: 'Not allowed.' });

  let body;
  try { body = await readBody(req); } catch { return send(res, 400, { error: 'That did not arrive in one piece. Please try again.' }); }

  // Bot checks answer exactly like a success, so a script cannot tell which one caught it.
  const tooFast = typeof body.elapsedMs !== 'number' || body.elapsedMs < MIN_FILL_MS;
  if (clean(body.fax, 200) || tooFast) return send(res, 200, { ok: true });

  const v = {};
  for (const [key, [, max]] of Object.entries(FIELDS)) {
    v[key] = key === 'languages'
      ? (Array.isArray(body.languages) ? body.languages.map((l) => clean(l, 60)).filter(Boolean).join(', ').slice(0, max) : '')
      : clean(body[key], max);
  }

  if (v.businessName.length < 2) return send(res, 400, { error: 'Please give the name of the business.', field: 'businessName' });
  if (v.city.length < 2) return send(res, 400, { error: 'Please choose your city.', field: 'city' });
  if (!CATEGORIES[v.category]) return send(res, 400, { error: 'Please choose what kind of service you offer.', field: 'category' });
  if (!v.languages) return send(res, 400, { error: 'Please tell us at least one language you work in.', field: 'languages' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) return send(res, 400, { error: 'Please give an email address we can reply to.', field: 'email' });
  if (v.publicEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.publicEmail)) return send(res, 400, { error: 'The public email address does not look complete.', field: 'publicEmail' });

  const site = websiteUrl(v.website);
  const service = v.category === 'other' ? (v.categoryOther || CATEGORIES.other) : CATEGORIES[v.category];
  const shown = { ...v, category: service, categoryOther: '', website: site || v.website };

  if (!process.env.RESEND_API_KEY) {
    console.error('list-business: RESEND_API_KEY is not set on this Vercel project');
    return send(res, 503, { error: 'Our mail service is not set up yet.', fallback: true });
  }

  const row = (key) => {
    const value = shown[key];
    if (!value) return '';
    const label = FIELDS[key][0];
    const html = key === 'website' && site
      ? `<a href="${esc(site)}" style="color:#c0392b">${esc(site)}</a>`
      : esc(value).replace(/\n/g, '<br>');
    return `<tr><td style="padding:8px 14px 8px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap">${esc(label)}</td>`
      + `<td style="padding:8px 0;color:#0f172a;font-size:15px">${html}</td></tr>`;
  };
  const listingKeys = Object.keys(FIELDS).filter((k) => FIELDS[k][2]);
  const privateKeys = Object.keys(FIELDS).filter((k) => !FIELDS[k][2]);

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;padding:20px;color:#334155">
<div style="background:#0f172a;border-radius:12px;padding:24px 26px;margin-bottom:18px">
<p style="margin:0;color:#ff8863;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700">The Nomad HQ &middot; listing request</p>
<h1 style="margin:8px 0 0;color:#fff;font-size:22px">${esc(v.businessName)}</h1>
<p style="margin:6px 0 0;color:#cbd5e1;font-size:14px">${esc(service)} in ${esc(v.city)}</p></div>
<h2 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin:0 0 6px">For the listing</h2>
<table style="border-collapse:collapse;width:100%;margin-bottom:22px">${listingKeys.map(row).join('')}</table>
<h2 style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;margin:0 0 6px">Not for publication</h2>
<table style="border-collapse:collapse;width:100%">${privateKeys.map(row).join('')}</table>
<p style="margin-top:24px;font-size:13px;color:#6b7280">Reply to this email to reach ${esc(v.contactName || v.businessName)} at ${esc(v.email)}.</p>
</body></html>`;

  const text = ['Listing request from thenomadhq.com', '', 'FOR THE LISTING']
    .concat(listingKeys.filter((k) => shown[k]).map((k) => FIELDS[k][0] + ': ' + shown[k]))
    .concat(['', 'NOT FOR PUBLICATION'])
    .concat(privateKeys.filter((k) => shown[k]).map((k) => FIELDS[k][0] + ': ' + shown[k]))
    .join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: v.email,
        subject: `Listing request: ${v.businessName} (${service}, ${v.city})`.slice(0, 250),
        html,
        text,
      }),
    });
    if (!r.ok) {
      console.error('list-business: Resend answered ' + r.status + ' ' + (await r.text()).slice(0, 500));
      return send(res, 502, { error: 'The message could not be sent.', fallback: true });
    }
  } catch (e) {
    console.error('list-business: ' + e.message);
    return send(res, 502, { error: 'The message could not be sent.', fallback: true });
  }

  return send(res, 200, { ok: true });
};
