function normalizeTime(value) {
  if (value instanceof Date) return value;

  const s = String(value).trim();
  if (!s) return '';

  const m = s.match(/^(\d{1,2})[.:\- ]?(\d{0,2})$/);
  if (!m) return s;

  const hh = Math.min(23, parseInt(m[1], 10));
  const mm = Math.min(59, m[2] ? parseInt(m[2], 10) : 0);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);
}

function computeDurationMs(takeoff, landing) {
  if (!(takeoff instanceof Date) || !(landing instanceof Date)) return null;
  if (isNaN(takeoff.getTime()) || isNaN(landing.getTime())) return null;

  const dayMs = 24 * 3600 * 1000;
  const delta = landing - takeoff;
  return delta < 0 ? delta + dayMs : delta;
}

function normalizeDateValue_(value) {
  if (!value) return '';
  if (value instanceof Date) return value;

  const s = String(value).trim();
  if (!s) return '';

  const formats = [
    {
      regex: /^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/,
      toDate: (m) => new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    },
    {
      regex: /^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/,
      toDate: (m) => new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
    }
  ];

  for (const format of formats) {
    const m = s.match(format.regex);
    if (m) return format.toDate(m);
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed;

  return value;
}

function formatDurationHuman(ms) {
  if (!ms) return '0хв';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? (h + 'год ' + m + 'хв') : (m + 'хв');
}