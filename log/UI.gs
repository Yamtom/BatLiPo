function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu(CONFIG.MENU_NAME)
    .addItem('📝 Швидке введення польоту', 'showQuickEntry')
    .addSeparator()
    .addItem('📆 Зріз за період / Звіт', 'showSliceDialog')
    .addItem('⚠️ Перерахувати ризики (RISK)', 'recalcAllDurations')
    .addSeparator()
    .addItem('⬇️ До останнього рядка', 'goToLastRow')
    .addItem('🔃 Сортувати', 'sortByDateTime')
    .addItem('🧹 Видалити порожні рядки', 'removeEmptyRows')
    .addToUi();

  // Автоперехід до останнього вільного рядка по колонці A
  goToLastRow();
}

/**
 * PREFILL: списки + останні значення користувача
 */
function getPrefillData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(CONFIG.SHEET_DATA);
  const userProps = PropertiesService.getUserProperties().getProperties();
  
  if (!sh) {
    return { pilots: [], navigators: [], boards: [], ammoTypes: [], defaults: {} };
  }

  return {
    pilots: getDistinctFromColumn_(sh, CONFIG.COLS.PILOT,     CONFIG.DATA_START_ROW),
    navigators: getDistinctFromColumn_(sh, CONFIG.COLS.NAVIGATOR, CONFIG.DATA_START_ROW),
    boards: getDistinctFromColumn_(sh, CONFIG.COLS.BOARD,     CONFIG.DATA_START_ROW),
    ammoTypes: getDistinctAmmoTypes_(sh),
    defaults: {
      pilot:    userProps.LAST_PILOT || '',
      navigator:userProps.LAST_NAV   || '',
      board:    userProps.LAST_BOARD || '',
      area:     userProps.LAST_AREA  || ''
    }
  };
}

const UI_SLICE_CONFIG = {
  dialogTitle: 'Зріз / Звіт',
  width: 450,
  height: 380,
  template: 'SliceDialog'
};

function showSliceDialog() {
  const html = HtmlService.createTemplateFromFile(UI_SLICE_CONFIG.template);
  html.PREFILL = getPrefillData_();
  SpreadsheetApp.getUi()
    .showModalDialog(html.evaluate().setWidth(UI_SLICE_CONFIG.width).setHeight(UI_SLICE_CONFIG.height),
                     UI_SLICE_CONFIG.dialogTitle);
}

function showQuickEntry() {
  const html = HtmlService.createTemplateFromFile('QuickEntry');
  html.PREFILL = getPrefillData_();
  SpreadsheetApp.getUi()
    .showModalDialog(html.evaluate().setWidth(500).setHeight(700),
                     'Швидке введення даних');
}

/** Видалення порожніх рядків */
function removeEmptyRows() {
  const sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== CONFIG.SHEET_DATA) return;
  
  const lastRow = sh.getLastRow();
  let removed = 0;
  
  for (let i = lastRow; i >= CONFIG.DATA_START_ROW; i--) {
    const rowRange = sh.getRange(i, 1, 1, sh.getLastColumn());
    if (rowRange.getValues()[0].every(c => String(c).trim() === '')) {
      sh.deleteRow(i);
      removed++;
    }
  }
  SpreadsheetApp.getActive().toast('Видалено порожніх рядків: ' + removed);
}
