# tails

Проєкт Google Apps Script для графіків, підрахунків за кольором, інтеграцій і операторських інструментів.

Таблиця:

- [tails/tails.txt](tails/tails.txt)

Основні точки входу:

- `onOpen` in `TriggerMenu.gs`
- `refreshAll` і `colorCells` для оновлення графіка
- `showSidebar` для генерації SMS
- `syncAllChunked` для синхронізації нотаток із Google Calendar

Структура файлів:

- `Config.gs`: runtime-конфіг, що завантажується з Script Properties
- `Runtime.gs`: debounce, toast-повідомлення, нотифікація помилок
- `DateParsing.gs`: парсинг дат графіка
- `FormulaSearch.gs`: helper пошуку формул
- `ScheduleColoring.gs`: workflow фарбування заголовків
- `ColorCounting.gs`: підрахунки за кольором і парсинг діапазонів
- `FormulaRefresh.gs`: orchestration оновлення формул
- `ShiftValidation.gs`: правила валідації й умовного форматування
- `FairnessMetrics.gs`: вивід місячних метрик справедливості
- `DayBalancing.gs`: балансування навантаження на один день
- `TriggerMenu.gs`: меню, install hook, налаштування тригерів
- `CalendarNotesSync.gs`: інтеграція синхронізації нотаток календаря
- `SmsSidebar.gs`: генерація тексту sidebar і відправка email
- `SettingsSheet.gs`: ініціалізація аркуша налаштувань
- `CountByColor.gs`: кастомна функція таблиці
- `Sidebar.html`: UI sidebar

Файли та функції:

## `Config.gs`

- `loadConfig`: завантажує runtime-конфіг із Script Properties.
- `reloadConfig`: оновлює глобальний об'єкт конфігу.

## `Runtime.gs`

- `shouldRunDebounced`: блокує повторний запуск тригера за ключем.
- `sendErrorNotification`: логує помилку і за потреби надсилає email.
- `toast`: показує коротке повідомлення в таблиці.

## `DateParsing.gs`

- `parseDate`: парсить дату графіка у нормалізований Date.

## `FormulaSearch.gs`

- `getCellsWithFormula`: знаходить формули з цільовим текстом.

## `ScheduleColoring.gs`

- `colorCells`: перефарбовує заголовки на всіх конфігурованих аркушах.
- `colorHeadersForSheet`: фарбує один аркуш за минуле/сьогодні/майбутнє.

## `ColorCounting.gs`

- `countCellsByColor`: рахує клітинки з одним або кількома кольорами.
- `splitSheetA1`: парсить посилання `Sheet!A1`.
- `isColorLiteral`: визначає колірний літерал.

## `FormulaRefresh.gs`

- `refreshColorCountsActiveSheet`: перезаписує count-by-color формули на аркуші.
- `refreshAll`: оновлює фарбування заголовків і формули підрахунку.
- `refreshCells`: оновлює формули за цільовим маркером.

## `ShiftValidation.gs`

- `setupValidationActiveSheet`: застосовує валідацію на активному аркуші.
- `setupValidationAllSheets`: застосовує валідацію на всіх конфігурованих аркушах.
- `applyShiftCodeValidationForSheet_`: ставить правила валідації і форматування.
- `buildAllowedRegexInner_`: будує regex із дозволених кодів змін.
- `escapeRegex_`: екранує спецсимволи regex.
- `escapeForSheetRegex_`: екранує regex для формули аркуша.
- `isShiftValidationRule_`: виявляє вже наявне відповідне правило.

## `FairnessMetrics.gs`

- `updateFairnessMetrics`: перебудовує місячний аркуш метрик справедливості.
- `NIGHT_CODES`: перелік кодів, що вважаються нічними змінами.

## `DayBalancing.gs`

- `autoBalanceDay`: заповнює один день найменш завантаженими людьми.

## `TriggerMenu.gs`

- `clearTriggersByFns`: видаляє тригери за назвами handler-функцій.
- `createDailyTrigger`: перевстановлює щоденний тригер фарбування заголовків.
- `onOpen`: формує меню інструментів і GCAL sync.
- `onInstall`: ініціалізує меню і щоденний тригер при встановленні.
- `applyFreeze`: фіксує стандартні рядки й колонки.

