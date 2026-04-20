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

Дерево викликів:

1. `createOrUpdateBirthdaysFromSheet`
Дочірні: `coerceToDate`, `findBirthdayEventForDay_`, `findCalendarEntryById_`, `removeCalendarEntry_`, `applyBirthdayColor_`, `writeBirthdayEventId_`.

2. `findCalendarEntryById_`
Дочірні: Calendar API (`getEventSeriesById`, `getEventById`).

3. `removeCalendarEntry_`
Дочірні: Calendar API (`deleteEventSeries`, `deleteEvent`) із безпечною обробкою помилок.

Примітки:

- Ідентифікатори подій зберігаються назад у аркуш для ідемпотентних оновлень.
- `coerceToDate` підтримує дати аркуша, серійні числа і типові текстові формати.
