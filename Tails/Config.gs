/** ===========================
 *  Config & Defaults (спрощено)
 *  =========================== */
function loadConfig() {
  const defaults = {
    sheetNames: ['12.24','01.25','02.25','03.25','04.25','05.25','06.25','07.25','08.25','09.25','10.25','11.25','12.25','01.26','02.26','03.26'],
    headerRow: 1,
    dateRow: 3,
    dateStartColumn: 3,
    scheduleStartRow: 4,
    allowedCodes: ['р', 'ш', 'н', 'рн', 'п+ш'],
    invalidCodeFontColor: '#d93025',
    monitoredEditRanges: [
      { sheetName: null, range: 'C4:AG4' },
      { sheetName: null, range: 'AJ3' }
    ],
    errorNotificationEmail: '',
    customFunctions: {}
  };

  const props = PropertiesService.getScriptProperties().getProperties();
  const config = { ...defaults };
  const readers = {
    json: (value, fallback) => JSON.parse(value || JSON.stringify(fallback)),
    number: (value, fallback) => Number(value) || fallback,
    text: (value, fallback) => value || fallback
  };

  const fields = [
    ['sheetNames', 'SHEET_NAMES', 'json'],
    ['headerRow', 'HEADER_ROW', 'number'],
    ['dateRow', 'DATE_ROW', 'number'],
    ['dateStartColumn', 'DATE_START_COLUMN', 'number'],
    ['scheduleStartRow', 'SCHEDULE_START_ROW', 'number'],
    ['allowedCodes', 'ALLOWED_CODES', 'json'],
    ['invalidCodeFontColor', 'INVALID_CODE_FONT_COLOR', 'text'],
    ['monitoredEditRanges', 'MONITORED_EDIT_RANGES', 'json'],
    ['errorNotificationEmail', 'ERROR_NOTIFICATION_EMAIL', 'text'],
    ['customFunctions', 'CUSTOM_FUNCTIONS', 'json']
  ];

  fields.forEach(([field, key, mode]) => {
    try {
      config[field] = readers[mode](props[key], defaults[field]);
    } catch (e) {
      Logger.log('Config key parsing error [' + key + ']: ' + e);
      config[field] = defaults[field];
    }
  });

  return config;
}
let CONFIG = loadConfig();

function reloadConfig() {
  CONFIG = loadConfig();
  return CONFIG;
}
