/** ===========================
 * Validation (codes)
 * - Data validation: regex по allowed codes
 * - Conditional formatting: font color, щоб не ламати фони (duty, дати)
 * =========================== */

function setupValidationActiveSheet() {
  applyShiftCodeValidationForSheet_(SpreadsheetApp.getActiveSheet());
  toast('Валідацію встановлено (активний лист)');
}

function setupValidationAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  CONFIG.sheetNames.forEach(name => {
    const sh = ss.getSheetByName(name);
    if (sh) applyShiftCodeValidationForSheet_(sh);
  });
  toast('Валідацію встановлено (всі листи)');
}

function applyShiftCodeValidationForSheet_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < CONFIG.scheduleStartRow || lastCol < CONFIG.dateStartColumn) return;

  const numRows = lastRow - CONFIG.scheduleStartRow + 1;
  const numCols = lastCol - CONFIG.dateStartColumn + 1;

  const range = sheet.getRange(CONFIG.scheduleStartRow, CONFIG.dateStartColumn, numRows, numCols);

  // regex: строго повний матч, без пробілів на краях
  // Важливо: allowedCodes тримаємо у lowercase в Settings; uppercase вважаємо "помилкою"
  const inner = buildAllowedRegexInner_(CONFIG.allowedCodes);
  const fullRegex = `^(?:${inner})$`;

  // Data validation: дозволяємо інвалідні (щоб не блокувати роботу), але позначаємо
  const dv = SpreadsheetApp.newDataValidation()
    .requireTextMatchesPattern(fullRegex)
    .setAllowInvalid(true)
    .build();

  range.setDataValidation(dv);

  // Conditional formatting: червоний шрифт для невалідних
  const topLeft = range.getCell(1, 1).getA1Notation(); // наприклад C4
  const cfFormula = `=AND(LEN(${topLeft})>0,NOT(REGEXMATCH(LOWER(${topLeft}),"${escapeForSheetRegex_(fullRegex)}")))`;

  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(cfFormula)
    .setFontColor(CONFIG.invalidCodeFontColor)
    .setRanges([range])
    .build();

  // Rule додається без зміни інших
  const rules = sheet.getConditionalFormatRules() || [];
  rules.push(rule);
  sheet.setConditionalFormatRules(rules);
}

// allowedCodes -> regex alternatives, з екрануванням
function buildAllowedRegexInner_(codes) {
  const uniq = Array.from(new Set((codes || []).map(x => String(x).trim().toLowerCase()).filter(Boolean)));
  // Екрануємо спецсимволи regex; кирилицю лишаємо без змін
  return uniq.map(escapeRegex_).join('|') || escapeRegex_('п+ш');
}

function escapeRegex_(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Для REGEXMATCH у Sheets: потрібна додаткова екранування лапок і бекслешів
function escapeForSheetRegex_(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
