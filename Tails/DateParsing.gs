/** ===========================
 *  Date parsing
 *  =========================== */

function parseDate(cellValue) {
  if (!cellValue) return null;

  const toMidnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (cellValue instanceof Date) {
    return isNaN(cellValue) ? null : toMidnight(cellValue);
  }

  if (typeof cellValue !== 'string') return null;

  const s = cellValue.trim();
  const m = s.match(/^(\d{1,2})[.\-\/](\d{1,2})(?:[.\-\/](\d{2,4}))?$/);
  if (!m) return null;

  const [, dd, mm, yy] = m;
  const now = new Date();
  const year = yy ? (yy.length < 3 ? Number(yy) + 2000 : Number(yy)) : now.getFullYear();
  const parsed = new Date(year, Number(mm) - 1, Number(dd));
  return isNaN(parsed) ? null : toMidnight(parsed);
}