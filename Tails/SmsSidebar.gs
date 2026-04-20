/** ===========================
 *  SMS Generator (Sidebar)
 *  =========================== */

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Генератор SMS-повідомлень');
  SpreadsheetApp.getUi().showSidebar(html);
}

function getHeaders() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const lastCol = sheet.getLastColumn();
  return lastCol ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
}

function hasValue(row, idx) {
  const v = row[idx];
  return v != null && String(v).trim() !== '';
}

function formatRow(row, nextRowHasA) {
  const parts = [];
  if (hasValue(row, 0)) parts.push(`*${row[0]}:\n`); else parts.push(`${row[0] || ''}`);
  if (hasValue(row, 1)) parts.push(`${row[1]}`);
  if (hasValue(row, 2)) parts.push(` - ${row[2]}`);
  if (hasValue(row, 3)) parts.push(` - ${row[3]}`);
  if (hasValue(row, 4)) parts.push(` - ${row[4]}`);
  if (hasValue(row, 5)) parts.push(`, ${row[5]}`);
  if (hasValue(row, 6)) parts.push(` - ${row[6]}`);
  if (hasValue(row, 7)) parts.push(` - початок ${row[7]}`);
  if (hasValue(row, 8)) parts.push(` - ${row[8]}`);
  return parts.join('') + (nextRowHasA ? ';\n' : ';');
}

function findLastRowInColumnA(sheet) {
  const valuesA = sheet.getRange('A:A').getValues();
  for (let i = valuesA.length - 1; i >= 0; i--) {
    if (valuesA[i][0] && String(valuesA[i][0]).trim() !== '') return i + 1;
  }
  return 0;
}

function generateMessage(params) {
  const sheet = SpreadsheetApp.getActiveSheet();
  let lastRow = sheet.getLastRow();
  if (!sheet.getRange(lastRow || 1, 1).getValue()) lastRow = findLastRowInColumnA(sheet);
  if (lastRow < 2) return 'У стовпці A немає даних для обробки.';

  const selectedColumns = (params && Array.isArray(params.selectedColumns))
    ? params.selectedColumns
        .map(n => Number(n))
        .filter(n => Number.isInteger(n) && n >= 0)
    : [];
  const selectedSet = new Set(selectedColumns);

  const numRows = lastRow - 1;
  const dataRange = sheet.getRange(2, 1, numRows, Math.max(17, sheet.getLastColumn()));
  const dataValues = dataRange.getValues();

  let smsText = 'Застосування на сьогодні:\n';
  for (let i = 0; i < dataValues.length; i++) {
    const srcRow = dataValues[i];
    const row = selectedSet.size
      ? srcRow.map((v, idx) => (selectedSet.has(idx) ? v : ''))
      : srcRow;

    const nextRowHasA = (i + 1 < dataValues.length)
      ? (() => {
          const n = selectedSet.size
            ? (selectedSet.has(0) ? dataValues[i + 1][0] : '')
            : dataValues[i + 1][0];
          return n && String(n).trim() !== '';
        })()
      : false;

    smsText += formatRow(row, nextRowHasA) + '\n';
  }
  return smsText;
}

function sendEmail(message, emailAddress) {
  try {
    const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    const stamp = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm');
    MailApp.sendEmail(emailAddress, 'SMS-повідомлення — ' + stamp, message);
    return 'Лист надіслано на ' + emailAddress;
  } catch (e) {
    return 'Помилка відправлення: ' + e.toString();
  }
}