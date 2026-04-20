/** ===========================
 *  Formula search
 *  =========================== */

function getCellsWithFormula(matchStr, sheet = SpreadsheetApp.getActiveSheet(), useCache = true) {
  const cacheKey = sheet.getSheetId() + ':formula:v1:' + matchStr;
  const cache = useCache ? CacheService.getScriptCache() : null;
  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached) return JSON.parse(cached);
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (!lastRow || !lastCol) return [];

  const formulas = sheet.getRange(1, 1, lastRow, lastCol).getFormulas();
  const result = [];
  formulas.forEach((row, rowIdx) => {
    row.forEach((formula, colIdx) => {
      if (formula && formula.includes(matchStr)) {
        result.push({ row: rowIdx + 1, col: colIdx + 1, formula });
      }
    });
  });

  if (useCache && result.length) {
    cache.put(cacheKey, JSON.stringify(result), 600);
  }
  return result;
}