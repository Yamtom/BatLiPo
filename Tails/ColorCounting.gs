/** ===========================
 *  Color counting
 *  =========================== */

function countCellsByColor(rangeA, colorAddrs, dummy) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const toColorKey = value => String(value).trim().toLowerCase();

    let dataSheet = null;
    let dataRange = null;
    if (typeof rangeA === 'string') {
      const parsed = splitSheetA1(rangeA);
      dataSheet = ss.getSheetByName(parsed.sheetName) || ss.getActiveSheet();
      dataRange = dataSheet.getRange(parsed.a1);
    } else if (rangeA && typeof rangeA.getBackgrounds === 'function') {
      dataRange = rangeA;
      dataSheet = dataRange.getSheet();
    }

    if (!dataRange) {
      throw new Error('countCellsByColor: invalid dataRange, must be A1 or Range');
    }

    const targets = Array.isArray(colorAddrs) ? colorAddrs.flat().filter(Boolean) : [colorAddrs];
    if (!targets.length) return 0;

    const resolveA1Color = (a1Ref) => {
      const p = splitSheetA1(a1Ref);
      const sh = ss.getSheetByName(p.sheetName) || dataSheet;
      return sh.getRange(p.a1).getBackground();
    };

    const colors = new Set();
    targets.forEach(tgt => {
      if (isColorLiteral(tgt)) {
        colors.add(toColorKey(tgt));
        return;
      }

      if (tgt && typeof tgt.getBackground === 'function') {
        colors.add(toColorKey(tgt.getBackground()));
        return;
      }

      if (typeof tgt === 'string') {
        try {
          colors.add(toColorKey(resolveA1Color(tgt)));
        } catch (e) {
          Logger.log('countCellsByColor skipped target "' + tgt + '": ' + e.message);
        }
      }
    });

    if (!colors.size) return 0;

    const bg = dataRange.getBackgrounds();
    return bg.reduce((count, row) => {
      const rowCount = row.filter(color => colors.has(toColorKey(color))).length;
      return count + rowCount;
    }, 0);
  } catch (e) {
    sendErrorNotification(e, 'countCellsByColor');
    return 'Помилка: ' + e.message;
  }
}

function splitSheetA1(ref) {
  const s = String(ref).trim();
  const bang = s.indexOf('!');
  if (bang === -1) {
    return { sheetName: SpreadsheetApp.getActiveSheet().getName(), a1: s };
  }
  const sheetName = s.slice(0, bang).replace(/^'+|'+$/g, '');
  const a1 = s.slice(bang + 1);
  return { sheetName, a1 };
}

function isColorLiteral(x) {
  if (x == null) return false;
  const v = String(x).trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v) || /^[a-z]+$/i.test(v);
}