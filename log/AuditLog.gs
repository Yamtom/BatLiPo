function logChange(action, value) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_LOG);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_LOG);
    sh.appendRow(['Дата/Час', 'Користувач', 'Дія', 'Значення']);
  }

  const user = Session.getEffectiveUser().getEmail() || 'Невідомий';
  const ts = Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, "yyyy-MM-dd'T'HH:mm:ss");

  sh.appendRow([ts, user, action, String(value)]);

  const MAX_LOGS = 5000;
  const lastRow = sh.getLastRow();
  if (lastRow > MAX_LOGS + 100) {
    sh.deleteRows(2, lastRow - MAX_LOGS);
  }
}