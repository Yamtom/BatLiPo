function onEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== CONFIG.SHEET_DATA) return;

  const rowStart = e.range.getRow();
  if (rowStart < CONFIG.DATA_START_ROW) return;

  const numRows = e.range.getNumRows();
  const numCols = e.range.getNumColumns();
  const colStart = e.range.getColumn();

  const relevantCols = [
    CONFIG.COLS.DATE,
    CONFIG.COLS.TAKEOFF,
    CONFIG.COLS.LANDING,
    CONFIG.COLS.EW_ACTION,
    CONFIG.COLS.INTEGRITY
  ];

  const isRelevant = relevantCols.some(c => c >= colStart && c <= colStart + numCols - 1);
  if (!isRelevant) return;

  for (let r = 0; r < numRows; r++) {
    const row = rowStart + r;
    let needsDuration = false;

    if (colStart <= CONFIG.COLS.DATE && (colStart + numCols - 1) >= CONFIG.COLS.DATE) {
      const cell = sh.getRange(row, CONFIG.COLS.DATE);
      const val = cell.getValue();
      if (val) {
        const norm = normalizeDateValue_(val);
        if (String(val) !== String(norm) || (typeof val === 'string' && norm instanceof Date)) {
          cell.setValue(norm).setNumberFormat(CONFIG.DATE_FORMAT);
        }
      }
    }

    if ((colStart <= CONFIG.COLS.TAKEOFF && (colStart + numCols - 1) >= CONFIG.COLS.TAKEOFF) ||
        (colStart <= CONFIG.COLS.LANDING && (colStart + numCols - 1) >= CONFIG.COLS.LANDING)) {

      [CONFIG.COLS.TAKEOFF, CONFIG.COLS.LANDING].forEach(c => {
        if (c >= colStart && c <= colStart + numCols - 1) {
          const cell = sh.getRange(row, c);
          const val = cell.getValue();
          if (val) {
            const norm = normalizeTime(val);
            if (String(val) !== String(norm)) {
              cell.setValue(norm).setNumberFormat(CONFIG.TIME_FORMAT);
            }
          }
        }
      });
      needsDuration = true;
    }

    if ((colStart <= CONFIG.COLS.EW_ACTION && (colStart + numCols - 1) >= CONFIG.COLS.EW_ACTION) ||
        (colStart <= CONFIG.COLS.INTEGRITY && (colStart + numCols - 1) >= CONFIG.COLS.INTEGRITY)) {
      needsDuration = true;
    }

    if (needsDuration) {
      updateDurationAndRiskForRow_(sh, row);
    }
  }
}

function updateDurationAndRiskForRow_(sh, row) {
  const takeoff = sh.getRange(row, CONFIG.COLS.TAKEOFF).getValue();
  const landing = sh.getRange(row, CONFIG.COLS.LANDING).getValue();
  const integrity = sh.getRange(row, CONFIG.COLS.INTEGRITY).getValue();
  const ew = sh.getRange(row, CONFIG.COLS.EW_ACTION).getValue();
  const riskCol = getRiskColumnForSheet_(sh);

  const ms = computeDurationMs(takeoff, landing);
  const isRisk = calculateRiskFactor(integrity, ew, ms);
  sh.getRange(row, riskCol).setValue(isRisk);
}

function recalcAllDates_(sh, startRow, numRows) {
  const range = sh.getRange(startRow, CONFIG.COLS.DATE, numRows, 1);
  const vals = range.getValues();
  let changed = false;

  for (let i = 0; i < numRows; i++) {
    const v = vals[i][0];
    const norm = normalizeDateValue_(v);

    let isDifferent = false;
    if (v instanceof Date && norm instanceof Date) {
      if (v.getTime() !== norm.getTime()) isDifferent = true;
    } else if (typeof v === 'string' && norm instanceof Date) {
      isDifferent = true;
    } else if (v !== norm) {
      isDifferent = true;
    }

    if (isDifferent) {
      vals[i][0] = norm;
      changed = true;
    }
  }

  if (changed) {
    range.setValues(vals);
    range.setNumberFormat(CONFIG.DATE_FORMAT);
    SpreadsheetApp.flush();
  }
}

function recalcAllDurations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.SHEET_DATA);
  if (!sh) { ss.toast('Аркуш даних не знайдено'); return; }

  const lastRow = sh.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) { ss.toast('Дані відсутні'); return; }

  const sel = sh.getActiveRange();
  let startRow = CONFIG.DATA_START_ROW;
  let endRow = lastRow;

  if (sel) {
    const selFirst = sel.getRow();
    const selLast = sel.getLastRow();
    if (selLast >= CONFIG.DATA_START_ROW && selFirst <= lastRow) {
      startRow = Math.max(selFirst, CONFIG.DATA_START_ROW);
      endRow = Math.min(selLast, lastRow);
    }
  }

  const numRows = endRow - startRow + 1;
  if (numRows <= 0) {
    ss.toast('Немає рядків для перерахунку');
    return;
  }

  recalcAllDates_(sh, startRow, numRows);

  const riskColumn = getRiskColumnForSheet_(sh);
  const lastCol = Math.max(sh.getLastColumn(), CONFIG.COLS.NOTES, riskColumn);
  const range = sh.getRange(startRow, 1, numRows, lastCol);
  const values = range.getValues();
  const riskValues = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const takeoff = row[CONFIG.COLS.TAKEOFF - 1];
    const landing = row[CONFIG.COLS.LANDING - 1];
    const integrity = row[CONFIG.COLS.INTEGRITY - 1];
    const ew = row[CONFIG.COLS.EW_ACTION - 1];

    const ms = computeDurationMs(takeoff, landing);
    const isRisk = calculateRiskFactor(integrity, ew, ms);
    riskValues.push([isRisk]);
  }

  sh.getRange(startRow, riskColumn, numRows, 1).setValues(riskValues);

  ss.toast('✅ Перераховано ризики для рядків ' + startRow + '–' + endRow + '.');
}

function getRiskColumnForSheet_(sh) {
  const lastCol = sh.getLastColumn();
  const headerRows = Math.max(1, CONFIG.DATA_START_ROW - 1);
  const headers = sh.getRange(1, 1, headerRows, lastCol).getDisplayValues();

  for (let r = 0; r < headers.length; r++) {
    for (let c = 0; c < headers[r].length; c++) {
      const value = String(headers[r][c] || '').trim().toLowerCase();
      if (value.includes('risk') || value.includes('ризик')) {
        return c + 1;
      }
    }
  }

  return CONFIG.COLS.RISK;
}