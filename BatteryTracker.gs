/**
 * Battery LiPo Tracker - Google Apps Script
 * 
 * This script provides functions for tracking and managing LiPo battery data
 * in Google Sheets, including charge/discharge cycles, health monitoring,
 * and data analysis.
 */

// Configuration constants
var CONFIG = {
  SHEET_NAME: 'Battery Data',
  LOG_SHEET_NAME: 'Charge Log',
  STATS_SHEET_NAME: 'Statistics',
  DATE_FORMAT: 'yyyy-MM-dd HH:mm:ss',
  VOLTAGE_PRECISION: 2,
  CAPACITY_PRECISION: 0
};

/**
 * Creates a custom menu when the spreadsheet opens
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🔋 Battery Tracker')
    .addItem('Initialize Sheets', 'initializeSheets')
    .addSeparator()
    .addItem('Add Battery', 'showAddBatteryDialog')
    .addItem('Log Charge Cycle', 'showLogChargeDialog')
    .addItem('Log Discharge Cycle', 'showLogDischargeDialog')
    .addSeparator()
    .addItem('Calculate Statistics', 'calculateStatistics')
    .addItem('Update Battery Health', 'updateBatteryHealth')
    .addSeparator()
    .addItem('Export Report', 'exportReport')
    .addToUi();
}

/**
 * Initializes the required sheets with proper headers
 */
function initializeSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create or get Battery Data sheet
  var batterySheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!batterySheet) {
    batterySheet = ss.insertSheet(CONFIG.SHEET_NAME);
    var headers = [
      'Battery ID', 'Brand', 'Model', 'Cells (S)', 'Capacity (mAh)', 
      'Nominal Voltage (V)', 'Max Voltage (V)', 'Min Voltage (V)',
      'Purchase Date', 'Cycle Count', 'Current Capacity (mAh)', 
      'Health %', 'Status', 'Last Used', 'Notes'
    ];
    batterySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    batterySheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#4285f4')
      .setFontColor('#ffffff');
    batterySheet.setFrozenRows(1);
  }
  
  // Create or get Charge Log sheet
  var logSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  if (!logSheet) {
    logSheet = ss.insertSheet(CONFIG.LOG_SHEET_NAME);
    var logHeaders = [
      'Log ID', 'Battery ID', 'Date', 'Type', 'Start Voltage (V)', 
      'End Voltage (V)', 'Charged/Discharged (mAh)', 'Charge Rate (C)',
      'Temperature (°C)', 'Duration (min)', 'Notes'
    ];
    logSheet.getRange(1, 1, 1, logHeaders.length).setValues([logHeaders]);
    logSheet.getRange(1, 1, 1, logHeaders.length)
      .setFontWeight('bold')
      .setBackground('#34a853')
      .setFontColor('#ffffff');
    logSheet.setFrozenRows(1);
  }
  
  // Create or get Statistics sheet
  var statsSheet = ss.getSheetByName(CONFIG.STATS_SHEET_NAME);
  if (!statsSheet) {
    statsSheet = ss.insertSheet(CONFIG.STATS_SHEET_NAME);
    var statsHeaders = [
      'Battery ID', 'Total Cycles', 'Avg Capacity (mAh)', 
      'Capacity Trend (%)', 'Avg Charge Rate (C)', 'Avg Temperature (°C)',
      'Last Health Check', 'Estimated Remaining Cycles'
    ];
    statsSheet.getRange(1, 1, 1, statsHeaders.length).setValues([statsHeaders]);
    statsSheet.getRange(1, 1, 1, statsHeaders.length)
      .setFontWeight('bold')
      .setBackground('#fbbc04')
      .setFontColor('#ffffff');
    statsSheet.setFrozenRows(1);
  }
  
  SpreadsheetApp.getUi().alert('Sheets initialized successfully!');
}

/**
 * Shows dialog to add a new battery
 */
