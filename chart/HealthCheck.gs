/**
 * Аналізує таблиці на наявність помилок заповнення
 */
function runHealthCheck() {
  const issues = [];
  
  // 1. Перевірка Nemesis
  const nemSheet = getOrCreateSheet(SHEET_NEMESIS);
  const nemData = nemSheet.getDataRange().getValues();
  // Приймається припущення, що Nemesis має заголовок у рядку 1
  for (let i = 1; i < nemData.length; i++) {
    const id = nemData[i][COL_NEMESIS_ID-1];
    if (!id || String(id).trim() === '') {
      issues.push(`<b>Nemesis</b>: Рядок ${i+1} — Відсутній ID (колонка B).`);
    }
  }

  // 2. Перевірка Lasar
  const lasSheet = getOrCreateSheet(SHEET_LASAR);
  const lasData = lasSheet.getDataRange().getValues();
  // Lasar часто має велику шапку; дані починаються з рядка 12 (константи мають бути перевірені).
  // Скануємо всі рядки, де є Серія
  for (let i = 11; i < lasData.length; i++) { 
     const series = lasData[i][COL_LASAR_SERIES-1];
     const number = lasData[i][COL_LASAR_NUMBER-1];
     
     if (series && (!number || String(number).trim() === '')) {
       issues.push(`<b>Lasar</b>: Рядок ${i+1} — Є серія "${series}", але немає номера.`);
     }
  }

  if (issues.length > 0) {
    const htmlContent = `<h3>Знайдено потенційні проблеми:</h3><ul><li>${issues.join('</li><li>')}</li></ul>`;
    const html = HtmlService.createHtmlOutput(htmlContent).setWidth(500).setHeight(400);
    SpreadsheetApp.getUi().showModalDialog(html, 'Результат перевірки (Health Check)');
  } else {
    SpreadsheetApp.getUi().alert('✅ Чудово! Проблем з ID не виявлено.');
  }
}

/**
 * Переносить борти зі статусом "Втрачений" до архіву
 */
function archiveLostDrones() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert('Архівування', 
    'Всі рядки, що містять слово Втрачений в тексті комірок, будуть перенесені в лист "Архів Бортів" і видалені з поточного листа. Продовжити?', 
    ui.ButtonSet.YES_NO);
  
  if (resp !== ui.Button.YES) return;

  const archiveSheet = getOrCreateSheet(SHEET_ARCHIVE);
  const targetSheets = [SHEET_NEMESIS, SHEET_LASAR];
  let totalMoved = 0;

  targetSheets.forEach(sName => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    // Йдемо з кінця, щоб видалення не ламало індекси
    for (let i = data.length - 1; i >= 1; i--) { // Рядок заголовка ігнорується
      const rowString = data[i].join(' ').toLowerCase();
      
      if (rowString.includes('втрачений') || rowString.includes('lost') || rowString.includes('збито')) {
        // Додається мітка джерела
        archiveSheet.appendRow([new Date(), sName, ...data[i]]);
        sheet.deleteRow(i + 1);
        totalMoved++;
      }
    }
  });

  ui.alert(`Архівування завершено. Перенесено записів: ${totalMoved}`);
}