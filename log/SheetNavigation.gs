function sortByDateTime() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getActiveSheet();
  if (sh.getName() !== CONFIG.SHEET_DATA) {
    ss.toast('Сортування працює тільки на аркуші "' + CONFIG.SHEET_DATA + '"');
    return;
  }

  const lastRow = sh.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return;

  recalcAllDates_(sh, CONFIG.DATA_START_ROW, lastRow - CONFIG.DATA_START_ROW + 1);

  const range = sh.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, sh.getLastColumn());
  range.sort([
    { column: CONFIG.COLS.DATE, ascending: true },
    { column: CONFIG.COLS.TAKEOFF, ascending: true }
  ]);

  ss.toast('✅ Відсортовано за датою і часом');
}

function goToLastRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.SHEET_DATA);
  if (!sh) return;

  const lastDataRow = getLastDataRowByColumn_(sh, CONFIG.COLS.DATE, CONFIG.DATA_START_ROW);
  const targetRow = Math.max(lastDataRow + 1, CONFIG.DATA_START_ROW);

  sh.activate();
  const range = sh.getRange(targetRow, CONFIG.COLS.DATE);
  sh.setActiveRange(range);
  SpreadsheetApp.flush();
}