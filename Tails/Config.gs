/** ===========================
 *  Config & Defaults (спрощено)
 *  =========================== */
function loadConfig() {
  const defaults = {
    sheetNames: ['12.24','01.25','02.25','03.25','04.25','05.25','06.25','07.25','08.25','09.25','10.25','11.25','12.25','01.26','02.26','03.26'],
    headerRow: 1,
    dateRow: 3,
    dateStartColumn: 3,
    monitoredEditRanges: [
      { sheetName: null, range: 'C4:AG4' },
      { sheetName: null, range: 'AJ3' }
    ],
    errorNotificationEmail: '',
    customFunctions: {}
  };

  const props = PropertiesService.getScriptProperties().getProperties();
  try {
    return {
      sheetNames: JSON.parse(props.SHEET_NAMES || JSON.stringify(defaults.sheetNames)),
      headerRow: Number(props.HEADER_ROW) || defaults.headerRow,
      dateRow: Number(props.DATE_ROW) || defaults.dateRow,
      dateStartColumn: Number(props.DATE_START_COLUMN) || defaults.dateStartColumn,
      monitoredEditRanges: JSON.parse(props.MONITORED_EDIT_RANGES || JSON.stringify(defaults.monitoredEditRanges)),
      errorNotificationEmail: props.ERROR_NOTIFICATION_EMAIL || defaults.errorNotificationEmail,
      customFunctions: JSON.parse(props.CUSTOM_FUNCTIONS || JSON.stringify(defaults.customFunctions))
    };
  } catch (e) {
    Logger.log('Config parsing error: ' + e);
    return defaults;
  }
}
const CONFIG = loadConfig();
