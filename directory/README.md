# directory

Проєкт Google Apps Script для синхронізації днів народження між кадровим аркушем і Google Calendar.

Таблиця:

- [directory/directory.txt](directory/directory.txt)

Основні точки входу:

- `createOrUpdateBirthdaysFromSheet`

Структура файлів:

- `Config.gs`: константи проєкту й мапінг аркуша/календаря
- `Birthdays.gs`: workflow синхронізації та calendar helper-и

Файли та функції:

## `Config.gs`

- `BDAY_CFG`: id календаря, назва аркуша, мапінг колонок, шаблон заголовка.
- `BDAY_CFG.calendarId`: цільовий календар для запису подій. Для цього проєкту встановлено `BatLiPo66@gmail.com`.
- `BDAY_CFG.sheetName`: аркуш-джерело `Особисті данні` в активній таблиці.

## `Birthdays.gs`

- `createOrUpdateBirthdaysFromSheet`: синхронізує дні народження з аркуша в Calendar.
- `writeBirthdayEventId_`: зберігає id створеної події назад у аркуш.
- `findBirthdayEventForDay_`: знаходить подію з таким самим заголовком у конкретний день.
- `findCalendarEntryById_`: резолвить збережений id у подію або серію.
- `removeCalendarEntry_`: безпечно видаляє попередній запис календаря.
- `applyBirthdayColor_`: застосовує стандартний колір до події.
- `coerceToDate`: парсить значення аркуша у нормалізовану дату.

HTML-файли:

- У цьому проєкті HTML-файлів немає.

Примітки:

- Ідентифікатори подій зберігаються назад у аркуш для ідемпотентних оновлень.
- `coerceToDate` підтримує дати аркуша, серійні числа і типові текстові формати.
- Функція читає `SpreadsheetApp.getActive()`, тому запускати її треба з контексту потрібної таблиці `СПИСОК`.
- Для успішного запуску акаунт-виконавець скрипта має мати доступ на запис до календаря `BatLiPo66@gmail.com`.
