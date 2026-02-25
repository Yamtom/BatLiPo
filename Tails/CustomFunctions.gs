/** ===========================
 *  Custom Functions
 *  =========================== */

/**
 * =COUNTBYCOLOR(dataRange, refCellOrList)
 * dataRange: A1 або діапазон
 * refCellOrList: одна адреса ("C3") або масив адрес { "C3","E3","G3" } / діапазон
 */
function COUNTBYCOLOR(dataRange, refCellOrList) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  // Нормалізація dataRange
  let range;
  if (typeof dataRange === 'string') {
    range = sheet.getRange(dataRange);
  } else if (dataRange && typeof dataRange.getBackgrounds === 'function') {
    range = dataRange;
  } else {
    throw new Error('COUNTBYCOLOR: invalid dataRange, must be range or string');
  }

  // Нормалізація refCellOrList -> множина кольорів
  let addrs = [];
  if (Array.isArray(refCellOrList)) {
    addrs = refCellOrList.flat().filter(Boolean);
  } else {
    addrs = [refCellOrList];
  }

  const colors = new Set();
  addrs.forEach(a => {
    if (typeof a === 'string') {
      colors.add(sheet.getRange(a).getBackground());
    } else if (a && typeof a.getBackground === 'function') {
      colors.add(a.getBackground());
    }
  });

  const bg = range.getBackgrounds();
  let count = 0;
  for (let r = 0; r < bg.length; r++) {
    for (let c = 0; c < bg[r].length; c++) {
      if (colors.has(bg[r][c])) count++;
    }
  }
  return count;
}
