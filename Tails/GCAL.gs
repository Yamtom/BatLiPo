/***** CONFIG & CONSTANTS *****/
const CFG_SHEET = 'GCAL_CONFIG';
const NOTE_PREFIX = '[GCAL]';
const BASE_EPOCH = new Date('1899-12-30T00:00:00Z'); // серійні дати
const TZ = Session.getScriptTimeZone();
const STATE_KEY = 'gcal_sync_cursor_v2';
const LIMITS = {
  MAX_MS: 5.5 * 600 * 1000,  // зупиняємось за ~5,5 хв до тайм-ауту
  CACHE_TTL_SEC: 30 * 60    // кешуємо події на 30 хв
};

/***** AUTO: оновлення при редагуванні *****/
function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    const cfg = readConfig();
    if (!isSheetAllowed(sh.getName(), cfg.sheetsWhitelist)) return;

    // Якщо є список дозволених колонок — перевіряємо
    if (cfg.dateColumns.length && !cfg.dateColumns.includes(e.range.getColumn())) return;

    // Беремо саме одне значення (першу клітинку виділення)
    const v = e.range.getValue();
    const dt = coerceToDate(v);
    if (!dt) return;

    const cal = CalendarApp.getCalendarById(cfg.calendarId);
    if (!cal) throw new Error('Календар не знайдено: ' + cfg.calendarId);

    const events = cal.getEventsForDay(dt);
    const newNote = buildNote(events, dt);
    upsertNote(sh.getRange(e.range.getRow(), e.range.getColumn()), newNote);
  } catch (_) {}
}

/***** MANUAL / TIME-DRIVEN: масовий обхід усіх аркушів *****/
function syncAllChunked() {
  const t0 = Date.now();
  const cfg = readConfig();
  const cal = CalendarApp.getCalendarById(cfg.calendarId);
  const STATE_KEY = 'gcal_sync_cursor_v2';

  if (!cal) throw new Error('Календар не знайдено: ' + cfg.calendarId);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().filter(s => isSheetAllowed(s.getName(), cfg.sheetsWhitelist));
  const props = PropertiesService.getScriptProperties();
  let state = JSON.parse(props.getProperty(STATE_KEY) || '{}');
  let si = Number.isInteger(state.si) ? state.si : 0; // індекс аркуша
  let r0 = Number.isInteger(state.r0) ? state.r0 : 1; // наступний рядок

  const cache = CacheService.getScriptCache();
  const dayMemo = new Map(); // in-memory для цього запуску

  for (; si < sheets.length; si++) {
    const sh = sheets[si];
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    if (lastRow === 0 || lastCol === 0) { r0 = 1; continue; }

    const cols = cfg.dateColumns.length ? cfg.dateColumns.filter(c => c <= lastCol)
                                        : Array.from({length: lastCol}, (_,i)=>i+1);

    // читаємо один раз
    const range = sh.getRange(1, 1, lastRow, lastCol);
    const values = range.getValues();
    const notes = range.getNotes();

    for (let r = r0; r <= lastRow; r++) {
      for (let k = 0; k < cols.length; k++) {
        const c = cols[k];
        const v = values[r-1][c-1];
        const dt = coerceToDate(v);
        if (!dt) continue;

        const dayKey = Utilities.formatDate(dt, TZ, 'yyyy-MM-dd');
        let noteText = dayMemo.has(dayKey) ? dayMemo.get(dayKey) : cache.get(dayKey);
        if (noteText === null) { // кеш-міс
          const events = cal.getEventsForDay(dt);
          noteText = buildNote(events, dt);
          cache.put(dayKey, noteText, LIMITS.CACHE_TTL_SEC);
          dayMemo.set(dayKey, noteText);
        } else if (noteText === null || noteText === undefined) {
          // на всяк випадок — якщо cache повернув undefined (не має статися)
          noteText = '';
        }

        const cell = sh.getRange(r, c);
        // мінімізуємо записи
        const oldNote = notes[r-1][c-1] || '';
        const oursOld = oldNote.startsWith(NOTE_PREFIX) ? oldNote : '';
        const oursNew = noteText ? `${NOTE_PREFIX} ${noteText}` : '';
        if (oursOld !== oursNew) upsertNote(cell, noteText);

        // контроль часу
        if (Date.now() - t0 > LIMITS.MAX_MS) {
          props.setProperty(STATE_KEY, JSON.stringify({si, r0: r}));
          return; // наступний запуск продовжить
        }
      }
    }
    r0 = 1; // наступний аркуш з початку
  }

  // завершили все — чистимо стан
  PropertiesService.getScriptProperties().deleteProperty(STATE_KEY);
}

