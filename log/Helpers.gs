/** ===== ЛОГ ===== */
function logChange(action, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_LOG);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_LOG);
    sh.appendRow(['Дата/Час', 'Користувач', 'Дія', 'Значення']);
  }

  const user = Session.getEffectiveUser().getEmail() || 'Невідомий';
  const ts = Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ss");
  
  sh.appendRow([ts, user, action, String(value)]);

  const MAX_LOGS = 5000;
  const lastRow = sh.getLastRow();
  if (lastRow > MAX_LOGS + 100) {
    sh.deleteRows(2, lastRow - MAX_LOGS);
  }
}

/** ===== ДАТА/ЧАС ===== */
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
  let ms = landing - takeoff;
  if (ms < 0) ms += 24 * 3600 * 1000;
  return ms;
}

/**
 * Нормалізація дати
 */
function normalizeDateValue_(value) {
  if (!value) return '';
  if (value instanceof Date) return value;

  const s = String(value).trim();
  if (!s) return '';

  // YYYY-MM-DD
  let m = s.match(/^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

  // DD.MM.YYYY
  m = s.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed;

  return value;
}

/** Форматує мілісекунди у рядок "2год 15хв" */
function formatDurationHuman(ms) {
  if (!ms) return '0хв';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? (h + 'год ' + m + 'хв') : (m + 'хв');
}

/** ===== УНІКАЛЬНІ ЗНАЧЕННЯ ===== */
function getDistinctFromColumn_(sh, colIndex, startRow) {
  const lastRow = sh.getLastRow();
  if (lastRow < startRow) return [];
  
  const vals = sh.getRange(startRow, colIndex, lastRow - startRow + 1, 1).getValues();
  const unique = new Set();
  vals.forEach(row => {
    const v = String(row[0]).trim();
    if (v) unique.add(v);
  });
  return Array.from(unique).sort();
}

/**
 * Унікальні типи БК з зовнішніх + внутрішніх (L + M)
 */
function getDistinctAmmoTypes_(sh) {
  const lastRow = sh.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return [];

  const cols = [CONFIG.COLS.AMMO_OUTER, CONFIG.COLS.AMMO_INNER];
  const set = new Set();

  cols.forEach(col => {
    const vals = sh.getRange(CONFIG.DATA_START_ROW, col, lastRow - CONFIG.DATA_START_ROW + 1, 1).getValues();
    vals.forEach(row => {
      const raw = String(row[0]).trim();
      if (!raw) return;
      raw.split(/[+,/]/).forEach(part => {
        const v = part.trim();
        if (v) set.add(v);
      });
    });
  });

  return Array.from(set).sort();
}

/**
 * Знаходить останній НЕпорожній рядок по заданій колонці,
 * починаючи зі стартового рядка.
 */
function getLastDataRowByColumn_(sh, colIndex, startRow) {
  const lastRow = sh.getLastRow();
  if (lastRow < startRow) return startRow - 1;

  const numRows = lastRow - startRow + 1;
  const vals = sh.getRange(startRow, colIndex, numRows, 1).getValues();

  for (let i = vals.length - 1; i >= 0; i--) {
    const v = vals[i][0];
    if (String(v).trim() !== '') {
      return startRow + i;
    }
  }
  return startRow - 1;
}

/** ===== ЛОГІКА РИЗИКУ ===== */
function calculateRiskFactor(integrity, ewAction, durationMs) {
  let isRisk = false;

  // Цілісність борту
  if (CONFIG.RISK_CRITERIA.BAD_INTEGRITY.includes(String(integrity))) {
    isRisk = true;
  }

  // РЕБ: boolean або текст
  let ewFlag = false;
  if (typeof ewAction === 'boolean') {
    ewFlag = ewAction;
  } else {
    const s = String(ewAction).trim().toLowerCase();
    ewFlag = ['так', 'true', 'yes', '1'].includes(s);
  }
  if (ewFlag) isRisk = true;

  // Тривалість
  if (durationMs && (durationMs / 60000) > CONFIG.RISK_CRITERIA.MAX_DURATION_MINUTES) {
    isRisk = true;
  }

  return isRisk ? 1 : 0;
}
