function getStatuses() {
  const sheet = getOrCreateSheet(SHEET_DICTIONARIES, ['Тип','Значення']);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  const bgB = sheet.getRange(2, 2, lastRow - 1, 1).getBackgrounds().flat();
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
  const statusEntry = getStatuses().find(x => x.value === status);
  return statusEntry && statusEntry.color ? statusEntry.color : '';
}

function normalizeColor_(c) {
  if (!c || c.toLowerCase() === 'none') return '';
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toUpperCase();
  return c;
}