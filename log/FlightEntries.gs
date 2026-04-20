function addFlight(data) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('Сервер зайнятий. Спробуйте ще раз.');

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(CONFIG.SHEET_DATA);
    if (!sh) throw new Error('Аркуш "' + CONFIG.SHEET_DATA + '" не знайдено');

    const riskCol = getRiskColumnForSheet_(sh);
    const rowWidth = Math.max(sh.getLastColumn(), riskCol, CONFIG.COLS.NOTES);
    const rowData = new Array(rowWidth).fill('');

    const dateObj = normalizeDateValue_(data.dateISO);
    const takeoffObj = data.takeoffISO ? normalizeTime(data.takeoffISO) : '';
    const landingObj = data.landingISO ? normalizeTime(data.landingISO) : '';

    const ms = computeDurationMs(takeoffObj, landingObj);
    const isRisk = calculateRiskFactor(data.integrity, data.ewAction, ms);

    rowData[CONFIG.COLS.DATE - 1] = dateObj;
    rowData[CONFIG.COLS.PILOT - 1] = data.pilot;
    rowData[CONFIG.COLS.NAVIGATOR - 1] = data.navigator;
    rowData[CONFIG.COLS.BOARD - 1] = data.board;
    rowData[CONFIG.COLS.TAKEOFF - 1] = takeoffObj;
    rowData[CONFIG.COLS.LANDING - 1] = landingObj;
    rowData[CONFIG.COLS.EW_ACTION - 1] = !!data.ewAction;
    rowData[CONFIG.COLS.AREA - 1] = data.area;
    rowData[CONFIG.COLS.HIT_COUNT - 1] = toOptionalNumber_(data.hitCount);
    rowData[CONFIG.COLS.TARGET_TYPE - 1] = data.targetType;
    rowData[CONFIG.COLS.AMMO_OUTER - 1] = data.ammoOuter || '';
    rowData[CONFIG.COLS.AMMO_INNER - 1] = data.ammoInner || '';
    rowData[CONFIG.COLS.INTEGRITY - 1] = data.integrity;
    rowData[CONFIG.COLS.NOTES - 1] = data.notes;
    rowData[riskCol - 1] = isRisk;

    const lastDataRow = getLastDataRowByColumn_(sh, CONFIG.COLS.DATE, CONFIG.DATA_START_ROW);
    const targetRow = Math.max(lastDataRow + 1, CONFIG.DATA_START_ROW);

    sh.getRange(targetRow, 1, 1, rowWidth).setValues([rowData]);

    sh.getRange(targetRow, CONFIG.COLS.DATE).setNumberFormat(CONFIG.DATE_FORMAT);
    sh.getRange(targetRow, CONFIG.COLS.TAKEOFF).setNumberFormat(CONFIG.TIME_FORMAT);
    sh.getRange(targetRow, CONFIG.COLS.LANDING).setNumberFormat(CONFIG.TIME_FORMAT);

    const userProps = PropertiesService.getUserProperties();
    userProps.setProperties({
      LAST_PILOT: data.pilot,
      LAST_NAV: data.navigator,
      LAST_BOARD: data.board,
      LAST_AREA: data.area
    });

    logChange('Додано політ', 'Борт ' + data.board + ', рядок ' + targetRow);
    return { ok: true, flight_id: targetRow };

  } finally {
    lock.releaseLock();
  }
}

function toOptionalNumber_(value) {
  if (value === '' || value == null) return '';
  const num = Number(value);
  return Number.isFinite(num) ? num : '';
}