## `CalendarNotesSync.gs`

- `onEdit`: оновлює нотатку для відредагованої клітинки дати.
- `syncAllChunked`: синхронізує нотатки по аркушах із відновленням стану.
- `ensureConfigSheet`: створює аркуш GCAL-конфігурації.
- `readConfig`: читає GCAL-конфіг із аркуша.
- `isSheetAllowed`: перевіряє аркуш за whitelist.
- `upsertNote`: записує або очищає керовану нотатку.
- `coerceToDate`: парсить дату зі значення клітинки.
- `buildNote`: форматує події одного дня у текст нотатки.

## `SmsSidebar.gs`

- `showSidebar`: відкриває SMS sidebar.
- `getHeaders`: повертає заголовки активного аркуша.
- `hasValue`: перевіряє клітинку рядка на непорожнє значення.
- `formatRow`: збирає один SMS-рядок з даних рядка.
- `findLastRowInColumnA`: знаходить останній заповнений рядок у колонці A.
- `generateMessage`: формує повний SMS-текст за вибраними колонками.
- `sendEmail`: надсилає згенерований SMS-текст на email.

## `SettingsSheet.gs`

- `ensureSettingsSheet`: створює і заповнює аркуш налаштувань.

## `CountByColor.gs`

- `COUNTBYCOLOR`: кастомна функція підрахунку за кольором.

## `Sidebar.html`

- Призначення: клієнтський UI для генерації SMS, копіювання, збереження, email.
- `showToast`: показує коротке повідомлення sidebar.
- `withBtnLoading`: обгортає дію станом завантаження.
- `refreshHeaders`: запитує актуальні заголовки з сервера.
- `populateColumns`: рендерить чекліст вибору колонок.
- `generate`: запитує прев'ю SMS-тексту.
- `copyToClipboard`: копіює прев'ю текст у буфер.
- `downloadTxt`: зберігає прев'ю в текстовий файл.
- `sendEmailMessage`: валідовує email і надсилає прев'ю.

Дерево викликів:

1. `onOpen`
Дочірні (через меню): `refreshAll`, `colorCells`, `refreshColorCountsActiveSheet`, `createDailyTrigger`, `showSidebar`, `applyFreeze`, `ensureConfigSheet`, `syncAllChunked`.

2. `refreshAll`
Дочірні: `colorCells`, `refreshColorCountsActiveSheet`, `toast`, `sendErrorNotification`.

3. `refreshCells`
Дочірні: `getCellsWithFormula`, `sendErrorNotification`.

4. `colorCells`
Дочірні: `colorHeadersForSheet`, `sendErrorNotification`.

5. `colorHeadersForSheet`
Дочірні: `parseDate`.

6. `countCellsByColor`
Дочірні: `splitSheetA1`, `isColorLiteral`, `sendErrorNotification`.

7. `setupValidationAllSheets`
Дочірні: `applyShiftCodeValidationForSheet_`, `toast`.

8. `applyShiftCodeValidationForSheet_`
Дочірні: `buildAllowedRegexInner_`, `escapeForSheetRegex_`, `isShiftValidationRule_`.

9. `updateFairnessMetrics`
Дочірні: `parseDate`, `toast`, `sendErrorNotification`.

10. `autoBalanceDay`
Дочірні: `parseDate`, `toast`.

11. `onEdit` (CalendarNotesSync.gs)
Дочірні: `readConfig`, `isSheetAllowed`, `coerceToDate`, `buildNote`, `upsertNote`, `sendErrorNotification`.

12. `syncAllChunked`
Дочірні: `readConfig`, `isSheetAllowed`, `coerceToDate`, `buildNote`, `upsertNote`.

13. `generateMessage`
Дочірні: `findLastRowInColumnA`, `formatRow`.

14. `refreshHeaders` (Sidebar.html)
Дочірні серверні: `getHeaders`.
Дочірні клієнтські: `populateColumns`.

15. `generate` (Sidebar.html)
Дочірні серверні: `generateMessage`.

16. `sendEmailMessage` (Sidebar.html)
Дочірні серверні: `sendEmail`.

Примітки:

- Runtime, schedule core, інтеграції, валідація і UI рознесені по окремих файлах.
- Із ростом проєкту тримайте інтеграції ізольованими від core-логіки графіка.
