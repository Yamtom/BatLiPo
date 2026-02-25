function getOrCreateSheet(sheetName, headers = []) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (headers.length) sheet.appendRow(headers);
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