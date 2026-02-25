/** ===== onEdit (дата + час + ризик) ===== */
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

    // Дата
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

    // Час
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

    // РЕБ / Цілісність
    if ((colStart <= CONFIG.COLS.EW_ACTION && (colStart + numCols - 1) >= CONFIG.COLS.EW_ACTION) ||
        (colStart <= CONFIG.COLS.INTEGRITY && (colStart + numCols - 1) >= CONFIG.COLS.INTEGRITY)) {
      needsDuration = true;
    }

    if (needsDuration) {
      updateDurationAndRiskForRow_(sh, row);
    }
  }
}

/** Оновлення тривалості і ризику для одного рядка */
/** Оновлення ризику для одного рядка (тривалість обчислюється лише для логіки) */
function updateDurationAndRiskForRow_(sh, row) {
  const takeoff   = sh.getRange(row, CONFIG.COLS.TAKEOFF).getValue();
  const landing   = sh.getRange(row, CONFIG.COLS.LANDING).getValue();
  const integrity = sh.getRange(row, CONFIG.COLS.INTEGRITY).getValue();
  const ew        = sh.getRange(row, CONFIG.COLS.EW_ACTION).getValue();

  const ms = computeDurationMs(takeoff, landing);

  // Тривалість у колонку G не пишемо; використовуємо лише для розрахунку ризику
  const isRisk = calculateRiskFactor(integrity, ew, ms);
  sh.getRange(row, CONFIG.COLS.RISK).setValue(isRisk);
}


/** Нормалізація дат у вибраному діапазоні */
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

/** Масовий перерахунок тривалості і ризиків (по всьому або по виділеному діапазону) */
/** Масовий перерахунок ризиків (RISK) для всіх / виділених рядків */
function recalcAllDurations() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.SHEET_DATA);
  if (!sh) { ss.toast('Аркуш даних не знайдено'); return; }

  const lastRow = sh.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) { ss.toast('Дані відсутні'); return; }

  const sel = sh.getActiveRange();
  let startRow = CONFIG.DATA_START_ROW;
  let endRow   = lastRow;

  if (sel) {
    const selFirst = sel.getRow();
    const selLast  = sel.getLastRow();
    if (selLast >= CONFIG.DATA_START_ROW && selFirst <= lastRow) {
      startRow = Math.max(selFirst, CONFIG.DATA_START_ROW);
      endRow   = Math.min(selLast,  lastRow);
    }
  }

  const numRows = endRow - startRow + 1;
  if (numRows <= 0) {
    ss.toast('Немає рядків для перерахунку');
    return;
  }

  // Дати нормалізуються, щоб сортування і фільтри працювали
  recalcAllDates_(sh, startRow, numRows);

  const lastCol = Math.max(...Object.values(CONFIG.COLS));
  const range = sh.getRange(startRow, 1, numRows, lastCol);
  const values = range.getValues();

  const riskCol = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const takeoff   = row[CONFIG.COLS.TAKEOFF   - 1];
    const landing   = row[CONFIG.COLS.LANDING   - 1];
    const integrity = row[CONFIG.COLS.INTEGRITY - 1];
    const ew        = row[CONFIG.COLS.EW_ACTION - 1];

    const ms = computeDurationMs(takeoffObj, landingObj);
    const isRisk = calculateRiskFactor(data.integrity, data.ewAction, ms);

    riskCol.push([riskVal]);
  }

  sh.getRange(startRow, CONFIG.COLS.RISK, numRows, 1).setValues(riskCol);

  ss.toast('✅ Перераховано ризики для рядків ' + startRow + '–' + endRow + '.');
}


