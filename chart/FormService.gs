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