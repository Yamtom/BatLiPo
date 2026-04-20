function runSliceWithFilters(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.SHEET_DATA);
  if (!sh) throw new Error('Аркуш "' + CONFIG.SHEET_DATA + '" не знайдено');

  const start = new Date(params.startISO + 'T00:00:00');
  const end = new Date(params.endISO + 'T23:59:59');

  const selPilot = String(params.pilot || '').trim();
  const selNav = String(params.navigator || '').trim();
  const selBoard = String(params.board || '').trim();

  const lastRow = sh.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) throw new Error('Дані відсутні');

  const vals = sh.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, sh.getLastColumn()).getValues();
  const headerVals = sh.getRange(1, 1, CONFIG.DATA_START_ROW - 1, sh.getLastColumn()).getValues();
  const riskCol = getRiskColumnForSheet_(sh);

  const out = [];
  let totalHits = 0;
  let totalDurationMs = 0;
  let riskCount = 0;

  for (let i = 0; i < vals.length; i++) {
    const row = vals[i];
    const rowDate = row[CONFIG.COLS.DATE - 1];
    const dt = rowDate instanceof Date ? rowDate : normalizeDateValue_(rowDate);
    if (!(dt instanceof Date) || isNaN(dt.getTime()) || dt < start || dt > end) continue;

    if (selPilot && String(row[CONFIG.COLS.PILOT - 1]).trim() !== selPilot) continue;
    if (selNav && String(row[CONFIG.COLS.NAVIGATOR - 1]).trim() !== selNav) continue;
    if (selBoard && String(row[CONFIG.COLS.BOARD - 1]).trim() !== selBoard) continue;

    out.push(row);

    const hits = Number(row[CONFIG.COLS.HIT_COUNT - 1]) || 0;
    totalHits += hits;

    const durVal = row[CONFIG.COLS.DURATION - 1];
    if (typeof durVal === 'number' && durVal > 0) {
      totalDurationMs += durVal * 86400000;
    } else {
      const ms = computeDurationMs(
        row[CONFIG.COLS.TAKEOFF - 1],
        row[CONFIG.COLS.LANDING - 1]
      );
      if (ms) totalDurationMs += ms;
    }

    if (row[riskCol - 1] == 1) riskCount++;
  }

  const sliceName = 'Зріз ' + params.startISO + '_' + params.endISO;
  let outSh = ss.getSheetByName(sliceName);
  if (!outSh) outSh = ss.insertSheet(sliceName);
  outSh.clear();

  if (headerVals.length > 0) {
    outSh.getRange(1, 1, headerVals.length, headerVals[0].length).setValues(headerVals);
  }

  if (out.length > 0) {
    outSh.getRange(CONFIG.DATA_START_ROW, 1, out.length, out[0].length).setValues(out);

    const summaryRow = CONFIG.DATA_START_ROW + out.length + 2;
    outSh.getRange(summaryRow, 1).setValue('ПІДСУМКИ ЗРІЗУ').setFontWeight('bold');
    outSh.getRange(summaryRow + 1, 1).setValue('Всього вильотів: ' + out.length);
    outSh.getRange(summaryRow + 2, 1).setValue('Сумарний час: ' + formatDurationHuman(totalDurationMs));
    outSh.getRange(summaryRow + 3, 1).setValue('Знищено цілей: ' + totalHits);
    outSh.getRange(summaryRow + 1, 2)
      .setValue('Ризикових місій: ' + riskCount)
      .setFontColor(riskCount > 0 ? 'red' : 'green')
      .setFontWeight('bold');
  }

  return { ok: true, rows: out.length, sheet: sliceName };
}