/** ===========================
 *  Fairness Metrics
 *  =========================== */

const NIGHT_CODES = ['н', 'рн', 'Н'];

function updateFairnessMetrics() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getActiveSheet();

    const lastCol = sh.getLastColumn();
    const lastRow = sh.getLastRow();
    if (lastRow < 2 || lastCol < CONFIG.dateStartColumn) {
      toast('Немає даних для метрик');
      return;
    }

    const dateVals = sh.getRange(CONFIG.dateRow, CONFIG.dateStartColumn, 1, lastCol - CONFIG.dateStartColumn + 1).getValues()[0];
    const dates = dateVals.map(parseDate).filter(Boolean);
    if (!dates.length) {
      toast('У рядку дат немає валідних дат');
      return;
    }

    const holidaySet = new Set();
    try {
      const rng = ss.getRangeByName('HOLIDAYS');
      if (rng) {
        rng.getValues().flat().forEach(v => {
          const d = parseDate(v);
          if (d) holidaySet.add(d.toDateString());
        });
      }
    } catch (e) {
      Logger.log('updateFairnessMetrics skipped HOLIDAYS range: ' + e.message);
    }

    const grid = sh.getRange(2, CONFIG.dateStartColumn, lastRow - 1, lastCol - CONFIG.dateStartColumn + 1).getValues();
    const people = sh.getRange(2, 1, lastRow - 1, 1).getValues().map(r => (r[0] || '').toString().trim());

    const rowsOut = [['ПІБ', 'Змін (місяць)', 'Нічних (місяць)', 'Вихідних (місяць)', 'Послідовних днів (макс)', 'Індекс дисбалансу']];
    const totals = [];

    for (let i = 0; i < people.length; i++) {
      const name = people[i];
      if (!name) continue;

      let shifts = 0;
      let nights = 0;
      let weekends = 0;
      let streak = 0;
      let maxStreak = 0;

      for (let d = 0; d < dates.length; d++) {
        const cell = (grid[i] || [])[d] || '';
        const hasShift = String(cell).trim() !== '';
        const date = dates[d];
        const isWeekend = (date.getDay() === 0 || date.getDay() === 6) || holidaySet.has(date.toDateString());

        if (hasShift) {
          shifts++;
          const code = String(cell).toLowerCase();
          if (NIGHT_CODES.some(nc => code.includes(nc))) nights++;
          if (isWeekend) weekends++;
          streak++;
          if (streak > maxStreak) maxStreak = streak;
        } else {
          streak = 0;
        }
      }

      totals.push(shifts);
      rowsOut.push([name, shifts, nights, weekends, maxStreak, '']);
    }

    const mean = totals.length ? (totals.reduce((a, b) => a + b, 0) / totals.length) : 0;
    const variance = totals.length ? (totals.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / totals.length) : 0;
    const stdev = Math.sqrt(variance);
    const spread = totals.length ? (Math.max(...totals) - Math.min(...totals)) : 0;
    rowsOut.splice(1, 0, ['— Глобальні метрики —', 'Середнє', 'Стд. відхил.', 'Розкид (max-min)', '', '']);
    rowsOut.splice(2, 0, ['', mean, stdev, spread, '', '']);

    const ms = ss.getSheetByName('Metrics') || ss.insertSheet('Metrics');
    ms.clear();
    ms.getRange(1, 1, rowsOut.length, rowsOut[0].length).setValues(rowsOut);
    ms.setFrozenRows(3);
    ms.autoResizeColumns(1, rowsOut[0].length);
    toast('Метрики оновлено (аркуш "Metrics")');
  } catch (e) {
    sendErrorNotification(e, 'updateFairnessMetrics');
  }
}