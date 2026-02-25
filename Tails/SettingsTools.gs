// SettingsTools.gs (new file)
function ensureSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Settings');
  if (!sh) sh = ss.insertSheet('Settings');

  sh.clear();
  sh.getRange(1, 1, 1, 2).setValues([['key', 'value']]);

  const rows = [
    ['NightCodes', 'н,рн,Н'],
    ['HolidaysRangeName', 'HOLIDAYS'],
    ['EmailErrors', ''],
    ['HeaderRow', 1],
    ['DateRow', 3],
    ['DateStartColumn', 3],
    ['MonitoredRange', 'C4:AG100']
  ];

  sh.getRange(2, 1, rows.length, 2).setValues(rows);
  sh.autoResizeColumns(1, 2);
  toast('Settings створено', 3);

  // invalidate cached config/settings
  CacheService.getScriptCache().remove('settings:v2');
  reloadConfig();
}
