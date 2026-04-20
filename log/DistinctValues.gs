function getDistinctFromColumn_(sh, colIndex, startRow) {
  const lastRow = sh.getLastRow();
  if (lastRow < startRow) return [];

  const vals = sh.getRange(startRow, colIndex, lastRow - startRow + 1, 1).getValues();
  const unique = new Set();
  vals.forEach(row => {
    const v = String(row[0]).trim();
    if (v) unique.add(v);
  });
  return Array.from(unique).sort();
}

function getDistinctAmmoTypes_(sh) {
  const lastRow = sh.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return [];

  const cols = [CONFIG.COLS.AMMO_OUTER, CONFIG.COLS.AMMO_INNER];
  const set = new Set();

  cols.forEach(col => {
    const vals = sh.getRange(CONFIG.DATA_START_ROW, col, lastRow - CONFIG.DATA_START_ROW + 1, 1).getValues();
    vals.forEach(row => {
      const raw = String(row[0]).trim();
      if (!raw) return;
      raw.split(/[+,/]/).forEach(part => {
        const v = part.trim();
        if (v) set.add(v);
      });
    });
  });

  return Array.from(set).sort();
}

function getLastDataRowByColumn_(sh, colIndex, startRow) {
  const lastRow = sh.getLastRow();
  if (lastRow < startRow) return startRow - 1;

  const numRows = lastRow - startRow + 1;
  const vals = sh.getRange(startRow, colIndex, numRows, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]).trim() !== '') return startRow + i;
  }
  return startRow - 1;
}