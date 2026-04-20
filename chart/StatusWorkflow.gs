function appendData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const sheetName = sheet.getName();
    const STATUS_COL = 20; // T

    if (sheetName !== SHEET_LASAR && sheetName !== SHEET_NEMESIS) {
      throw new Error('Помилка: Активний лист має бути Lasar або Nemesis. Перевірте, чи ви не перейшли на інший лист.');
    }

    const range = sheet.getActiveRange();
    if (!range || range.getNumColumns() !== 1 || range.getColumn() !== STATUS_COL) {
      throw new Error('Помилка: Запис дозволено лише в колонку T (одна колонка виділення).');
    }

    const numRows = range.getNumRows();
    const startRow = range.getRow();
    const historyLine = buildStatusHistoryLine_(data);
    const currentValues = range.getValues();
    const newValues = currentValues.map(r => {
      const prev = String(r[0] || '').trim();
      return [prev ? `${prev}\n${historyLine}` : historyLine];
    });
    range.setValues(newValues);

    colorCells(range, data.status);

    const allRowsData = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();
    for (let i = 0; i < numRows; i++) {
      logChange(data, sheetName, allRowsData[i]);
    }
  } catch (e) {
    logError('appendData', e);
    throw e;
  }
}

function colorCells(range, status, alsoCoreBlock = true) {
  try {
    const color = getStatusColor(status);
    if (!color) return;

    const sh = range.getSheet();
    const r = range.getRow();
    const numRows = range.getNumRows();
    const startCol = Math.max(1, range.getColumn() - 3);
    const width = 4;
    sh.getRange(r, startCol, numRows, width).setBackgrounds(makeColorMatrix_(numRows, width, color));

    if (alsoCoreBlock) {
      sh.getRange(r, 2, numRows, 4).setBackgrounds(makeColorMatrix_(numRows, 4, color));
    }
  } catch (err) {
    logError('colorCells', err);
  }
}

function getBoardHistory_(boardId) {
  if (!boardId || boardId === 'Невизначено') return [];
  const sheet = getOrCreateSheet(SHEET_LOG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idxBoard = headers.indexOf('Борт');
  const idxStatus = headers.indexOf('Статус');
  const idxDate = headers.indexOf('Дата зміни');
  const idxWho = headers.indexOf('Хто');
  const idxDesc = headers.indexOf('Опис');
  const idxTime = headers.indexOf('Час');
  if (idxBoard === -1) return [];

  const rowsToRead = Math.min(lastRow - 1, 3000);
  const startRow = Math.max(2, lastRow - rowsToRead + 1);
  const data = sheet.getRange(startRow, 1, rowsToRead, sheet.getLastColumn()).getValues();

  const history = [];
  const searchId = String(boardId).trim();

  for (let i = data.length - 1; i >= 0; i--) {
    if (String(data[i][idxBoard] || '').trim() === searchId) {
      const status = idxStatus !== -1 ? String(data[i][idxStatus] || '') : '';
      const dateRaw = idxDate !== -1 ? data[i][idxDate] : (idxTime !== -1 ? data[i][idxTime] : '');
      let dateText = '';
      if (Object.prototype.toString.call(dateRaw) === '[object Date]' && !isNaN(dateRaw.getTime())) {
        const tz = Session.getScriptTimeZone() || 'Etc/GMT';
        dateText = Utilities.formatDate(dateRaw, tz, 'yyyy-MM-dd');
      } else {
        dateText = String(dateRaw || '').trim();
      }

      const whoText = idxWho !== -1 ? String(data[i][idxWho] || '') : '';
      const descText = idxDesc !== -1 ? String(data[i][idxDesc] || '') : '';

      history.push({
        date: dateText,
        who: whoText,
        status: status,
        desc: descText,
        color: String(getStatusColor(status) || '')
      });
      if (history.length >= 3) break;
    }
  }
  return history;
}