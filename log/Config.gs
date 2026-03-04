/**
 * ГОЛОВНА КОНФІГУРАЦІЯ
 */
const CONFIG = {
  MENU_NAME: '🛠️ Команди',
  TIME_FORMAT: 'HH:mm',
  DATE_FORMAT: 'yyyy-MM-dd',
  TIME_ZONE: 'Europe/Kyiv',

  SHEET_DATA: 'Ураження цілей',
  SHEET_LOG: 'Log',

  DATA_START_ROW: 4, 

  // Структура колонок
  COLS: {
    DATE: 1,          // A
    PILOT: 2,         // B
    NAVIGATOR: 3,     // C
    BOARD: 4,         // D
    TAKEOFF: 5,       // E
    LANDING: 6,       // F
    DURATION: 7,      // G
    EW_ACTION: 8,     // H (чекбокс)
    AREA: 9,          // I
    HIT_COUNT: 10,    // J
    TARGET_TYPE: 11,  // K
    AMMO_OUTER: 12,   // L - зовнішні підвіси
    AMMO_INNER: 13,   // M - внутрішні підвіси
    INTEGRITY: 14,    // N
    NOTES: 15,        // O
    RISK: 19          // fallback index if the header row does not expose a dedicated RISK column
  },

  // Налаштування ризику
  RISK_CRITERIA: {
    MAX_DURATION_MINUTES: 120, // > 2 год = ризик
    BAD_INTEGRITY: ['Пошкоджений', 'Втрачений']
  },

  AUTOSORT_DEBOUNCE_MS: 3000,

  HEADERS: {
    DATE:    ['Дата', 'Date'],
    TAKEOFF: ['Час зльоту', 'Takeoff'],
    LANDING: ['Час посадки', 'Landing']
  }
};
