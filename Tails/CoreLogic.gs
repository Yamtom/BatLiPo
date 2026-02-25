/** ===========================
 *  Core: фарбування заголовків + підрахунок кольорів
 *  =========================== */

// Фарбування заголовків для АКТИВНОГО листа (сумісність зі старим меню)
function colorCells() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    CONFIG.sheetNames.forEach(name => {
      const sh = ss.getSheetByName(name);
      if (sh) colorHeadersForSheet(sh);
    });
  } catch (e) {
    sendErrorNotification(e, 'colorCells');
  }
}

/** Фарбування конкретного листа (використовує ті самі кольори, що і colorCells) */
function colorHeadersForSheet(sheet) {
  const today = new Date(); today.setHours(0,0,0,0);

  const lastCol = sheet.getLastColumn();
  if (lastCol < CONFIG.dateStartColumn) return;

  const dateRange = sheet.getRange(
    CONFIG.dateRow, CONFIG.dateStartColumn,
    1, lastCol - CONFIG.dateStartColumn + 1
  );
  const headerRange = sheet.getRange(
    CONFIG.headerRow, CONFIG.dateStartColumn,
    1, lastCol - CONFIG.dateStartColumn + 1
  );

  const values = dateRange.getValues()[0];
  const tt = today.getTime();
  const bg = values.map(v => {
    const d = parseDate(v);
    if (!d) return 'white';
    const t = d.getTime();
    return t === tt ? 'red' : (t < tt ? 'green' : 'white');
  });

  headerRange.setBackgrounds([bg]);
}

/**
 * Підрахунок клітинок за кольором(ами).
 * - rangeA: A1 або Range (можна sheet!A1:B2)
 * - colorAddrs: одна адреса/масив адрес/прямий колір ("#ff0000" або "red")/Range
 * Додає:
 *  - перевірку пустих таргетів
 *  - підтримку посилань "Лист!A1"
 *  - підтримку прямих значень кольору
 */
function countCellsByColor(rangeA, colorAddrs, dummy) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ---- нормалізація даного діапазону (rangeA) ----
    let dataSheet, dataRange;
    if (typeof rangeA === 'string') {
      const parsed = splitSheetA1(rangeA);
      dataSheet = ss.getSheetByName(parsed.sheetName) || ss.getActiveSheet();
      dataRange = dataSheet.getRange(parsed.a1);
    } else if (rangeA && typeof rangeA.getBackgrounds === 'function') {
      dataRange = rangeA;
      dataSheet = dataRange.getSheet();
    } else {
      throw new Error('countCellsByColor: invalid dataRange, must be A1 or Range');
    }

    // ---- нормалізація таргетів кольорів ----
    const targets = Array.isArray(colorAddrs) ? colorAddrs.flat().filter(Boolean) : [colorAddrs];
    if (!targets.length) return 0;

    const colors = new Set();
    for (const tgt of targets) {
      // Прямий колір?
      if (isColorLiteral(tgt)) {
        colors.add(String(tgt).trim().toLowerCase());
        continue;
      }
      // Range-об’єкт?
      if (tgt && typeof tgt.getBackground === 'function') {
        colors.add(String(tgt.getBackground()).trim().toLowerCase());
        continue;
      }
      // A1-адреса (sheet!A1 дозволено)
      if (typeof tgt === 'string') {
        try {
          const p = splitSheetA1(tgt);
          const sh = ss.getSheetByName(p.sheetName) || dataSheet; // якщо не вказаний лист — використовуємо лист даних
          const col = sh.getRange(p.a1).getBackground();
          colors.add(String(col).trim().toLowerCase());
        } catch (_) {
          // пропустити невалідні адреси
        }
      }
    }
    if (!colors.size) return 0;

    // ---- обхід даних ----
    const bg = dataRange.getBackgrounds();
    let count = 0;
    for (let r = 0; r < bg.length; r++) {
      for (let c = 0; c < bg[r].length; c++) {
        if (colors.has(String(bg[r][c]).trim().toLowerCase())) count++;
      }
    }
    return count;
  } catch (e) {
    sendErrorNotification(e, 'countCellsByColor');
    return 'Помилка: ' + e.message;
  }
}

/** Розбір "Лист!A1:B2" або "A1:B2" => {sheetName, a1} */
function splitSheetA1(ref) {
  const s = String(ref).trim();
  const bang = s.indexOf('!');
  if (bang === -1) {
    return { sheetName: SpreadsheetApp.getActiveSheet().getName(), a1: s };
  }
  // підтримка назв листів у лапках 'My Sheet'!A1
  const sheetName = s.slice(0, bang).replace(/^'+|'+$/g, '');
  const a1 = s.slice(bang + 1);
  return { sheetName, a1 };
}

/** Дуже проста перевірка "це схоже на колір": "#abc" / "#a1b2c3" / "red" */
function isColorLiteral(x) {
  if (x == null) return false;
  const v = String(x).trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) || /^[a-z]+$/i.test(v);
}