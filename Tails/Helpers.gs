/** ===========================
 *  Helpers
 *  =========================== */

// Дебаунс на базі ScriptProperties
function shouldRunDebounced(key, ms) {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const last = Number(props.getProperty(key) || 0);
  if (now - last < ms) return false;
  props.setProperty(key, String(now));
  return true;
}

// Пошук формул з кешем
function getCellsWithFormula(matchStr, sheet = SpreadsheetApp.getActiveSheet(), useCache = true) {
  const cacheKey = sheet.getSheetId() + ':formula:v1:' + matchStr;
  if (useCache) {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (!lastRow || !lastCol) return [];

  const formulas = sheet.getRange(1, 1, lastRow, lastCol).getFormulas();
  const result = [];
  for (let r = 0; r < formulas.length; r++) {
    for (let c = 0; c < formulas[r].length; c++) {
      const f = formulas[r][c];
      if (f && f.includes(matchStr)) result.push({ row: r + 1, col: c + 1, formula: f });
    }
  }

  if (useCache && result.length) {
    CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), 600); // 10 хв
  }
  return result;
}

// Надійний парсинг дат (dd.mm(.yyyy) тощо) з нормалізацією до півночі
function parseDate(cellValue) {
  try {
    if (!cellValue) return null;

    if (cellValue instanceof Date && !isNaN(cellValue)) {
      return new Date(cellValue.getFullYear(), cellValue.getMonth(), cellValue.getDate());
    }

    if (typeof cellValue === 'string') {
      const s = cellValue.trim();
      const m = s.match(/^(\d{1,2})[.\-\/](\d{1,2})(?:[.\-\/](\d{2,4}))?$/);
      if (!m) return null;
      let [, dd, mm, yy] = m;
      const now = new Date();
      const year = yy ? (yy.length < 3 ? Number(yy) + 2000 : Number(yy)) : now.getFullYear();
      const d = new Date(year, Number(mm) - 1, Number(dd));
      if (isNaN(d)) return null;
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    return null;
  } catch (err) {
    sendErrorNotification(err, 'parseDate');
    return null;
  }
}

function sendErrorNotification(err, name) {
  const email = CONFIG.errorNotificationEmail;
  const subject = 'Помилка в скрипті' + (name ? ' - ' + name : '');
  const body = 'Function: ' + (name || 'unknown') + '\nMsg: ' + err.message + '\nStack: ' + err.stack + '\nObj: ' + JSON.stringify(err, Object.getOwnPropertyNames(err));
  Logger.log(body);
  if (email) MailApp.sendEmail(email, subject, body);
}

function toast(msg, sec) {
  SpreadsheetApp.getActive().toast(msg, 'Інфо', sec || 3);
}
