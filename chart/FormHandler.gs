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

    const html = HtmlService.createTemplateFromFile('FormMain')
      .evaluate().setWidth(1457).setHeight(680);
    SpreadsheetApp.getUi().showModalDialog(html, 'Управління статусом');
  } catch (e) {
    logError('showForm', e);
  }
}


/**
 * Основна функція завантаження даних для форми
 * Повертає: Списки (статуси, імена), Метадані виділення, Історію (якщо 1 борт)
 */
function getFormData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const range = sheet ? sheet.getActiveRange() : null;

  const statuses = getStatuses();
  const names = getNames();

  if (!sheet || !range) {
    return { statuses: statuses, names: names, meta: null, history: [] };
  }

  const sheetName = sheet.getName();
  const numRows   = range.getNumRows();

  // Отримуємо значення, але безпечно
  let cellValue = '';
  if (range.getValue() != null) {
      cellValue = String(range.getValue());
  }

  let meta = {
    sheetName: sheetName,
    row: range.getRow(),
    col: range.getColumn(),
    isMassEdit: numRows > 1,
    count: numRows,
    boardId: '',
    currentStatus: cellValue,
    cellA1: range.getA1Notation()
  };

  let history = [];

  if (!meta.isMassEdit) {
    const rowValues = sheet
      .getRange(range.getRow(), 1, 1, sheet.getLastColumn())
      .getValues()[0];

    // --- ПОЧАТОК ВИПРАВЛЕННЯ ---
    if (sheetName === SHEET_LASAR) {
      // Примусово конвертуємо в String і обрізаємо пробіли (.trim())
      // Використовуємо (|| '') щоб уникнути помилок на undefined/null
      const s = String(rowValues[COL_LASAR_SERIES - 1] || '').trim();
      const n = String(rowValues[COL_LASAR_NUMBER - 1] || '').trim();
      
      // Перевіряємо, що змінні не порожні (тепер "0" пройде перевірку)
      if (s !== '' && n !== '') {
        meta.boardId = `${s}.${n}`; // Використовуємо шаблонні рядки для надійності
      }

    } else if (sheetName === SHEET_NEMESIS) {
      const id = String(rowValues[COL_NEMESIS_ID - 1] || '').trim();
      meta.boardId = id;
    }
    // --- КІНЕЦЬ ВИПРАВЛЕННЯ ---

    if (meta.boardId) {
      history = getBoardHistory_(meta.boardId);
    }
  }

  return {
    statuses: statuses,
    names: names,
    meta: meta,
    history: history
  };
}



/**
 * ВИПРАВЛЕНО: Функція тепер сама визначає активний діапазон,
 * не покладаючись на дані з форми, яких не вистачало.
 */
function appendData(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet(); // Беремо поточний активний лист
    const sheetName = sheet.getName();

    // 1. Валідація листа
    if (sheetName !== SHEET_LASAR && sheetName !== SHEET_NEMESIS) {
      throw new Error('Помилка: Активний лист має бути Lasar або Nemesis. Перевірте, чи ви не перейшли на інший лист.');
    }

    const range = sheet.getActiveRange();
    const numRows = range.getNumRows();
    const startRow = range.getRow();

    // 2. Формування тексту
    const statusLine = `Статус: ${data.status}, Дата: ${data.changeDate}, Хто: ${data.changedBy}`;
    const fullText = data.description ? `${statusLine}, Опис: ${data.description}` : statusLine;

    // 3. Оновлення значень (зберігаємо історію в клітинці)
    const currentValues = range.getValues();
    const newValues = currentValues.map(r => {
      const prev = String(r[0] || '').trim();
      // Додаємо новий запис з нового рядка
      return [prev ? `${prev}\n${fullText}` : fullText];
    });
    range.setValues(newValues);

    // 4. Фарбування
    colorCells(range, data.status);

    // 5. Логування (для кожного рядка окремо)
    const allRowsData = sheet.getRange(startRow, 1, numRows, sheet.getLastColumn()).getValues();
    for (let i = 0; i < numRows; i++) {
      logChange(data, sheetName, allRowsData[i]);
    }

  } catch (e) {
    logError('appendData', e);
    throw e;
  }
}


