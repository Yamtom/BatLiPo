/** CONFIG */
const BDAY_CFG = {
  calendarId: 'primary',             // або конкретний ID календаря
  sheetName: 'Особисті данні',        // назва аркуша
  nameCol: 3,                        // C
  dateCol: 7,                        // G
  eventIdCol: 8,                     // H (необов’язково: куди писати ID)
  titleTpl: (name) => `День Народження "${name}"`,
  tz: 'Europe/Kyiv'
};

/** Головна: створити/оновити щорічні all-day події */
function createOrUpdateBirthdaysFromSheet() {
  const sh = SpreadsheetApp.getActive().getSheetByName(BDAY_CFG.sheetName);
  if (!sh) throw new Error('Не знайдено аркуш: ' + BDAY_CFG.sheetName);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;

  const rows = sh.getRange(2, 1, lastRow - 1, Math.max(BDAY_CFG.eventIdCol, BDAY_CFG.dateCol)).getValues();
  const cal = CalendarApp.getCalendarById(BDAY_CFG.calendarId);
  if (!cal) throw new Error('Не знайдено календар: ' + BDAY_CFG.calendarId);

  const yearNow = new Date().getFullYear();

  rows.forEach((row, i) => {
    const name = String(row[BDAY_CFG.nameCol - 1] ?? '').trim();
    const rawDate = row[BDAY_CFG.dateCol - 1];
    if (!name || !rawDate) return;

    const d = coerceToDate(rawDate, yearNow);
    if (!d) return;

    const title = BDAY_CFG.titleTpl(name);

    // Якщо вже є eventId у колонці H — спробуємо оновити колір у знайденій події
    const existingId = (BDAY_CFG.eventIdCol ? String(row[BDAY_CFG.eventIdCol - 1] ?? '').trim() : '');
    if (existingId) {
      try {
        const ev = cal.getEventById(existingId);
        if (ev) {
          ev.setColor(CalendarApp.EventColor.PALE_BLUE);
          return;
        }
      } catch (_) {
        // падає, якщо не знайдено — ідемо нижче по заголовку/даті
      }
    }

    // Шукаємо подію цього дня з таким самим заголовком (щоб не плодити дублікати)
    const sameDayEvents = cal.getEventsForDay(d);
    const same = sameDayEvents.find(e => e.getTitle() === title);

    if (same) {
      same.setColor(CalendarApp.EventColor.PALE_BLUE);
      // зафіксуємо eventId у колонці H (якщо задано)
      if (BDAY_CFG.eventIdCol) {
        sh.getRange(i + 2, BDAY_CFG.eventIdCol).setValue(same.getId());
      }
      return;
    }

    // Створюємо щорічну подію (RRULE:FREQ=YEARLY), all-day
    const recur = CalendarApp.newRecurrence().addYearlyRule();
    const series = cal.createAllDayEventSeries(title, d, recur);
    series.setColor(CalendarApp.EventColor.PALE_BLUE);

    if (BDAY_CFG.eventIdCol) {
      sh.getRange(i + 2, BDAY_CFG.eventIdCol).setValue(series.getId());
    }
  });
}

/** Допоміжне: парсер дат — Date, серійні числа, рядки (dd.mm(.yyyy), yyyy-mm-dd, dd/mm/yyyy, mm/dd) */
function coerceToDate(v, fallbackYear) {
  // Уже Date
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  }
  // Серійне число Sheets/Excel
  if (typeof v === 'number') {
    const base = new Date('1899-12-30T00:00:00Z');
    const d = new Date(base.getTime() + v * 86400000);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  // Рядки
  if (typeof v === 'string') {
    const s = v.trim();
    const pats = [
      [/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, (d,m,y)=> new Date(y, m-1, d)],
      [/^(\d{1,2})\.(\d{1,2})$/,        (d,m)=> new Date(fallbackYear, m-1, d)],
      [/^(\d{4})-(\d{2})-(\d{2})$/,      (y,m,d)=> new Date(y, m-1, d)],
      [/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, (d,m,y)=> new Date(y, m-1, d)],
      [/^(\d{1,2})\/(\d{1,2})$/,         (m,d)=> new Date(fallbackYear, m-1, d)]
    ];
    for (const [re, ctor] of pats) {
      const m = s.match(re);
      if (m) {
        const parts = m.slice(1).map(x=>parseInt(x,10));
        const d = ctor(...parts);
        if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
      }
    }
  }
  return null;
}