function showAddBatteryDialog() {
  var html = HtmlService.createHtmlOutput(
    '<form>' +
    '<label>Battery ID:</label><input type="text" name="batteryId" required><br><br>' +
    '<label>Brand:</label><input type="text" name="brand"><br><br>' +
    '<label>Model:</label><input type="text" name="model"><br><br>' +
    '<label>Cells (S):</label><input type="number" name="cells" value="3"><br><br>' +
    '<label>Capacity (mAh):</label><input type="number" name="capacity" required><br><br>' +
    '<label>Nominal Voltage (V):</label><input type="number" step="0.01" name="nominalVoltage"><br><br>' +
    '<label>Notes:</label><textarea name="notes"></textarea><br><br>' +
    '<button type="button" onclick="google.script.host.close()">Cancel</button>' +
    '<button type="button" onclick="submitBattery()">Add Battery</button>' +
    '<script>' +
    'function submitBattery() {' +
    '  var form = document.querySelector("form");' +
    '  var data = {' +
    '    batteryId: form.batteryId.value,' +
    '    brand: form.brand.value,' +
    '    model: form.model.value,' +
    '    cells: parseInt(form.cells.value),' +
    '    capacity: parseInt(form.capacity.value),' +
    '    nominalVoltage: parseFloat(form.nominalVoltage.value),' +
    '    notes: form.notes.value' +
    '  };' +
    '  google.script.run.withSuccessHandler(function() {' +
    '    google.script.host.close();' +
    '  }).addBattery(data);' +
    '}' +
    '</script>' +
    '</form>'
  ).setWidth(400).setHeight(450);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Add New Battery');
}

/**
 * Adds a new battery to the tracking sheet
 */
function addBattery(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    initializeSheets();
    sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  }
  
  var cells = data.cells || 3;
  var maxVoltage = cells * 4.2;
  var minVoltage = cells * 3.0;
  var nominalVoltage = data.nominalVoltage || (cells * 3.7);
  
  var newRow = [
    data.batteryId,
    data.brand || '',
    data.model || '',
    cells,
    data.capacity,
    nominalVoltage,
    maxVoltage,
    minVoltage,
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), CONFIG.DATE_FORMAT),
    0, // Initial cycle count
    data.capacity, // Initial capacity equals nominal
    100, // 100% health
    'New',
    '',
    data.notes || ''
  ];
  
  sheet.appendRow(newRow);
  SpreadsheetApp.getActiveSpreadsheet().toast('Battery added successfully!', 'Success');
}

/**
 * Shows dialog to log a charge cycle
 */
function showLogChargeDialog() {
  var batteries = getBatteryList();
  var options = batteries.map(function(b) { 
    return '<option value="' + b + '">' + b + '</option>'; 
  }).join('');
  
  var html = HtmlService.createHtmlOutput(
    '<form>' +
    '<label>Battery ID:</label><select name="batteryId" required>' + options + '</select><br><br>' +
    '<label>Start Voltage (V):</label><input type="number" step="0.01" name="startVoltage" required><br><br>' +
    '<label>End Voltage (V):</label><input type="number" step="0.01" name="endVoltage" required><br><br>' +
    '<label>Charged (mAh):</label><input type="number" name="charged" required><br><br>' +
    '<label>Charge Rate (C):</label><input type="number" step="0.1" name="chargeRate" value="1.0"><br><br>' +
    '<label>Temperature (°C):</label><input type="number" name="temperature"><br><br>' +
    '<label>Duration (min):</label><input type="number" name="duration"><br><br>' +
    '<label>Notes:</label><textarea name="notes"></textarea><br><br>' +
    '<button type="button" onclick="google.script.host.close()">Cancel</button>' +
    '<button type="button" onclick="submitCharge()">Log Charge</button>' +
    '<script>' +
    'function submitCharge() {' +
    '  var form = document.querySelector("form");' +
    '  var data = {' +
    '    batteryId: form.batteryId.value,' +
    '    startVoltage: parseFloat(form.startVoltage.value),' +
    '    endVoltage: parseFloat(form.endVoltage.value),' +
    '    charged: parseInt(form.charged.value),' +
    '    chargeRate: parseFloat(form.chargeRate.value),' +
    '    temperature: form.temperature.value ? parseFloat(form.temperature.value) : "",' +
    '    duration: form.duration.value ? parseInt(form.duration.value) : "",' +
    '    notes: form.notes.value' +
    '  };' +
    '  google.script.run.withSuccessHandler(function() {' +
    '    google.script.host.close();' +
    '  }).logChargeCycle(data);' +
    '}' +
    '</script>' +
    '</form>'
  ).setWidth(400).setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Log Charge Cycle');
}

