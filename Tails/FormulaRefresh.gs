function refreshColorCountsActiveSheet(sheet = SpreadsheetApp.getActiveSheet()) {
  const range = sheet.getDataRange();
  const formulas = range.getFormulas();

  for (let i = 0; i < formulas.length; i++) {
    for (let j = 0; j < formulas[i].length; j++) {
      if (formulas[i][j].toLowerCase().includes('countcellsbycolor')) {
        const cell = range.getCell(i + 1, j + 1);
        cell.setFormula(cell.getFormula());
      }
    }
  }
  SpreadsheetApp.flush();
}

function refreshAll() {
  try {
    colorCells();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    CONFIG.sheetNames.forEach(name => {
      const sh = ss.getSheetByName(name);
      if (!sh) return;
      refreshColorCountsActiveSheet(sh);
    });

    toast('Оновлено: кольори + підрахунки');
  } catch (e) {
    sendErrorNotification(e, 'refreshAll');
  }
}

function refreshCells(matchStr, fullRefresh = false, sheet = SpreadsheetApp.getActiveSheet(), useCache = true) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(500)) {
    return;
  }

  try {
    const cells = getCellsWithFormula(matchStr, sheet, useCache);
    if (!cells.length) return;

    const a1List = cells.map(c => sheet.getRange(c.row, c.col).getA1Notation());
    const formulas = cells.map(c => c.formula);

    sheet.getRangeList(a1List).clearContent();
    if (fullRefresh) SpreadsheetApp.flush();

    const chunk = 100;
    for (let i = 0; i < cells.length; i += chunk) {
      const slice = cells.slice(i, i + chunk);
      const fSlice = formulas.slice(i, i + chunk);
      slice.forEach((c, k) => sheet.getRange(c.row, c.col).setFormula(fSlice[k]));
      SpreadsheetApp.flush();
    }
  } catch (e) {
    sendErrorNotification(e, 'refreshCells');
  } finally {
    lock.releaseLock();
  }
}