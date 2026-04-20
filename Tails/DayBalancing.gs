/** ===========================
 *  Auto-balance for a day
 *  =========================== */

function autoBalanceDay() {
  const ui = SpreadsheetApp.getUi();
  const sh = SpreadsheetApp.getActiveSheet();
  const lastCol = sh.getLastColumn();
  const lastRow = sh.getLastRow();

  const active = sh.getActiveCell();
  if (!active) { ui.alert('Обери клітинку в колонці потрібного дня.'); return; }
  const dayCol = active.getColumn();
  if (dayCol < CONFIG.dateStartColumn || dayCol > lastCol) {
    ui.alert('Обери клітинку в діапазоні дат (починаючи з колонки ' + CONFIG.dateStartColumn + ').');
    return;
  }

  const codeResp = ui.prompt('Код для розстановки', 'Введи код зміни (наприклад: р, ш, н, рн…)', ui.ButtonSet.OK_CANCEL);
  if (codeResp.getSelectedButton() !== ui.Button.OK) return;
  const CODE = (codeResp.getResponseText() || '').trim();
  if (!CODE) { ui.alert('Код порожній.'); return; }

  const nResp = ui.prompt('Скільки людей поставити?', 'Введи число N (скільки порожніх місць заповнити)', ui.ButtonSet.OK_CANCEL);
  if (nResp.getSelectedButton() !== ui.Button.OK) return;
  const N = Math.max(0, Number(nResp.getResponseText() || '0'));
  if (!N) { ui.alert('N має бути > 0.'); return; }

  const people = sh.getRange(2, 1, lastRow - 1, 1).getValues().map(r => (r[0] || '').toString().trim());
  const dataMonth = sh.getRange(2, CONFIG.dateStartColumn, lastRow - 1, lastCol - CONFIG.dateStartColumn + 1).getValues();

  const colIndex = dayCol - CONFIG.dateStartColumn;
  const dayDate = parseDate(sh.getRange(CONFIG.dateRow, dayCol).getValue());

  const loads = people.map((name, i) => {
    if (!name) return { i, name, shifts: 0 };
    let cnt = 0;
    for (let d = 0; d < dataMonth[i].length; d++) {
      if (String(dataMonth[i][d] || '').trim() !== '') cnt++;
    }
    return { i, name, shifts: cnt };
  });

  const candidates = loads.filter(o => {
    if (!o.name) return false;
    const cell = (dataMonth[o.i] || [])[colIndex];
    return String(cell || '').trim() === '';
  });

  if (!candidates.length) { ui.alert('У цьому дні немає порожніх клітинок для розстановки.'); return; }

  candidates.sort((a, b) => a.shifts - b.shifts);
  const pick = candidates.slice(0, Math.min(N, candidates.length));

  pick.forEach(p => {
    sh.getRange(2 + p.i, dayCol).setValue(CODE);
  });

  toast(`Поставила "${CODE}" для ${pick.length} осіб у колонці ${dayCol}${dayDate ? ' (' + Utilities.formatDate(dayDate, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'dd.MM.yyyy') + ')' : ''}`);
}