/**
 * Shows dialog to log a discharge cycle
 */
function showLogDischargeDialog() {
  var batteries = getBatteryList();
  var options = batteries.map(function(b) { 
    return '<option value="' + b + '">' + b + '</option>'; 
  }).join('');
  
  var html = HtmlService.createHtmlOutput(
    '<form>' +
    '<label>Battery ID:</label><select name="batteryId" required>' + options + '</select><br><br>' +
    '<label>Start Voltage (V):</label><input type="number" step="0.01" name="startVoltage" required><br><br>' +
    '<label>End Voltage (V):</label><input type="number" step="0.01" name="endVoltage" required><br><br>' +
    '<label>Discharged (mAh):</label><input type="number" name="discharged" required><br><br>' +
    '<label>Discharge Rate (C):</label><input type="number" step="0.1" name="dischargeRate" value="1.0"><br><br>' +
    '<label>Temperature (°C):</label><input type="number" name="temperature"><br><br>' +
    '<label>Duration (min):</label><input type="number" name="duration"><br><br>' +
    '<label>Notes:</label><textarea name="notes"></textarea><br><br>' +
    '<button type="button" onclick="google.script.host.close()">Cancel</button>' +
    '<button type="button" onclick="submitDischarge()">Log Discharge</button>' +
    '<script>' +
    'function submitDischarge() {' +
    '  var form = document.querySelector("form");' +
    '  var data = {' +
    '    batteryId: form.batteryId.value,' +
    '    startVoltage: parseFloat(form.startVoltage.value),' +
    '    endVoltage: parseFloat(form.endVoltage.value),' +
    '    discharged: parseInt(form.discharged.value),' +
    '    dischargeRate: parseFloat(form.dischargeRate.value),' +
    '    temperature: form.temperature.value ? parseFloat(form.temperature.value) : "",' +
    '    duration: form.duration.value ? parseInt(form.duration.value) : "",' +
    '    notes: form.notes.value' +
    '  };' +
    '  google.script.run.withSuccessHandler(function() {' +
    '    google.script.host.close();' +
    '  }).logDischargeCycle(data);' +
    '}' +
    '</script>' +
    '</form>'
  ).setWidth(400).setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'Log Discharge Cycle');
}

/**
 * Logs a charge cycle
 */
function logChargeCycle(data) {
  logCycle(data, 'Charge');
}

/**
 * Logs a discharge cycle
 */
function logDischargeCycle(data) {
  logCycle(data, 'Discharge');
}

/**
 * Internal function to log a cycle
 */
function logCycle(data, type) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  
  if (!logSheet) {
    initializeSheets();
    logSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  }
  
  var logId = 'LOG-' + new Date().getTime();
  var amount = type === 'Charge' ? data.charged : data.discharged;
  var rate = type === 'Charge' ? data.chargeRate : data.dischargeRate;
  
  var newLog = [
    logId,
    data.batteryId,
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), CONFIG.DATE_FORMAT),
    type,
    data.startVoltage,
    data.endVoltage,
    amount,
    rate,
    data.temperature || '',
    data.duration || '',
    data.notes || ''
  ];
  
  logSheet.appendRow(newLog);
  
  // Update battery cycle count and last used date
  updateBatteryCycleCount(data.batteryId);
  
  SpreadsheetApp.getActiveSpreadsheet().toast('Cycle logged successfully!', 'Success');
}

/**
 * Updates the cycle count for a battery
 */
