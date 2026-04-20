function getBoardIdFromRow_(sheetName, rowValues) {
  if (!rowValues) return '';
  if (sheetName === SHEET_LASAR) {
    const series = String(rowValues[COL_LASAR_SERIES - 1] || '').trim();
    const number = String(rowValues[COL_LASAR_NUMBER - 1] || '').trim();
    return series && number ? `${series}.${number}` : '';
  }
  if (sheetName === SHEET_NEMESIS) {
    return String(rowValues[COL_NEMESIS_ID - 1] || '').trim();
  }
  return '';
}

function buildStatusHistoryLine_(data) {
  const statusLine = `Статус: ${data.status}, Дата: ${data.changeDate}, Хто: ${data.changedBy}`;
  return data.description ? `${statusLine}, Опис: ${data.description}` : statusLine;
}

function getLatestBoardStatus_(cellValue) {
  const lines = String(cellValue || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
  if (!lines.length) return '';

  const lastLine = lines[lines.length - 1];
  const match = lastLine.match(/^Статус:\s*(.*?)(?:,\s*Дата:|$)/i);
  return match ? match[1].trim() : '';
}

function getLatestBoardStatusFromRow_(rowValues) {
  if (!Array.isArray(rowValues)) return '';
  const values = [...rowValues].reverse();
  return values.map(getLatestBoardStatus_).find(Boolean) || '';
}

function isLostBoardStatus_(status) {
  const normalized = String(status || '').trim().toLowerCase();
  return ['втрачений', 'lost', 'збито'].includes(normalized);
}

function makeColorMatrix_(numRows, width, color) {
  return Array.from({ length: numRows }, () => new Array(width).fill(color));
}