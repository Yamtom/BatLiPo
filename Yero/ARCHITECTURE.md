# Архітектура системи / System Architecture

## Огляд компонентів / Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Google Sheets                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              🔋 Battery Tracker Menu                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Battery    │  │  Charge Log  │  │  Statistics  │    │
│  │     Data     │  │    Sheet     │  │    Sheet     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         BatteryTracker.gs (Apps Script)             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │   │
│  │  │   Menu   │  │  Dialogs │  │  Data Processing │  │   │
│  │  │ Functions│  │    UI    │  │    & Analysis    │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Потік даних / Data Flow

### 1. Додавання батареї / Adding a Battery
```
User → Menu → Add Battery Dialog → addBattery() → Battery Data Sheet
                                        ↓
                            Розрахунок max/min voltage
                            Calculate max/min voltage
                                        ↓
                            Ініціалізація з 100% здоров'я
                            Initialize with 100% health
```

### 2. Логування циклу / Logging a Cycle
```
User → Menu → Log Cycle Dialog → logChargeCycle() / logDischargeCycle()
                                        ↓
                            Збереження в Charge Log
                            Save to Charge Log
                                        ↓
                            Оновлення Cycle Count
                            Update Cycle Count
                                        ↓
                            Оновлення Last Used Date
                            Update Last Used Date
```

### 3. Розрахунок статистики / Calculating Statistics
```
User → Menu → Calculate Statistics → calculateStatistics()
                                        ↓
                            Читання всіх логів
                            Read all logs
                                        ↓
                            Групування по Battery ID
                            Group by Battery ID
                                        ↓
                            Розрахунок метрик
                            Calculate metrics
                                        ↓
                            Запис у Statistics Sheet
                            Write to Statistics Sheet
```

### 4. Оновлення здоров'я / Updating Health
```
User → Menu → Update Battery Health → updateBatteryHealth()
                                        ↓
                            Читання останніх 5 циклів розряду
                            Read last 5 discharge cycles
                                        ↓
                            Розрахунок середньої ємності
                            Calculate average capacity
                                        ↓
                            Health % = (Current / Nominal) × 100
                                        ↓
                            Оновлення Status (Excellent/Good/Fair/Poor)
                            Update Status
```

## Структура даних / Data Structure

```
Battery Data Sheet
├── Battery ID (Primary Key)
├── Specifications
│   ├── Brand, Model
│   ├── Cells (S)
│   ├── Capacity (mAh)
│   └── Voltages (Nominal, Max, Min)
├── Health Metrics
│   ├── Cycle Count
│   ├── Current Capacity (mAh)
│   ├── Health %
│   └── Status
└── Metadata
    ├── Purchase Date
    ├── Last Used
    └── Notes

Charge Log Sheet
├── Log ID (Auto-generated)
├── Battery ID (Foreign Key)
├── Cycle Data
│   ├── Date, Type (Charge/Discharge)
│   ├── Start/End Voltage
│   ├── Amount (mAh)
│   └── Rate (C)
└── Environmental
    ├── Temperature (°C)
    ├── Duration (min)
    └── Notes

Statistics Sheet
├── Battery ID (Foreign Key)
├── Aggregated Metrics
│   ├── Total Cycles
│   ├── Average Capacity
│   ├── Capacity Trend
│   ├── Average Charge Rate
│   └── Average Temperature
└── Projections
    ├── Last Health Check
    └── Estimated Remaining Cycles
```

## Функції та їх призначення / Functions and Their Purpose

### Core Functions (Основні функції)

| Функція / Function | Призначення / Purpose |
|--------------------|----------------------|
| `onOpen()` | Створює меню при відкритті таблиці / Creates menu on sheet open |
| `initializeSheets()` | Ініціалізує структуру аркушів / Initializes sheet structure |
| `addBattery()` | Додає нову батарею / Adds new battery |
| `logChargeCycle()` | Логує цикл заряду / Logs charge cycle |
| `logDischargeCycle()` | Логує цикл розряду / Logs discharge cycle |
| `calculateStatistics()` | Розраховує статистику / Calculates statistics |
| `updateBatteryHealth()` | Оновлює здоров'я батарей / Updates battery health |
| `exportReport()` | Експортує звіт / Exports report |

### UI Functions (Функції інтерфейсу)

| Функція / Function | Призначення / Purpose |
|--------------------|----------------------|
| `showAddBatteryDialog()` | Показує діалог додавання батареї / Shows add battery dialog |
| `showLogChargeDialog()` | Показує діалог логування заряду / Shows charge log dialog |
| `showLogDischargeDialog()` | Показує діалог логування розряду / Shows discharge log dialog |

### Utility Functions (Допоміжні функції)

| Функція / Function | Призначення / Purpose |
|--------------------|----------------------|
| `getBatteryList()` | Отримує список ID батарей / Gets list of battery IDs |
| `updateBatteryCycleCount()` | Оновлює лічильник циклів / Updates cycle count |
| `logCycle()` | Внутрішня функція логування / Internal logging function |

### Custom Formulas (Користувацькі формули)

| Формула / Formula | Призначення / Purpose |
|-------------------|----------------------|
| `CALCULATE_CELL_VOLTAGE()` | Розраховує напругу на комірку / Calculates cell voltage |
| `IS_VOLTAGE_SAFE()` | Перевіряє безпеку напруги / Checks voltage safety |
| `ESTIMATE_HEALTH()` | Оцінює здоров'я батареї / Estimates battery health |

## Безпека та валідація / Security and Validation

```
Input Validation
├── Battery ID: Required, Unique
├── Capacity: Required, Positive Number
├── Voltages: Must be within safe ranges
└── Cells: Positive Integer

Data Integrity
├── Foreign Key: Battery ID must exist
├── Date Format: Consistent timestamp format
└── Numeric Precision: Fixed decimal places

Safety Checks
├── Voltage Range: 3.0V - 4.2V per cell
├── Temperature: Warning if > 45°C
└── Health: Alert if < 60%
```

## Розширення / Extensions

### Можливі додатки / Possible Extensions

1. **Графіки та візуалізація / Charts and Visualization**
   - Графік деградації ємності / Capacity degradation chart
   - Температурні тренди / Temperature trends
   - Порівняння батарей / Battery comparison

2. **Автоматизація / Automation**
   - Щоденні нагадування / Daily reminders
   - Email сповіщення / Email notifications
   - Автоматичний розрахунок статистики / Auto-calculate statistics

3. **Інтеграція / Integration**
   - Експорт в PDF / Export to PDF
   - Синхронізація з іншими системами / Sync with other systems
   - API для зовнішнього доступу / API for external access

4. **Аналітика / Analytics**
   - Машинне навчання для прогнозування / ML for predictions
   - Аномалії в даних / Data anomaly detection
   - Оптимізація використання / Usage optimization

## Технічні деталі / Technical Details

### APIs Використані / APIs Used
- Google Sheets API
- Google Apps Script Services
- Utilities API (Dates, Formatting)
- UI Service (Dialogs, Menus)

### Обмеження / Limitations
- Максимум 6 хвилин виконання скрипта / Max 6 minutes script execution
- Денний ліміт на API запити / Daily API quota limits
- Розмір HTML діалогів обмежений / HTML dialog size limited

### Оптимізація / Optimization
- Пакетне читання/запис даних / Batch read/write operations
- Кешування списків батарей / Cache battery lists
- Мінімізація звернень до API / Minimize API calls