function updateBatteryCycleCount(batteryId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var batterySheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  var data = batterySheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === batteryId) {
      var currentCycles = data[i][9] || 0;
      batterySheet.getRange(i + 1, 10).setValue(currentCycles + 1);
      batterySheet.getRange(i + 1, 14).setValue(
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), CONFIG.DATE_FORMAT)
      );
      break;
    }
  }
}

/**
 * Gets list of battery IDs
 */
function getBatteryList() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    return [];
  }
  
  var data = sheet.getDataRange().getValues();
  var batteries = [];
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      batteries.push(data[i][0]);
    }
  }
  
  return batteries;
}

/**
 * Calculates and updates statistics for all batteries
 */
function calculateStatistics() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  var statsSheet = ss.getSheetByName(CONFIG.STATS_SHEET_NAME);
  
  if (!logSheet || !statsSheet) {
    SpreadsheetApp.getUi().alert('Please initialize sheets first!');
    return;
  }
  
  var logData = logSheet.getDataRange().getValues();
  var batteries = getBatteryList();
  
  // Clear existing stats (keep header)
  if (statsSheet.getLastRow() > 1) {
    statsSheet.deleteRows(2, statsSheet.getLastRow() - 1);
  }
  
  batteries.forEach(function(batteryId) {
    var cycles = logData.filter(function(row) { 
      return row[1] === batteryId; 
    });
    
    if (cycles.length === 0) return;
    
    var totalCycles = cycles.length;
    var capacities = cycles.map(function(c) { return c[6]; }).filter(function(c) { return c; });
    var avgCapacity = capacities.reduce(function(a, b) { return a + b; }, 0) / capacities.length;
    
    var chargeRates = cycles.map(function(c) { return c[7]; }).filter(function(c) { return c; });
    var avgChargeRate = chargeRates.length > 0 ? 
      chargeRates.reduce(function(a, b) { return a + b; }, 0) / chargeRates.length : 0;
    
    var temps = cycles.map(function(c) { return c[8]; }).filter(function(c) { return c; });
    var avgTemp = temps.length > 0 ? 
      temps.reduce(function(a, b) { return a + b; }, 0) / temps.length : 0;
    
    // Calculate capacity trend (simplified)
    var capacityTrend = capacities.length > 1 ? 
      ((capacities[capacities.length - 1] - capacities[0]) / capacities[0] * 100).toFixed(2) : 0;
    
    // Estimate remaining cycles (assuming 80% capacity at 300 cycles for LiPo)
    var estimatedRemaining = Math.max(0, 300 - totalCycles);
    
    var statsRow = [
      batteryId,
      totalCycles,
      Math.round(avgCapacity),
      capacityTrend,
      avgChargeRate.toFixed(2),
      avgTemp ? avgTemp.toFixed(1) : '',
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), CONFIG.DATE_FORMAT),
      estimatedRemaining
    ];
    
    statsSheet.appendRow(statsRow);
  });
  
  SpreadsheetApp.getActiveSpreadsheet().toast('Statistics calculated successfully!', 'Success');
}

/**
 * Updates battery health based on current capacity vs nominal capacity
 */
function updateBatteryHealth() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var batterySheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  var logSheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  
  if (!batterySheet || !logSheet) {
    SpreadsheetApp.getUi().alert('Please initialize sheets first!');
    return;
  }
  
  var batteryData = batterySheet.getDataRange().getValues();
  var logData = logSheet.getDataRange().getValues();
  
  for (var i = 1; i < batteryData.length; i++) {
    var batteryId = batteryData[i][0];
    var nominalCapacity = batteryData[i][4];
    
    // Get recent discharge cycles for this battery
    var recentDischarges = logData.filter(function(row) {
      return row[1] === batteryId && row[3] === 'Discharge';
    }).slice(-5); // Last 5 discharge cycles
    
    if (recentDischarges.length > 0) {
      var capacities = recentDischarges.map(function(row) { return row[6]; });
      var avgRecentCapacity = capacities.reduce(function(a, b) { return a + b; }, 0) / capacities.length;
      var health = Math.round((avgRecentCapacity / nominalCapacity) * 100);
      
      // Update current capacity and health
      batterySheet.getRange(i + 1, 11).setValue(Math.round(avgRecentCapacity));
      batterySheet.getRange(i + 1, 12).setValue(health);
      
      // Update status based on health
      var status = health >= 90 ? 'Excellent' : 
                   health >= 80 ? 'Good' : 
                   health >= 60 ? 'Fair' : 'Poor';
      batterySheet.getRange(i + 1, 13).setValue(status);
    }
  }
  
  SpreadsheetApp.getActiveSpreadsheet().toast('Battery health updated!', 'Success');
}

