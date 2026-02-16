# Швидка інструкція по встановленню / Quick Installation Guide

## Українська

### 1. Створіть Google Таблицю
1. Перейдіть на https://sheets.google.com
2. Натисніть "+ Порожня таблиця" або "Blank spreadsheet"
3. Назвіть таблицю "Battery Tracker" або будь-яку іншу назву

### 2. Відкрийте редактор скриптів
1. У меню виберіть **Розширення** → **Apps Script**
2. Відкриється новий редактор з порожнім файлом `Code.gs`

### 3. Додайте код
1. Відкрийте файл `BatteryTracker.gs` з цього репозиторію
2. Скопіюйте весь код (Ctrl+A, Ctrl+C)
3. Поверніться до редактора Apps Script
4. Видаліть весь існуючий код у `Code.gs`
5. Вставте скопійований код (Ctrl+V)

### 4. Збережіть проект
1. Натисніть іконку дискети або Ctrl+S
2. Назвіть проект "Battery Tracker"
3. Натисніть "OK"

### 5. Закрийте редактор та оновіть таблицю
1. Закрийте вкладку з редактором Apps Script
2. Поверніться до Google Таблиці
3. Оновіть сторінку (F5 або Ctrl+R)

### 6. Авторизуйте скрипт
1. Ви побачите нове меню **🔋 Battery Tracker**
2. Натисніть на нього та виберіть будь-яку опцію (наприклад, "Initialize Sheets")
3. Система попросить вас авторизувати скрипт:
   - Натисніть "Continue" або "Продовжити"
   - Виберіть свій Google акаунт
   - Натисніть "Advanced" або "Додатково" (якщо з'явиться попередження)
   - Натисніть "Go to Battery Tracker (unsafe)" або "Перейти до Battery Tracker"
   - Натисніть "Allow" або "Дозволити"

### 7. Почніть використовувати!
1. Виберіть **🔋 Battery Tracker** → **Initialize Sheets**
2. Додайте свою першу батарею: **🔋 Battery Tracker** → **Add Battery**
3. Читайте повну документацію в `GOOGLE_SCRIPTS_README.md`

---

## English

### 1. Create a Google Sheet
1. Go to https://sheets.google.com
2. Click "+ Blank spreadsheet"
3. Name the spreadsheet "Battery Tracker" or any other name

### 2. Open Script Editor
1. In the menu, select **Extensions** → **Apps Script**
2. A new editor will open with an empty `Code.gs` file

### 3. Add the Code
1. Open the `BatteryTracker.gs` file from this repository
2. Copy all the code (Ctrl+A, Ctrl+C)
3. Return to the Apps Script editor
4. Delete all existing code in `Code.gs`
5. Paste the copied code (Ctrl+V)

### 4. Save the Project
1. Click the disk icon or press Ctrl+S
2. Name the project "Battery Tracker"
3. Click "OK"

### 5. Close the Editor and Refresh the Sheet
1. Close the Apps Script editor tab
2. Return to the Google Sheet
3. Refresh the page (F5 or Ctrl+R)

### 6. Authorize the Script
1. You will see a new menu **🔋 Battery Tracker**
2. Click on it and select any option (e.g., "Initialize Sheets")
3. The system will ask you to authorize the script:
   - Click "Continue"
   - Select your Google account
   - Click "Advanced" (if a warning appears)
   - Click "Go to Battery Tracker (unsafe)"
   - Click "Allow"

### 7. Start Using!
1. Select **🔋 Battery Tracker** → **Initialize Sheets**
2. Add your first battery: **🔋 Battery Tracker** → **Add Battery**
3. Read the full documentation in `GOOGLE_SCRIPTS_README_EN.md`

---

## Скріншоти / Screenshots

### Меню в Google Таблиці / Menu in Google Sheets
```
🔋 Battery Tracker
├── Initialize Sheets
├── ─────────────────
├── Add Battery
├── Log Charge Cycle
├── Log Discharge Cycle
├── ─────────────────
├── Calculate Statistics
├── Update Battery Health
├── ─────────────────
└── Export Report
```

### Діалог додавання батареї / Add Battery Dialog
```
┌─────────────────────────────┐
│ Add New Battery             │
├─────────────────────────────┤
│ Battery ID: [BAT-001]       │
│ Brand: [Turnigy]            │
│ Model: [2200mAh]            │
│ Cells (S): [3]              │
│ Capacity (mAh): [2200]      │
│ Nominal Voltage (V): [11.1] │
│ Notes: [Primary pack]       │
│                             │
│ [Cancel] [Add Battery]      │
└─────────────────────────────┘
```

## Поради з усунення проблем / Troubleshooting

### Не бачу меню "🔋 Battery Tracker"
- Оновіть сторінку (F5)
- Перевірте, чи ви зберегли скрипт
- Закрийте і відкрийте таблицю знову

### Помилка авторизації
- Переконайтеся, що ви увійшли в Google акаунт
- Спробуйте в режимі інкогніто/приватному режимі
- Очистіть кеш браузера

### Скрипт не працює
- Перевірте консоль помилок: **Extensions** → **Apps Script** → **View** → **Logs**
- Переконайтеся, що код скопійовано повністю
- Спробуйте створити нову таблицю і скрипт заново

### Дані не зберігаються
- Переконайтеся, що ви натиснули "Save" або "Add Battery"
- Перевірте, чи ініціалізовані аркуші (Initialize Sheets)
- Перегляньте консоль помилок

## Корисні посилання / Useful Links

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [BatLiPo Repository](https://github.com/Yamtom/BatLiPo)
- [Report Issues](https://github.com/Yamtom/BatLiPo/issues)
