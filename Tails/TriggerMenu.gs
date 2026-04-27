/** Тригери і меню */

function clearTriggersByFns(fns) {
  const names = Array.isArray(fns) ? fns : [fns];
  const set = new Set(names);
  ScriptApp.getProjectTriggers().forEach(tr => {
    if (set.has(tr.getHandlerFunction())) ScriptApp.deleteTrigger(tr);
  });
}

function createDailyTrigger() {
  clearTriggersByFns(['colorCells']);
  ScriptApp.newTrigger('colorCells')
    .timeBased()
    .everyDays(1)
    .atHour(1)
    .create();
}

function createGcalEditTrigger() {
  clearTriggersByFns(['onEdit']);
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();
}

function createMenuOpenTrigger() {
  clearTriggersByFns(['onOpen']);
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onOpen()
    .create();
}

function createTailsTriggers() {
  createDailyTrigger();
  createGcalEditTrigger();
  createMenuOpenTrigger();
}

function repairTailsUi() {
  buildTailsMenus_();
  createTailsTriggers();
  toast('Меню і тригери Tails відновлено. Якщо меню не видно, оновіть таблицю.', 5);
}

function buildTailsMenus_() {
  SpreadsheetApp.getUi()
    .createMenu('🛠️ Скрипти')
    .addItem('Оновити (колір + підрахунки)', 'refreshAll')
    .addItem('Перефарбувати заголовки (усі листи)', 'colorCells')
    .addItem('Оновити підрахунки (активний лист)', 'refreshColorCountsActiveSheet')
    .addItem('Відновити щоденний тригер (01:00)', 'createDailyTrigger')
    .addItem('Відновити меню й тригери', 'repairTailsUi')
    .addSeparator()
    .addItem('Відкрити SMS панель', 'showSidebar')
    .addSeparator()
    .addItem('Застосувати Freeze (рядки 1–3, колонки A–B)', 'applyFreeze')
    .addToUi();
  SpreadsheetApp.getUi()
    .createMenu('GCAL Sync')
    .addItem('Створити конфіг', 'ensureConfigSheet')
    .addItem('Відновити onEdit тригер', 'createGcalEditTrigger')
    .addItem('Ручний запуск: синхронізувати все', 'syncAllChunked')
    .addToUi();
}

function onOpen() {
  buildTailsMenus_();
}

function onInstall(e) {
  onOpen(e);
  createTailsTriggers();
}

function applyFreeze() {
  const sh = SpreadsheetApp.getActiveSheet();
  sh.setFrozenRows(3);
  sh.setFrozenColumns(2);
  toast('Freeze застосовано: рядки 1-3, колонки A-B');
}