/**
 * Логування однієї зміни
 */
function logChange(data, sourceSheetName, sourceRowValues) {
  try {
    const headersList = ['Статус', 'Дата зміни', 'Хто', 'Опис', 'Час', 'Email', 'Борт'];
    const sheet = getOrCreateSheet(SHEET_LOG, headersList);
    const colMap = ensureColumns_(sheet, headersList);
    const email = Session.getActiveUser().getEmail();

    // Визначення ID
    let boardId = 'Невизначено';
    if (sourceSheetName === SHEET_NEMESIS && sourceRowValues) {
      boardId = sourceRowValues[COL_NEMESIS_ID - 1]; 
    } else if (sourceSheetName === SHEET_LASAR && sourceRowValues) {
      const series = sourceRowValues[COL_LASAR_SERIES - 1];
      const number = sourceRowValues[COL_LASAR_NUMBER - 1];
      boardId = `${series}.${number}`;
    }

    // Підготовка рядка
    const lastColIndex = sheet.getLastColumn(); 
    const rowArr = new Array(lastColIndex).fill('');

    if (colMap['Статус']) rowArr[colMap['Статус'] - 1] = data.status;
    if (colMap['Дата зміни']) rowArr[colMap['Дата зміни'] - 1] = data.changeDate;
    if (colMap['Хто']) rowArr[colMap['Хто'] - 1] = data.changedBy;
    if (colMap['Опис']) rowArr[colMap['Опис'] - 1] = data.description || '';
    if (colMap['Час']) rowArr[colMap['Час'] - 1] = new Date();
    if (colMap['Email']) rowArr[colMap['Email'] - 1] = email;
    if (colMap['Борт']) rowArr[colMap['Борт'] - 1] = boardId;

    sheet.appendRow(rowArr);
  } catch (e) {
    logError('logChange', e);
  }
}

// === Довідники та Кольори ===

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
  SpreadsheetApp.flush();
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
    const numRows = range.getNumRows(); // Підтримка масового редагування

    // Фарбуємо блок зліва (Series/Number або ID)
    const startCol = Math.max(1, range.getColumn() - 3);
    const width = 4;
    
    // Створюємо матрицю кольорів
    const colorsMatrix = [];
    const rowColors = new Array(width).fill(color);
    for(let i=0; i<numRows; i++) colorsMatrix.push(rowColors);
    
    sh.getRange(r, startCol, numRows, width).setBackgrounds(colorsMatrix);

    // Фарбуємо фіксований блок B-E (якщо треба)
    if (alsoCoreBlock) {
       const coreWidth = 4; // B, C, D, E
       const coreMatrix = [];
       const coreRowColors = new Array(coreWidth).fill(color);
       for(let i=0; i<numRows; i++) coreMatrix.push(coreRowColors);
       sh.getRange(r, 2, numRows, coreWidth).setBackgrounds(coreMatrix);
    }
    SpreadsheetApp.flush();
  } catch (err) {
    logError('colorCells', err);
  }
}

// === Історія ===
function getBoardHistory_(boardId) {
  if (!boardId || boardId === 'Невизначено') return [];
  const sheet = getOrCreateSheet(SHEET_LOG);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idxBoard = headers.indexOf('Борт');
  // ... інші індекси ...
  if (idxBoard === -1) return [];

  // Збільшіть ліміт, якщо бортів багато. 
  // Якщо 9506 - це старий запис, 1000 рядків може не вистачити.
  const rowsToRead = Math.min(lastRow - 1, 3000); // Збільшено до 3000
  const startRow = Math.max(2, lastRow - rowsToRead + 1);
  const data = sheet.getRange(startRow, 1, rowsToRead, sheet.getLastColumn()).getValues();

  const history = [];
  // При порівнянні теж робимо trim(), щоб уникнути проблем із пробілами
  const searchId = String(boardId).trim();

  for (let i = data.length - 1; i >= 0; i--) {
    // Жорстке приведення до String і trim перед порівнянням
    if (String(data[i][idxBoard] || '').trim() === searchId) {
       // ... ваш код додавання в history ...
       history.push({
        // ...
       });
       if (history.length >= 3) break;
    }
  }
  return history;
}