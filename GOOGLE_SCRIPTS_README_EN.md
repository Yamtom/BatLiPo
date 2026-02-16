# Google Apps Script for LiPo Battery Tracking

This document contains instructions for using Google Apps Script to track and manage LiPo battery data in Google Sheets.

## Overview

**BatteryTracker.gs** is a full-featured Google Sheets script that allows you to:
- Track multiple LiPo batteries
- Log charge/discharge cycles
- Calculate battery health
- Analyze usage statistics
- Export reports

## Installation

### Step 1: Create a new Google Sheet
1. Open [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it, for example "Battery Tracker"

### Step 2: Add the script
1. In the menu, select **Extensions** → **Apps Script**
2. Delete the existing code in the editor
3. Copy all code from the `BatteryTracker.gs` file
4. Paste the code into the editor
5. Click **Save project** (disk icon)
6. Name the project "Battery Tracker"

### Step 3: Authorization
1. Close the Apps Script editor
2. Refresh the Google Sheet (F5)
3. You will see a new menu **🔋 Battery Tracker**
4. On first use, you will need to grant permissions

## Usage

### Initialization

1. Select **🔋 Battery Tracker** → **Initialize Sheets**
2. This will create three sheets:
   - **Battery Data** - battery information
   - **Charge Log** - charge/discharge cycle log
   - **Statistics** - statistics

### Adding a new battery

1. Select **🔋 Battery Tracker** → **Add Battery**
2. Fill out the form:
   - **Battery ID** (required): Unique identifier (e.g., "BAT-001")
   - **Brand**: Manufacturer (e.g., "Turnigy", "Gens Ace")
   - **Model**: Battery model
   - **Cells (S)**: Number of cells (e.g., 3 for 3S)
   - **Capacity (mAh)** (required): Capacity (e.g., 2200)
   - **Nominal Voltage (V)**: Nominal voltage (auto-calculated if not specified)
   - **Notes**: Additional notes
3. Click **Add Battery**

### Logging a charge cycle

1. Select **🔋 Battery Tracker** → **Log Charge Cycle**
2. Fill in the data:
   - **Battery ID**: Select battery from list
   - **Start Voltage (V)**: Initial voltage
   - **End Voltage (V)**: Final voltage (usually max for your battery)
   - **Charged (mAh)**: How many mAh were charged
   - **Charge Rate (C)**: Charge rate (e.g., 1.0 = 1C)
   - **Temperature (°C)**: Temperature during charging (optional)
   - **Duration (min)**: Charge duration in minutes (optional)
   - **Notes**: Additional notes
3. Click **Log Charge**

### Logging a discharge cycle

1. Select **🔋 Battery Tracker** → **Log Discharge Cycle**
2. Fill out similar form with discharge data
3. Click **Log Discharge**

### Calculating statistics

1. Select **🔋 Battery Tracker** → **Calculate Statistics**
2. The script will analyze all logs and create statistics for each battery:
   - Total cycle count
   - Average capacity
   - Capacity trend (%)
   - Average charge rate
   - Average temperature
   - Estimated remaining cycles

### Updating battery health

1. Select **🔋 Battery Tracker** → **Update Battery Health**
2. The script calculates battery health based on the last 5 discharge cycles
3. Updates:
   - Current capacity
   - Health percentage
   - Status (Excellent/Good/Fair/Poor)

### Exporting a report

1. Select **🔋 Battery Tracker** → **Export Report**
2. A new "Report" sheet will be created with summary data

## Custom Formulas

The script also provides custom formulas for use in cells:

### CALCULATE_CELL_VOLTAGE
Calculates voltage per cell:
```
=CALCULATE_CELL_VOLTAGE(12.6, 3)
// Result: 4.20
```

### IS_VOLTAGE_SAFE
Checks if voltage is in safe range:
```
=IS_VOLTAGE_SAFE(12.6, 3, 3.0, 4.2)
// Result: TRUE or FALSE
```

### ESTIMATE_HEALTH
Estimates battery health as percentage:
```
=ESTIMATE_HEALTH(2000, 2200)
// Result: 91 (%)
```

## Data Structure

### Battery Data Sheet
- **Battery ID**: Unique identifier
- **Brand**: Manufacturer
- **Model**: Model
- **Cells (S)**: Number of cells
- **Capacity (mAh)**: Nominal capacity
- **Nominal Voltage (V)**: Nominal voltage
- **Max Voltage (V)**: Maximum voltage
- **Min Voltage (V)**: Minimum voltage
- **Purchase Date**: Date added
- **Cycle Count**: Number of cycles
- **Current Capacity (mAh)**: Current capacity
- **Health %**: Health percentage
- **Status**: Status (New/Excellent/Good/Fair/Poor)
- **Last Used**: Last use date
- **Notes**: Notes

### Charge Log Sheet
- **Log ID**: Unique log ID
- **Battery ID**: Battery ID
- **Date**: Date and time
- **Type**: Charge or Discharge
- **Start Voltage (V)**: Initial voltage
- **End Voltage (V)**: Final voltage
- **Charged/Discharged (mAh)**: Amount in mAh
- **Charge Rate (C)**: Rate in C
- **Temperature (°C)**: Temperature
- **Duration (min)**: Duration
- **Notes**: Notes

### Statistics Sheet
- **Battery ID**: Battery ID
- **Total Cycles**: Total cycle count
- **Avg Capacity (mAh)**: Average capacity
- **Capacity Trend (%)**: Capacity change trend
- **Avg Charge Rate (C)**: Average charge rate
- **Avg Temperature (°C)**: Average temperature
- **Last Health Check**: Last check date
- **Estimated Remaining Cycles**: Estimated remaining cycles

## Usage Recommendations

### LiPo Battery Safety
- **Minimum voltage per cell**: 3.0V (preferably not below 3.2V)
- **Maximum voltage per cell**: 4.2V
- **Nominal voltage per cell**: 3.7V
- **Storage voltage**: 3.8V per cell (approximately 50-60% charge)

### Battery Health
- **100-90%**: Excellent condition
- **89-80%**: Good condition
- **79-60%**: Fair condition
- **<60%**: Degraded battery, consider replacement

### Cycle Recommendations
- LiPo batteries are typically rated for 200-300 cycles
- Replacement recommended after 80% of initial capacity
- Store batteries at 3.8V per cell
- Avoid deep discharges (below 3.2V per cell)
- Charge at room temperature

## Extending Functionality

You can extend the script functionality by adding:
- Charts and visualizations
- Automatic check reminders
- Integration with other systems
- Email notifications for critical indicators
- PDF export

## Support and Development

For questions and suggestions, use GitHub Issues:
https://github.com/Yamtom/BatLiPo/issues

## License

This script is provided "as is" without any warranties. Use at your own risk.
