function updateReport() {
  const sh = getOrCreateSheet(SHEET_REPORT);
  sh.clearContents();

  const nemCount = safeCount(SHEET_NEMESIS, 2, 1);
  const lasarCount = safeCount(SHEET_LASAR, 2, 1);
  const total = nemCount + lasarCount;

  sh.getRange(1,1,4,2).setValues([
      ['Метрика','Значення'],
      ['Всього Nemesis', nemCount],
      ['Всього Lasar', lasarCount],
      ['РАЗОМ', total]
  ]);

  const log = getOrCreateSheet(SHEET_LOG);
  const lastRow = log.getLastRow();
  
  if (lastRow < 2) {
      sh.getRange(6,1).setValue('Журнал порожній');
      return;
  }
  
  const headers = log.getRange(1,1,1,log.getLastColumn()).getValues()[0];
  const idxTime = headers.indexOf('Час');
  const idxStatus = headers.indexOf('Статус');
  const idxWho = headers.indexOf('Хто');

  if (idxTime === -1) {
    sh.getRange(6, 1).setValue('У журналі відсутня колонка "Час"');
    return;
  }

  const data = log.getRange(2, 1, lastRow-1, log.getLastColumn()).getValues();
  const now = new Date();
  const days30 = 30 * 24 * 60 * 60 * 1000;

  let changes30 = 0;
  const statusCounts = Object.create(null);
  const operatorStats = Object.create(null);
  const bump = (bucket, key) => {
    bucket[key] = (bucket[key] || 0) + 1;
  };

  data.forEach(row => {
    const d = new Date(row[idxTime]);
    if (!isFinite(d.getTime())) return;

    if (now - d <= days30) {
       changes30++;
       if (idxWho !== -1) {
         const who = row[idxWho] || 'Не вказано';
         bump(operatorStats, who);
       }
    }

    if (idxStatus !== -1) {
      const st = row[idxStatus];
      if (st) bump(statusCounts, st);
    }
  });

  sh.getRange(6,1,2,2).setValues([
    ['Активність за 30 днів (кількість змін)', changes30],
    ['Середнє змін на день', (changes30/30).toFixed(2)]
  ]);

  let row = 9;
  sh.getRange(row, 1).setValue('Топ операторів (30 днів)').setFontWeight('bold');
  row++;

  const sortedOps = Object.entries(operatorStats).sort((a,b) => b[1] - a[1]);
  if (sortedOps.length) {
    sh.getRange(row, 1, sortedOps.length, 2).setValues(sortedOps);
    row += sortedOps.length + 1;
  } else {
    sh.getRange(row, 1).setValue('Немає даних');
    row += 2;
  }

  sh.getRange(row, 1).setValue('Використання статусів (Частота)').setFontWeight('bold');
  row++;
  const sortedSt = Object.entries(statusCounts).sort((a,b) => b[1] - a[1]);
  if (sortedSt.length) {
     sh.getRange(row, 1, sortedSt.length, 2).setValues(sortedSt);
  }
}

function safeCount(sheetName, fromRow, keyCol) {
  const sh = requireSheet_(sheetName);
  const last = sh.getLastRow();
  if (last < fromRow) return 0;
  const vals = sh.getRange(fromRow, keyCol, last - fromRow + 1, 1).getValues();
  return vals.filter(r => String(r[0]).trim() !== '').length;
}
