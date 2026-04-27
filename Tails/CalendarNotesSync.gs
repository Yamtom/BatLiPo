/** Налаштування і константи */
const CFG_SHEET = 'GCAL_CONFIG';
const DEFAULT_CALENDAR_ID = 'BatLiPo60@gmail.com';
const NOTE_PREFIX = '[GCAL]';
const BASE_EPOCH = new Date('1899-12-30T00:00:00Z');
const TZ = Session.getScriptTimeZone();
const STATE_KEY = 'gcal_sync_cursor_v2';
const LIMITS = {
  MAX_MS: 5.5 * 600 * 1000,
  CACHE_TTL_SEC: 30 * 60
};

function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    const cfg = readConfig();
    if (!isSheetAllowed(sh.getName(), cfg.sheetsWhitelist)) return;
    if (cfg.dateColumns.length && !cfg.dateColumns.includes(e.range.getColumn())) return;

    const v = e.range.getValue();
    const dt = coerceToDate(v);
    if (!dt) return;

    const cal = CalendarApp.getCalendarById(cfg.calendarId);
    if (!cal) throw new Error('Календар не знайдено: ' + cfg.calendarId);

    const events = cal.getEventsForDay(dt);
    const newNote = buildNote(events, dt);
    upsertNote(sh.getRange(e.range.getRow(), e.range.getColumn()), newNote);
  } catch (e) {
    sendErrorNotification(e, 'gcalOnEdit');
  }
}

function syncAllChunked() {
  const t0 = Date.now();
  const cfg = readConfig();
  const cal = CalendarApp.getCalendarById(cfg.calendarId);

  if (!cal) throw new Error('Календар не знайдено: ' + cfg.calendarId);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets().filter(s => isSheetAllowed(s.getName(), cfg.sheetsWhitelist));
  const props = PropertiesService.getScriptProperties();
  let state = JSON.parse(props.getProperty(STATE_KEY) || '{}');
  let si = Number.isInteger(state.si) ? state.si : 0;
  let r0 = Number.isInteger(state.r0) ? state.r0 : 1;

  const cache = CacheService.getScriptCache();
  const dayMemo = new Map();

  for (; si < sheets.length; si++) {
    const sh = sheets[si];
    const lastRow = sh.getLastRow();
    const lastCol = sh.getLastColumn();
    if (lastRow === 0 || lastCol === 0) { r0 = 1; continue; }

    const cols = cfg.dateColumns.length ? cfg.dateColumns.filter(c => c <= lastCol)
                                        : Array.from({ length: lastCol }, (_, i) => i + 1);

    const range = sh.getRange(1, 1, lastRow, lastCol);
    const values = range.getValues();
    const notes = range.getNotes();

    for (let r = r0; r <= lastRow; r++) {
      for (let k = 0; k < cols.length; k++) {
        const c = cols[k];
        const v = values[r - 1][c - 1];
        const dt = coerceToDate(v);
        if (!dt) continue;

        const dayKey = Utilities.formatDate(dt, TZ, 'yyyy-MM-dd');
        let noteText = dayMemo.has(dayKey) ? dayMemo.get(dayKey) : cache.get(dayKey);
        if (noteText === null) {
          const events = cal.getEventsForDay(dt);
          noteText = buildNote(events, dt);
          cache.put(dayKey, noteText, LIMITS.CACHE_TTL_SEC);
          dayMemo.set(dayKey, noteText);
        } else if (noteText === null || noteText === undefined) {
          noteText = '';
        }

        const cell = sh.getRange(r, c);
        const oldNote = notes[r - 1][c - 1] || '';
        const oursOld = oldNote.startsWith(NOTE_PREFIX) ? oldNote : '';
        const oursNew = noteText ? `${NOTE_PREFIX} ${noteText}` : '';
        if (oursOld !== oursNew) upsertNote(cell, noteText);

        if (Date.now() - t0 > LIMITS.MAX_MS) {
          props.setProperty(STATE_KEY, JSON.stringify({ si, r0: r }));
          return;
        }
      }
    }
    r0 = 1;
  }

  PropertiesService.getScriptProperties().deleteProperty(STATE_KEY);
}

function ensureConfigSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CFG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(CFG_SHEET);
    sh.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
    sh.getRange(2, 1, 1, 2).setValues([['calendarId', DEFAULT_CALENDAR_ID]]);
    sh.getRange(3, 1, 1, 2).setValues([['sheetsWhitelist', '']]);
    sh.getRange(4, 1, 1, 2).setValues([['dateColumns', '']]);
    sh.autoResizeColumns(1, 2);
  } else {
    ensureConfigHeader_(sh);
    setConfigValue_(sh, 'calendarId', DEFAULT_CALENDAR_ID, true);
    setConfigValue_(sh, 'sheetsWhitelist', '', false);
    setConfigValue_(sh, 'dateColumns', '', false);
  }
  SpreadsheetApp.getUi().alert('Аркуш конфігурації готовий: ' + CFG_SHEET);
}

function readConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CFG_SHEET);
  let calendarId = DEFAULT_CALENDAR_ID, sheetsWhitelist = [], dateColumns = [];
  if (sh) {
    const obj = Object.fromEntries(
      sh.getDataRange().getValues()
        .filter(r => r[0] && r[0] !== 'key')
        .map(r => [String(r[0]).trim(), String(r[1] ?? '').trim()])
    );
    calendarId = obj.calendarId || DEFAULT_CALENDAR_ID;
    sheetsWhitelist = (obj.sheetsWhitelist || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    dateColumns = (obj.dateColumns || '')
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => Number.isInteger(n) && n > 0);
  }
  return { calendarId, sheetsWhitelist, dateColumns };
}

function ensureConfigHeader_(sh) {
  const key = String(sh.getRange(1, 1).getValue() || '').trim();
  const value = String(sh.getRange(1, 2).getValue() || '').trim();
  if (key !== 'key' || value !== 'value') {
    sh.getRange(1, 1, 1, 2).setValues([['key', 'value']]);
  }
}

function setConfigValue_(sh, key, value, overwrite) {
  const lastRow = sh.getLastRow();
  const dataRowCount = Math.max(lastRow - 1, 0);
  if (dataRowCount) {
    const values = sh.getRange(2, 1, dataRowCount, 2).getValues();
    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0] || '').trim() === key) {
        const cell = sh.getRange(i + 2, 2);
        const currentValue = String(cell.getValue() ?? '').trim();
        if (overwrite || !currentValue) cell.setValue(value);
        return;
      }
    }
  }
  sh.getRange(lastRow + 1, 1, 1, 2).setValues([[key, value]]);
}

function isSheetAllowed(name, whitelist) {
  return !whitelist.length || whitelist.includes(name);
}

function upsertNote(range, plainNote) {
  if (plainNote && plainNote.length) {
    range.setNote(`${NOTE_PREFIX} ${plainNote}`);
  } else {
    const old = range.getNote() || '';
    if (old.startsWith(NOTE_PREFIX)) range.setNote('');
  }
}

function coerceToDate(v) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  }
  if (typeof v === 'number') {
    const d = new Date(BASE_EPOCH.getTime() + v * 86400000);
    if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (typeof v === 'string') {
    const s = v.trim();
    const patterns = [
      [/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, (d, m, y) => new Date(y, m - 1, d)],
      [/^(\d{1,2})\.(\d{1,2})$/, (d, m) => new Date((new Date()).getFullYear(), m - 1, d)],
      [/^(\d{4})-(\d{2})-(\d{2})$/, (y, m, d) => new Date(y, m - 1, d)],
      [/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, (d, m, y) => new Date(y, m - 1, d)],
      [/^(\d{1,2})\/(\d{1,2})$/, (d, m) => new Date((new Date()).getFullYear(), m - 1, d)]
    ];
    for (const [re, ctor] of patterns) {
      const m = s.match(re);
      if (m) {
        const parts = m.slice(1).map(x => parseInt(x, 10));
        const d = ctor(...parts);
        if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }
  }
  return null;
}

function buildNote(events, day) {
  if (!events || !events.length) return '';
  const fmt = d => Utilities.formatDate(d, TZ, 'HH:mm');
  const lines = events
    .sort((a, b) => a.getStartTime() - b.getStartTime())
    .map(ev => {
      const allDay = ev.isAllDayEvent && ev.isAllDayEvent();
      const time = allDay ? 'Весь день' : `${fmt(ev.getStartTime())}–${fmt(ev.getEndTime())}`;
      return `${time} — ${ev.getTitle()}`;
    });
  return Utilities.formatDate(day, TZ, 'yyyy-MM-dd') + '\n' + lines.join('\n');
}
