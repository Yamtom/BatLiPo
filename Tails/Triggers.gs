/** Тригери і меню */

// Тригери для вказаних функцій видаляються (одна функція або масив)
function clearTriggersByFns(fns) {
  const names = Array.isArray(fns) ? fns : [fns];
  const set = new Set(names);
  ScriptApp.getProjectTriggers().forEach(tr => {
    if (set.has(tr.getHandlerFunction())) ScriptApp.deleteTrigger(tr);
  });
}

/**
 * ЄДИНИЙ щоденний тригер: щоночі фарбуємо заголовки по всіх листах (легко й швидко).
 * Якщо тригер уже є — видаляємо і створюємо заново.
 */
function createDailyTrigger() {
  clearTriggersByFns(['colorCells']);
  ScriptApp.newTrigger('colorCells')
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .create();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🛠️ Скрипти')
    .addItem('Оновити (колір + підрахунки)', 'refreshAll') 
    .addItem('Перефарбувати заголовки (усі листи)', 'colorCells') 
    .addItem('Оновити підрахунки (активний лист)', 'refreshColorCountsActiveSheet')
    .addItem('Відновити щоденний тригер (01:00)', 'createDailyTrigger')
    .addSeparator()
    .addItem('Відкрити SMS панель', 'showSidebar')
    .addSeparator()
    .addItem('Застосувати Freeze (рядки 1–3, колонки A–B)', 'applyFreeze')
    .addToUi();
  SpreadsheetApp.getUi()
    .createMenu('GCAL Sync')
    .addItem('Створити конфіг', 'ensureConfigSheet')
    .addItem('Ручний запуск: синхронізувати все', 'syncAllChunked')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
  createDailyTrigger();
}
