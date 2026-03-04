function getOrCreateSheet(sheetName, headers = []) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers.length) sheet.appendRow(headers);
  }
  return sheet;
}

function requireSheet_(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Не знайдено аркуш "${sheetName}".`);
  }
  return sheet;
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

function logError(fnName, error) {
  console.error(`Error in ${fnName}: ${error}`);
}

function getBoardIdFromRow_(sheetName, rowValues) {
  if (!rowValues) return '';
  if (sheetName === SHEET_LASAR) {
    const series = String(rowValues[COL_LASAR_SERIES - 1] || '').trim();
    const number = String(rowValues[COL_LASAR_NUMBER - 1] || '').trim();
    return series && number ? `${series}.${number}` : '';
  }
  if (sheetName === SHEET_NEMESIS) {
    return String(rowValues[COL_NEMESIS_ID - 1] || '').trim();
  }
  return '';
}

function buildStatusHistoryLine_(data) {
  const statusLine = `Статус: ${data.status}, Дата: ${data.changeDate}, Хто: ${data.changedBy}`;
  return data.description ? `${statusLine}, Опис: ${data.description}` : statusLine;
}

function getLatestBoardStatus_(cellValue) {
  const lines = String(cellValue || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (!lines.length) return '';

  const lastLine = lines[lines.length - 1];
  const match = lastLine.match(/^Статус:\s*(.*?)(?:,\s*Дата:|$)/i);
  return match ? match[1].trim() : '';
}

function getLatestBoardStatusFromRow_(rowValues) {
  if (!Array.isArray(rowValues)) return '';
  for (let i = rowValues.length - 1; i >= 0; i--) {
    const status = getLatestBoardStatus_(rowValues[i]);
    if (status) return status;
  }
  return '';
}

function isLostBoardStatus_(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return ['втрачений', 'lost', 'збито'].includes(normalized);
}

function makeColorMatrix_(numRows, width, color) {
  return Array.from({ length: numRows }, () => new Array(width).fill(color));
}

function buildChartLogRow_(colMap, width, data, sourceSheetName, sourceRowValues, email) {
  const row = new Array(width).fill('');
  const boardId = getBoardIdFromRow_(sourceSheetName, sourceRowValues) || 'Невизначено';

  if (colMap['Статус']) row[colMap['Статус'] - 1] = data.status;
  if (colMap['Дата зміни']) row[colMap['Дата зміни'] - 1] = data.changeDate;
  if (colMap['Хто']) row[colMap['Хто'] - 1] = data.changedBy;
  if (colMap['Опис']) row[colMap['Опис'] - 1] = data.description || '';
  if (colMap['Час']) row[colMap['Час'] - 1] = new Date();
  if (colMap['Email']) row[colMap['Email'] - 1] = email;
  if (colMap['Борт']) row[colMap['Борт'] - 1] = boardId;

  return row;
}

/**
 * Перевіряє наявність колонок і повертає мапу { 'Назва': індекс_колонки }
 * Додає відсутні колонки в кінець першого рядка.
 */
function ensureColumns_(sheet, names) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  // Читається тільки перший рядок
  let headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let updated = false;

  names.forEach(n => {
    if (!headers.includes(n)) {
      headers.push(n);
      updated = true;
    }
  });

  if (updated) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  // Повертається мапа { "Статус": 1, "Дата": 2 ... }
  return headers.reduce((m, name, i) => { m[name] = i + 1; return m; }, {});
}
