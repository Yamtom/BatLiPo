function onOpen() {
  SpreadsheetApp.getUi().createMenu('🌟 Меню')
    .addItem('📝 Змінити статус / Відкрити форму', 'showForm')
    .addSeparator()
    //.addItem('📊 Оновити Звіт', 'updateReport')
    .addSeparator()
    .addItem('✅ Health Check (Перевірка)', 'runHealthCheck')
    .addItem('📦 Архівувати втрачені', 'archiveLostDrones')
    .addToUi();
}

function showForm() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const name = sheet.getName();
    const STATUS_COL = 20; // T

    if (name !== SHEET_LASAR && name !== SHEET_NEMESIS) {
      SpreadsheetApp.getUi().alert('Ця форма працює тільки на аркушах "Lasar" або "Nemesis".');
      return;
    }

    const range = sheet.getActiveRange();
    if (!range) {
      SpreadsheetApp.getUi().alert('Оберіть клітинку зі статусом або цілий стовпчик борта.');
      return;
    }
    if (range.getNumColumns() !== 1) {
      SpreadsheetApp.getUi().alert('Для зміни статусу оберіть тільки одну колонку.');
      return;
    }
    if (range.getColumn() !== STATUS_COL) {
      SpreadsheetApp.getUi().alert('Для зміни статусу використовуйте тільки колонку T.');
      return;
    }

    const html = HtmlService.createTemplateFromFile('FormMain')
      .evaluate().setWidth(1457).setHeight(680);
    SpreadsheetApp.getUi().showModalDialog(html, 'Управління статусом');
  } catch (e) {
    logError('showForm', e);
  }
}

function getFormData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    const range = sheet ? sheet.getActiveRange() : null;

    const statuses = getStatuses();
    const names = getNames();

    if (!sheet || !range) {
      return { statuses, names, meta: null, history: [] };
    }

    const sheetName = sheet.getName();
    const numRows = range.getNumRows();
    const cellValueRaw = range.getValue() == null ? '' : String(range.getValue());
    const currentStatus = (() => {
      const lines = cellValueRaw
        .split(/\r?\n/)
        .map(line => String(line || '').trim())
        .filter(Boolean);

      if (!lines.length) return '';

      const tail = lines.slice(-6).join('\n');
      return tail.length > 1500 ? `${tail.slice(-1500)}` : tail;
    })();

    const meta = {
      sheetName,
      row: range.getRow(),
      col: range.getColumn(),
      isMassEdit: numRows > 1,
      count: numRows,
      boardId: '',
      currentStatus,
      cellA1: range.getA1Notation()
    };

    let history = [];

    if (!meta.isMassEdit) {
      const rowValues = sheet.getRange(range.getRow(), 1, 1, sheet.getLastColumn()).getValues()[0];
      meta.boardId = getBoardIdFromRow_(sheetName, rowValues);
      if (meta.boardId) {
        try {
          history = getBoardHistory_(meta.boardId);
        } catch (historyError) {
          logError('getFormData.getBoardHistory_', historyError);
          history = [];
        }
      }
    }

    return { statuses, names, meta, history };
  } catch (e) {
    logError('getFormData', e);
    return { statuses: [], names: [], meta: null, history: [] };
  }
}

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

function logChange(data, sourceSheetName, sourceRowValues) {
  try {
    const headersList = ['Статус', 'Дата зміни', 'Хто', 'Опис', 'Час', 'Email', 'Борт'];
    const sheet = getOrCreateSheet(SHEET_LOG, headersList);
    const colMap = ensureColumns_(sheet, headersList);
    const email = Session.getActiveUser().getEmail();
    const row = buildChartLogRow_(colMap, sheet.getLastColumn(), data, sourceSheetName, sourceRowValues, email);
    sheet.appendRow(row);
  } catch (e) {
    logError('logChange', e);
  }
}

function getStatuses() {
  const sheet = getOrCreateSheet(SHEET_DICTIONARIES, ['Тип','Значення']);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const bgB  = sheet.getRange(2, 2, lastRow - 1, 1).getBackgrounds().flat();
  const out = [];
  data.forEach((row, i) => {
    if (row[0] === 'Статус' && row[1]) {
      out.push({ value: row[1], color: normalizeColor_(bgB[i]) });
    }
  });
  return out;
}

function getNames() {
  const sheet = getOrCreateSheet(SHEET_DICTIONARIES, ['Тип','Значення']);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, 2).getValues()
    .filter(r => r[0] === "Ім'я")
    .map(r => r[1]);
}

function testDictionary() {
  const names = getNames();
  Logger.log('Знайдені імена: ' + names);
  
  const statuses = getStatuses();
  Logger.log('Знайдені статуси: ' + JSON.stringify(statuses));
}

function addStatus(newStatus, newColor) {
  if (getStatuses().some(s => s.value === newStatus)) return;
  const color = (newColor && /^#[0-9a-f]{6}$/i.test(newColor)) ? newColor.toUpperCase() : '#FFFFFF';
  addDictionaryItem('Статус', newStatus, color);
}

function addName(name) {
  addDictionaryItem("Ім'я", name, null);
}

function addDictionaryItem(type, value, color) {
  const sheet = getOrCreateSheet(SHEET_DICTIONARIES, ['Тип','Значення']);
  const row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1).setValue(type);
  const valCell = sheet.getRange(row, 2).setValue(value);
  if (color) valCell.setBackground(color);
}

function getStatusColor(status) {
  const s = getStatuses().find(x => x.value === status);
  return s && s.color ? s.color : '';
}

function normalizeColor_(c) {
  if (!c || c.toLowerCase() === 'none') return '';
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toUpperCase();
  return c; 
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
