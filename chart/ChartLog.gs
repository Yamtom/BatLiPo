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

function buildChartLogRow_(colMap, width, data, sourceSheetName, sourceRowValues, email) {
  const row = new Array(width).fill('');
  const boardId = getBoardIdFromRow_(sourceSheetName, sourceRowValues) || 'Невизначено';

  const valuesByHeader = {
    'Статус': data.status,
    'Дата зміни': data.changeDate,
    'Хто': data.changedBy,
    'Опис': data.description || '',
    'Час': new Date(),
    'Email': email,
    'Борт': boardId
  };

  Object.keys(valuesByHeader).forEach(header => {
    const col = colMap[header];
    if (col) row[col - 1] = valuesByHeader[header];
  });

  return row;
}

function ensureColumns_(sheet, names) {
  const lastCol = Math.max(1, sheet.getLastColumn());
  let headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const known = new Set(headers);
  const missing = names.filter(name => !known.has(name));

  if (missing.length) {
    headers = headers.concat(missing);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return headers.reduce((colMap, name, i) => {
    colMap[name] = i + 1;
    return colMap;
  }, {});
}