/***** CONFIG SHEET *****/
function ensureConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CFG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CFG_SHEET);
    sh.getRange(1,1,1,2).setValues([['key','value']]);
    sh.getRange(2,1,1,2).setValues([['calendarId','primary']]);
    sh.getRange(3,1,1,2).setValues([['sheetsWhitelist','']]); // через кому або порожньо
    sh.getRange(4,1,1,2).setValues([['dateColumns','']]);     // напр. 1,2,3 або порожньо
    sh.autoResizeColumns(1,2);
  }
  SpreadsheetApp.getUi().alert('Аркуш конфігурації готовий: ' + CFG_SHEET);
}

function readConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CFG_SHEET);
  let calendarId = 'primary', sheetsWhitelist = [], dateColumns = [];
  if (sh) {
    const obj = Object.fromEntries(
      sh.getDataRange().getValues()
        .filter(r => r[0] && r[0] !== 'key')
        .map(r => [String(r[0]).trim(), String(r[1] ?? '').trim()])
    );
    calendarId = obj.calendarId || 'primary';
    sheetsWhitelist = (obj.sheetsWhitelist || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    dateColumns = (obj.dateColumns || '')
      .split(',')
      .map(s => parseInt(s.trim(),10))
      .filter(n => Number.isInteger(n) && n > 0);
  }
  return { calendarId, sheetsWhitelist, dateColumns };
}

function isSheetAllowed(name, whitelist) {
  return !whitelist.length || whitelist.includes(name);
}

/***** NOTES *****/
function upsertNote(range, plainNote) {
  if (plainNote && plainNote.length) {
    range.setNote(`${NOTE_PREFIX} ${plainNote}`);
  } else {
    // Чистимо лише наші примітки
    const old = range.getNote() || '';
    if (old.startsWith(NOTE_PREFIX)) range.setNote('');
  }
}

/***** DATE PARSING *****/
function coerceToDate(v) {
  // вже Date
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  }
  // серійне число
  if (typeof v === 'number') {
    const d = new Date(BASE_EPOCH.getTime() + v * 86400000);
    if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  // рядок
  if (typeof v === 'string') {
    const s = v.trim();
    const patterns = [
      [/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, (d,m,y)=> new Date(y, m-1, d)],
      [/^(\d{1,2})\.(\d{1,2})$/, (d,m)=> new Date((new Date).getFullYear(), m-1, d)],
      [/^(\d{4})-(\d{2})-(\d{2})$/, (y,m,d)=> new Date(y, m-1, d)],
      [/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, (d,m,y)=> new Date(y, m-1, d)],
      [/^(\d{1,2})\/(\d{1,2})$/, (m,d)=> new Date((new Date).getFullYear(), m-1, d)],
    ];
    for (const [re, ctor] of patterns) {
      const m = s.match(re);
      if (m) {
        const parts = m.slice(1).map(x=>parseInt(x,10));
        const d = ctor(...parts);
        if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }
  }
  return null;
}

/***** NOTE CONTENT *****/
function buildNote(events, day) {
  if (!events || !events.length) return '';
  const fmt = d => Utilities.formatDate(d, TZ, 'HH:mm');
  const lines = events
    .sort((a,b)=> a.getStartTime()-b.getStartTime())
    .map(ev => {
      const allDay = ev.isAllDayEvent && ev.isAllDayEvent();
      const time = allDay ? 'Весь день' : `${fmt(ev.getStartTime())}–${fmt(ev.getEndTime())}`;
      return `${time} — ${ev.getTitle()}`;
    });
  return Utilities.formatDate(day, TZ, 'yyyy-MM-dd') + '\n' + lines.join('\n');
}
