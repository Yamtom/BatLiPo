function runHealthCheck() {
  const issues = [];

  const nemSheet = requireSheet_(SHEET_NEMESIS);
  const nemData = nemSheet.getDataRange().getValues();
  for (let i = 1; i < nemData.length; i++) {
    const id = nemData[i][COL_NEMESIS_ID-1];
    if (!id || String(id).trim() === '') {
      issues.push(`<b>Nemesis</b>: Рядок ${i+1} — Відсутній ID (колонка B).`);
    }
  }

  const lasSheet = requireSheet_(SHEET_LASAR);
  const lasData = lasSheet.getDataRange().getValues();
  for (let i = 11; i < lasData.length; i++) {
    const series = lasData[i][COL_LASAR_SERIES - 1];
    const number = lasData[i][COL_LASAR_NUMBER - 1];

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

function archiveLostDrones() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.alert('Архівування',
    'До архіву підуть лише рядки, де останній запис статусу позначає втрату борта. Продовжити?',
    ui.ButtonSet.YES_NO);

  if (resp !== ui.Button.YES) return;

  const archiveSheet = getOrCreateSheet(SHEET_ARCHIVE);
  const targetSheets = [SHEET_NEMESIS, SHEET_LASAR];
  let totalMoved = 0;

  targetSheets.forEach(sName => {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sName);
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      const status = getLatestBoardStatusFromRow_(data[i]);
      if (isLostBoardStatus_(status)) {
        archiveSheet.appendRow([new Date(), sName, ...data[i]]);
        sheet.deleteRow(i + 1);
        totalMoved++;
      }
    }
  });

  ui.alert(`Архівування завершено. Перенесено записів: ${totalMoved}`);
}
