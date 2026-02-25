/** Оновлення кольорів і формул */

// Оновлення формул підрахунку кольорів на одному листі
function refreshColorCountsActiveSheet( ) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getDataRange();
  // Усі формули на аркуші отримуються
  const formulas = range.getFormulas();
  
  // Проходимося по кожній клітинці
  for (let i = 0; i < formulas.length; i++) {
    for (let j = 0; j < formulas[i].length; j++) {
      // Якщо є формула countCellsByColor — "перевстановлюємо" її
      if (formulas[i][j].toLowerCase().includes('countcellsbycolor')) {
        const cell = range.getCell(i + 1, j + 1);
        cell.setFormula(cell.getFormula());
      }
    }
  }
  // Усі зміни застосовуються
  SpreadsheetApp.flush();
}

// Повне оновлення: кольори заголовків і формули підрахунку
function refreshAll() {
  try {
    // 1) Фарбування заголовків по всіх аркушах (сьогодні/минуле/майбутнє)
    colorHeadersAll();

    // 2) Один прохід по всіх аркушах — оновлення формул підрахунку кольорів
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

/** Службова функція: оновлює формули за ключем matchStr */
function refreshCells(matchStr, fullRefresh = false, sheet = SpreadsheetApp.getActiveSheet(), useCache = true) {
  const lock = LockService.getScriptLock();
  lock.tryLock(500);
  try {
    const cells = getCellsWithFormula(matchStr, sheet, useCache);
    if (!cells.length) return;

    const a1List = cells.map(c => sheet.getRange(c.row, c.col).getA1Notation());
    const formulas = cells.map(c => c.formula);

    sheet.getRangeList(a1List).clearContent();
    if (fullRefresh) SpreadsheetApp.flush();

    // Відновлюємо батчами (стабільність проти лімітів)
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
    try { lock.releaseLock(); } catch(_) {}
  }
}