/** Додавання польоту з форми */
function addFlight(data) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Сервер зайнятий. Спробуйте ще раз.');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG.SHEET_DATA);
    if (!sh) throw new Error('Аркуш "' + CONFIG.SHEET_DATA + '" не знайдено');

    const maxCol = Math.max(...Object.values(CONFIG.COLS));
    const rowData = new Array(maxCol).fill('');

    const dateObj    = normalizeDateValue_(data.dateISO);
    const takeoffObj = data.takeoffISO ? normalizeTime(data.takeoffISO) : '';
    const landingObj = data.landingISO ? normalizeTime(data.landingISO) : '';

    const ms = computeDurationMs(takeoffObj, landingObj);
    const isRisk = calculateRiskFactor(data.integrity, data.ewAction, ms);

    rowData[CONFIG.COLS.DATE      - 1] = dateObj;
    rowData[CONFIG.COLS.PILOT     - 1] = data.pilot;
    rowData[CONFIG.COLS.NAVIGATOR - 1] = data.navigator;
    rowData[CONFIG.COLS.BOARD     - 1] = data.board;
    rowData[CONFIG.COLS.TAKEOFF   - 1] = takeoffObj;
    rowData[CONFIG.COLS.LANDING   - 1] = landingObj;
    //if (ms !== null) rowData[CONFIG.COLS.DURATION - 1] = ms / 86400000;

    rowData[CONFIG.COLS.EW_ACTION  - 1] = !!data.ewAction;
    rowData[CONFIG.COLS.AREA       - 1] = data.area;
    rowData[CONFIG.COLS.HIT_COUNT  - 1] = data.hitCount ? Number(data.hitCount) : '';
    rowData[CONFIG.COLS.TARGET_TYPE- 1] = data.targetType;
    rowData[CONFIG.COLS.AMMO_OUTER - 1] = data.ammoOuter || '';
    rowData[CONFIG.COLS.AMMO_INNER - 1] = data.ammoInner || '';
    rowData[CONFIG.COLS.INTEGRITY  - 1] = data.integrity;
    rowData[CONFIG.COLS.NOTES      - 1] = data.notes;
    rowData[CONFIG.COLS.RISK       - 1] = isRisk;

    // Перший вільний рядок шукається за колонкою DATE (A)
    const lastDataRow = getLastDataRowByColumn_(sh, CONFIG.COLS.DATE, CONFIG.DATA_START_ROW);
    const targetRow = Math.max(lastDataRow + 1, CONFIG.DATA_START_ROW);

    sh.getRange(targetRow, 1, 1, maxCol).setValues([rowData]);

    sh.getRange(targetRow, CONFIG.COLS.DATE).setNumberFormat(CONFIG.DATE_FORMAT);
    sh.getRange(targetRow, CONFIG.COLS.TAKEOFF).setNumberFormat(CONFIG.TIME_FORMAT);
    sh.getRange(targetRow, CONFIG.COLS.LANDING).setNumberFormat(CONFIG.TIME_FORMAT);
    //sh.getRange(targetRow, CONFIG.COLS.DURATION).setNumberFormat('[h]:mm');

    const userProps = PropertiesService.getUserProperties();
    userProps.setProperties({
      LAST_PILOT:  data.pilot,
      LAST_NAV:    data.navigator,
      LAST_BOARD:  data.board,
      LAST_AREA:   data.area
    });

    logChange('Додано політ', 'Борт ' + data.board + ', рядок ' + targetRow);
    return { ok: true, flight_id: targetRow };

  } finally {
    lock.releaseLock();
  }
}

/** Зріз (спирається на нормалізовану дату) */
function runSliceWithFilters(params) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.SHEET_DATA);
  if (!sh) throw new Error('Аркуш "' + CONFIG.SHEET_DATA + '" не знайдено');

  const start = new Date(params.startISO + 'T00:00:00');
  const end   = new Date(params.endISO   + 'T23:59:59');
  
  const selPilot = String(params.pilot || '').trim();
  const selNav   = String(params.navigator || '').trim();
  const selBoard = String(params.board || '').trim();

  const lastRow = sh.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) throw new Error('Дані відсутні');

  const vals = sh.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, sh.getLastColumn()).getValues();
  const headerVals = sh.getRange(1, 1, CONFIG.DATA_START_ROW - 1, sh.getLastColumn()).getValues();

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
    if (selNav   && String(row[CONFIG.COLS.NAVIGATOR - 1]).trim() !== selNav) continue;
    if (selBoard && String(row[CONFIG.COLS.BOARD - 1]).trim() !== selBoard) continue;

    out.push(row);

    const hits = Number(row[CONFIG.COLS.HIT_COUNT - 1]) || 0;
    totalHits += hits;

    const durVal = row[CONFIG.COLS.DURATION - 1];
    if (typeof durVal === 'number') totalDurationMs += durVal * 86400000;

    if (row[CONFIG.COLS.RISK - 1] == 1) riskCount++;
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

/** Сортування */
function sortByDateTime() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getActiveSheet();
  if (sh.getName() !== CONFIG.SHEET_DATA) {
    ss.toast('Сортування працює тільки на аркуші "' + CONFIG.SHEET_DATA + '"');
    return;
  }

  const lastRow = sh.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return;

  // Нормалізуємо дати тільки на активному аркуші
  recalcAllDates_(sh, CONFIG.DATA_START_ROW, lastRow - CONFIG.DATA_START_ROW + 1);

  const range = sh.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, sh.getLastColumn());
  range.sort([
    { column: CONFIG.COLS.DATE, ascending: true },
    { column: CONFIG.COLS.TAKEOFF, ascending: true }
  ]);

  ss.toast('✅ Відсортовано за датою і часом');
}

/** Перехід до останнього логічного рядка (по колонці A/DATE) */
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