/**
 * Exports a summary report
 */
function exportReport() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var batterySheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  var statsSheet = ss.getSheetByName(CONFIG.STATS_SHEET_NAME);
  
  if (!batterySheet) {
    SpreadsheetApp.getUi().alert('No data to export!');
    return;
  }
  
  var reportSheet = ss.getSheetByName('Report');
  if (reportSheet) {
    ss.deleteSheet(reportSheet);
  }
  
  reportSheet = ss.insertSheet('Report');
  
  // Add title
  reportSheet.getRange('A1').setValue('Battery LiPo Tracking Report');
  reportSheet.getRange('A1').setFontSize(16).setFontWeight('bold');
  reportSheet.getRange('A2').setValue('Generated: ' + new Date().toLocaleString());
  
  // Copy battery summary
  reportSheet.getRange('A4').setValue('Battery Summary');
  reportSheet.getRange('A4').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  
  var batteryData = batterySheet.getDataRange().getValues();
  if (batteryData.length > 1) {
    reportSheet.getRange(5, 1, batteryData.length, batteryData[0].length)
      .setValues(batteryData);
  }
  
  // Copy statistics if available
  if (statsSheet) {
    var statsData = statsSheet.getDataRange().getValues();
    var statsStartRow = 5 + batteryData.length + 2;
    
    reportSheet.getRange(statsStartRow, 1).setValue('Statistics');
    reportSheet.getRange(statsStartRow, 1).setFontWeight('bold')
      .setBackground('#fbbc04').setFontColor('#ffffff');
    
    if (statsData.length > 1) {
      reportSheet.getRange(statsStartRow + 1, 1, statsData.length, statsData[0].length)
        .setValues(statsData);
    }
  }
  
  reportSheet.autoResizeColumns(1, reportSheet.getLastColumn());
  
  SpreadsheetApp.getActiveSpreadsheet().toast('Report generated in "Report" sheet!', 'Success');
}

/**
 * Custom formula to calculate battery cell voltage
 * Usage: =CALCULATE_CELL_VOLTAGE(totalVoltage, cellCount)
 */
function CALCULATE_CELL_VOLTAGE(totalVoltage, cellCount) {
  if (!totalVoltage || !cellCount || cellCount === 0) {
    return '#ERROR';
  }
  return (totalVoltage / cellCount).toFixed(CONFIG.VOLTAGE_PRECISION);
}

/**
 * Custom formula to check if voltage is safe
 * Usage: =IS_VOLTAGE_SAFE(voltage, cellCount, minPerCell, maxPerCell)
 */
function IS_VOLTAGE_SAFE(voltage, cellCount, minPerCell, maxPerCell) {
  minPerCell = minPerCell || 3.0;
  maxPerCell = maxPerCell || 4.2;
  
  var cellVoltage = voltage / cellCount;
  return cellVoltage >= minPerCell && cellVoltage <= maxPerCell;
}

/**
 * Custom formula to estimate battery health percentage
 * Usage: =ESTIMATE_HEALTH(currentCapacity, nominalCapacity)
 */
function ESTIMATE_HEALTH(currentCapacity, nominalCapacity) {
  if (!currentCapacity || !nominalCapacity || nominalCapacity === 0) {
    return '#ERROR';
  }
  return Math.round((currentCapacity / nominalCapacity) * 100);
}
