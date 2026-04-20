function createOrUpdateBirthdaysFromSheet() {
  const sh = SpreadsheetApp.getActive().getSheetByName(BDAY_CFG.sheetName);
  if (!sh) throw new Error('Не знайдено аркуш: ' + BDAY_CFG.sheetName);

  const lastRow = sh.getLastRow();
  if (lastRow < 2) return;

  const width = Math.max(BDAY_CFG.eventIdCol, BDAY_CFG.dateCol);
  const rows = sh.getRange(2, 1, lastRow - 1, width).getValues();
  const cal = CalendarApp.getCalendarById(BDAY_CFG.calendarId);
  if (!cal) throw new Error('Не знайдено календар: ' + BDAY_CFG.calendarId);

  const yearNow = new Date().getFullYear();
  rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const name = String(row[BDAY_CFG.nameCol - 1] ?? '').trim();
    const rawDate = row[BDAY_CFG.dateCol - 1];
    if (!name || !rawDate) return;

    const birthday = coerceToDate(rawDate, yearNow);
    if (!birthday) return;

    const title = BDAY_CFG.titleTpl(name);
    const existingId = BDAY_CFG.eventIdCol
      ? String(row[BDAY_CFG.eventIdCol - 1] ?? '').trim()
      : '';

    const sameDayEntry = findBirthdayEventForDay_(cal, birthday, title);
    if (sameDayEntry) {
      applyBirthdayColor_(sameDayEntry);
      writeBirthdayEventId_(sh, rowNumber, sameDayEntry.getId());
      return;
    }

    const existingEntry = existingId ? findCalendarEntryById_(cal, existingId) : null;
    if (existingEntry) {
      removeCalendarEntry_(existingEntry);
    }

    const series = cal.createAllDayEventSeries(title, birthday, CalendarApp.newRecurrence().addYearlyRule());
    applyBirthdayColor_(series);
    writeBirthdayEventId_(sh, rowNumber, series.getId());
  });
}

function writeBirthdayEventId_(sheet, rowNumber, eventId) {
  if (!BDAY_CFG.eventIdCol) return;
  sheet.getRange(rowNumber, BDAY_CFG.eventIdCol).setValue(eventId || '');
}

function findBirthdayEventForDay_(cal, day, title) {
  return cal.getEventsForDay(day).find(event => event.getTitle() === title) || null;
}

function findCalendarEntryById_(cal, eventId) {
  if (!eventId) return null;
  try {
    if (typeof cal.getEventSeriesById === 'function') {
      const series = cal.getEventSeriesById(eventId);
      if (series) return series;
    }
  } catch (e) {
    Logger.log('Birthday series lookup skipped for ' + eventId + ': ' + e);
  }

  try {
    return cal.getEventById(eventId) || null;
  } catch (e) {
    Logger.log('Birthday entry lookup skipped for ' + eventId + ': ' + e);
    return null;
  }
}

function removeCalendarEntry_(entry) {
  if (!entry) return;
  try {
    if (typeof entry.deleteEventSeries === 'function') {
      entry.deleteEventSeries();
      return;
    }
    if (typeof entry.deleteEvent === 'function') {
      entry.deleteEvent();
    }
  } catch (e) {
    const message = String(e && e.message ? e.message : e);
    if (message.indexOf('does not exist') !== -1 || message.indexOf('already been deleted') !== -1) {
      Logger.log('Birthday entry already missing during delete: ' + message);
      return;
    }
    throw e;
  }
}

function applyBirthdayColor_(entry) {
  if (entry && typeof entry.setColor === 'function') {
    entry.setColor(CalendarApp.EventColor.PALE_BLUE);
  }
}

function coerceToDate(v, fallbackYear) {
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v)) {
    return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  }

  if (typeof v === 'number') {
    const base = new Date('1899-12-30T00:00:00Z');
    const d = new Date(base.getTime() + v * 86400000);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  if (typeof v === 'string') {
    const s = v.trim();
    const patterns = [
      [/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, (d, m, y) => new Date(y, m - 1, d)],
      [/^(\d{1,2})\.(\d{1,2})$/, (d, m) => new Date(fallbackYear, m - 1, d)],
      [/^(\d{4})-(\d{2})-(\d{2})$/, (y, m, d) => new Date(y, m - 1, d)],
      [/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, (d, m, y) => new Date(y, m - 1, d)],
      [/^(\d{1,2})\/(\d{1,2})$/, (d, m) => new Date(fallbackYear, m - 1, d)]
    ];

    for (const [re, ctor] of patterns) {
      const match = s.match(re);
      if (!match) continue;

      const parts = match.slice(1).map(x => parseInt(x, 10));
      const date = ctor(...parts);
      if (!isNaN(date)) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }
    }
  }

  return null;
}