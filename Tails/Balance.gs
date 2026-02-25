/** ===========================
 *  Auto-balance for a day
 *  Працює по активному аркушу і активному СТОВПЦЮ (день).
 *  Алгоритм (мінімально інвазивний і зрозумілий):
 *   1) Вводиться КОД (для встановлення) та КІЛЬКІСТЬ місць N.
 *   2) Розраховується завантаження (змін у місяць) по кожній людині.
 *   3) Фільтруються недоступні (за потреби логіка розширюється; тут враховано лише порожні/доступні комірки).
 *   4) Обираються N кандидатів з найменшим навантаженням, після чого заповнюються ПУСТІ клітинки в активному дні.
 *   5) Уже заповнені клітинки не чіпає.
 *  Примітка: за потреби врахування сертифікацій/ролей/заборон може бути додано lookup з "Бібліотека".
 *  =========================== */

function autoBalanceDay() {
  const ui = SpreadsheetApp.getUi();
  const sh = SpreadsheetApp.getActiveSheet();
  const lastCol = sh.getLastColumn();
  const lastRow = sh.getLastRow();

  // Перевіряється, що активна клітинка у межах дат
  const active = sh.getActiveCell();
  if (!active) { ui.alert('Обери клітинку в колонці потрібного дня.'); return; }
  const dayCol = active.getColumn();
  if (dayCol < CONFIG.dateStartColumn || dayCol > lastCol) {
    ui.alert('Обери клітинку в діапазоні дат (починаючи з колонки ' + CONFIG.dateStartColumn + ').');
    return;
  }

  // Запитуються код і кількість
  const codeResp = ui.prompt('Код для розстановки', 'Введи код зміни (наприклад: р, ш, н, рн…)', ui.ButtonSet.OK_CANCEL);
  if (codeResp.getSelectedButton() !== ui.Button.OK) return;
  const CODE = (codeResp.getResponseText() || '').trim();
  if (!CODE) { ui.alert('Код порожній.'); return; }

  const nResp = ui.prompt('Скільки людей поставити?', 'Введи число N (скільки порожніх місць заповнити)', ui.ButtonSet.OK_CANCEL);
  if (nResp.getSelectedButton() !== ui.Button.OK) return;
  const N = Math.max(0, Number(nResp.getResponseText() || '0'));
  if (!N) { ui.alert('N має бути > 0.'); return; }

  // Зчитуються люди (стовпець A, з 2-го рядка) та їхній місячний лоад
  const people = sh.getRange(2, 1, lastRow-1, 1).getValues().map(r => (r[0] || '').toString().trim());
  const dataMonth = sh.getRange(2, CONFIG.dateStartColumn, lastRow-1, lastCol - CONFIG.dateStartColumn + 1).getValues();
  const dateRow = sh.getRange(CONFIG.dateRow, CONFIG.dateStartColumn, 1, lastCol - CONFIG.dateStartColumn + 1).getValues()[0].map(parseDate);

  // Індекс колонки в масиві дат:
  const colIndex = dayCol - CONFIG.dateStartColumn; // 0-based
  const dayDate = parseDate(sh.getRange(CONFIG.dateRow, dayCol).getValue());

  // Підрахунок змін/місяць по кожній людині
  const loads = people.map((name, i) => {
    if (!name) return { i, name, shifts: 0 };
    let cnt = 0;
    for (let d = 0; d < dataMonth[i].length; d++) {
      if (String(dataMonth[i][d] || '').trim() !== '') cnt++;
    }
    return { i, name, shifts: cnt };
  });

  // Кандидати = ті, в кого сьогодні ПУСТО
  let candidates = loads.filter(o => {
    if (!o.name) return false;
    const cell = (dataMonth[o.i] || [])[colIndex];
    return String(cell || '').trim() === '';
  });

  if (!candidates.length) { ui.alert('У цьому дні немає порожніх клітинок для розстановки.'); return; }

  // Сортуємо за найменшим навантаженням (справедливість)
  candidates.sort((a,b) => a.shifts - b.shifts);

  // Обираються перші N
  const pick = candidates.slice(0, Math.min(N, candidates.length));

  // Код записується у лист
  pick.forEach(p => {
    sh.getRange(2 + p.i, dayCol).setValue(CODE);
  });

  toast(`Поставила "${CODE}" для ${pick.length} осіб у колонці ${dayCol}${dayDate ? ' ('+Utilities.formatDate(dayDate, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'dd.MM.yyyy')+')' : ''}`);
}
