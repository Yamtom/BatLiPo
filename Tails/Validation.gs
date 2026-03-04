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
  const inner = buildAllowedRegexInner_(CONFIG.allowedCodes);
  const fullRegex = `^(?:${inner})$`;

  const dv = SpreadsheetApp.newDataValidation()
    .requireTextMatchesPattern(fullRegex)
    .setAllowInvalid(true)
    .build();

  range.setDataValidation(dv);

  const topLeft = range.getCell(1, 1).getA1Notation(); // наприклад C4
  const cfFormula = `=AND(LEN(${topLeft})>0,NOT(REGEXMATCH(LOWER(${topLeft}),"${escapeForSheetRegex_(fullRegex)}")))`;

  const rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(cfFormula)
    .setFontColor(CONFIG.invalidCodeFontColor)
    .setRanges([range])
    .build();

  const rangeA1 = range.getA1Notation();
  const rules = (sheet.getConditionalFormatRules() || [])
    .filter(existing => !isShiftValidationRule_(existing, rangeA1, cfFormula));
  rules.push(rule);
  sheet.setConditionalFormatRules(rules);
}

function buildAllowedRegexInner_(codes) {
  const uniq = Array.from(new Set((codes || []).map(x => String(x).trim().toLowerCase()).filter(Boolean)));
  return uniq.map(escapeRegex_).join('|') || escapeRegex_('п+ш');
}

function escapeRegex_(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeForSheetRegex_(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function isShiftValidationRule_(rule, rangeA1, formula) {
  const ranges = typeof rule.getRanges === 'function' ? rule.getRanges() : [];
  if (ranges.length !== 1 || ranges[0].getA1Notation() !== rangeA1) return false;

  if (typeof rule.getBooleanCondition !== 'function') return false;
  const condition = rule.getBooleanCondition();
  if (!condition) return false;

  if (condition.getCriteriaType() !== SpreadsheetApp.BooleanCriteria.CUSTOM_FORMULA) return false;
  const values = condition.getCriteriaValues();
  return Array.isArray(values) && String(values[0] || '') === formula;
}
