/** ===========================
 *  Schedule header coloring
 *  =========================== */

function colorCells() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    CONFIG.sheetNames.forEach(name => {
      const sh = ss.getSheetByName(name);
      if (sh) colorHeadersForSheet(sh);
    });
  } catch (e) {
    sendErrorNotification(e, 'colorCells');
  }
}

function colorHeadersForSheet(sheet) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCol = sheet.getLastColumn();
  if (lastCol < CONFIG.dateStartColumn) return;

  const dateRange = sheet.getRange(
    CONFIG.dateRow, CONFIG.dateStartColumn,
    1, lastCol - CONFIG.dateStartColumn + 1
  );
  const headerRange = sheet.getRange(
    CONFIG.headerRow, CONFIG.dateStartColumn,
    1, lastCol - CONFIG.dateStartColumn + 1
  );

  const values = dateRange.getValues()[0];
  const tt = today.getTime();
  const bg = values.map(v => {
    const d = parseDate(v);
    if (!d) return 'white';
    const t = d.getTime();
    return t === tt ? 'red' : (t < tt ? 'green' : 'white');
  });

  headerRange.setBackgrounds([bg]);
}