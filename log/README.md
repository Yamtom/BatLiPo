# log

Проєкт Google Apps Script для журналу польотів, швидкого вводу та звітів по зрізах.

Таблиця:

- [log/log.txt](log/log.txt)

Основні точки входу:

- `onOpen` in `AppMenu.gs`
- `showQuickEntry` для вводу польоту
- `showSliceDialog` для фільтрованого звіту
- `recalcAllDurations` для оновлення ризику і тривалості

Структура файлів:

- `Config.gs`: назви аркушів, мапа колонок, критерії ризику, UI-лейбли
- `AppMenu.gs`: меню, відкриття діалогів, prefill payload
- `AuditLog.gs`: легкий запис операційного логу
- `DateParsing.gs`: нормалізація дати/часу та форматування тривалості
- `DistinctValues.gs`: списки довідкових значень і helper останнього рядка
- `RiskLogic.gs`: правила розрахунку ризику
- `EditHooks.gs`: `onEdit`, перерахунок рядків, пошук колонки ризику
- `FlightEntries.gs`: запис нових польотів і приведення значень
- `SliceReports.gs`: генерація аркуша зрізу з фільтрами
- `SheetNavigation.gs`: сортування і навігація курсора
- `QuickEntry.html`, `SliceDialog.html`: модальний UI

Файли та функції:

## Дерево викликів (хто кого використовує)

- `onOpen`
	- `goToLastRow`

- `showQuickEntry`
	- `getPrefillData_`
		- `getDistinctFromColumn_`
		- `getDistinctAmmoTypes_`

- `showSliceDialog`
	- `getPrefillData_`
		- `getDistinctFromColumn_`
		- `getDistinctAmmoTypes_`

- `onEdit`
	- `normalizeDateValue_`
	- `normalizeTime`
	- `updateDurationAndRiskForRow_`
		- `getRiskColumnForSheet_`
		- `computeDurationMs`
		- `calculateRiskFactor`

- `recalcAllDurations`
	- `recalcAllDates_`
		- `normalizeDateValue_`
	- `getRiskColumnForSheet_`
	- `computeDurationMs`
	- `calculateRiskFactor`

- `sortByDateTime`
	- `recalcAllDates_`
		- `normalizeDateValue_`

- `goToLastRow`
	- `getLastDataRowByColumn_`

- `addFlight`
	- `getRiskColumnForSheet_`
	- `normalizeDateValue_`
	- `normalizeTime`
	- `computeDurationMs`
	- `calculateRiskFactor`
	- `toOptionalNumber_`
	- `getLastDataRowByColumn_`
	- `logChange`

- `runSliceWithFilters`
	- `getRiskColumnForSheet_`
	- `normalizeDateValue_`
	- `computeDurationMs`
	- `formatDurationHuman`

- `submitForm` (`QuickEntry.html`)
	- `showMsg`
	- `addFlight` (server-side)

- `updateDurationPreview` (`QuickEntry.html`)
	- `parseTimeToMinutes`

- `runSlice` (`SliceDialog.html`)
	- `runSliceWithFilters` (server-side)

## `Config.gs`

- `CONFIG`: схема аркуша, назви меню, налаштування ризику, формати.

## `AppMenu.gs`

- `onOpen`: формує меню й переносить курсор на наступний рядок.
- `getPrefillData_`: формує списки для quick-entry і фільтрів.
- `showSliceDialog`: відкриває діалог фільтра за датою.
- `showQuickEntry`: відкриває модалку швидкого вводу.
- `removeEmptyRows`: видаляє повністю порожні рядки.

## `AuditLog.gs`

- `logChange`: додає операційну дію в лог-аркуш.

## `DateParsing.gs`

- `normalizeTime`: приводить текстовий час до об'єкта Date.
- `computeDurationMs`: рахує тривалість місії, включно з переходом через добу.
- `normalizeDateValue_`: парсить змішані формати вхідної дати.
- `formatDurationHuman`: показує тривалість у читабельному форматі.

## `DistinctValues.gs`

- `getDistinctFromColumn_`: збирає унікальні непорожні значення.
- `getDistinctAmmoTypes_`: збирає унікальні типи БК з двох колонок.
- `getLastDataRowByColumn_`: знаходить останній непорожній рядок даних.

## `RiskLogic.gs`

- `calculateRiskFactor`: об'єднує цілісність, РЕБ і тривалість у прапорець ризику.

## `EditHooks.gs`

- `onEdit`: нормалізує відредаговані значення і перераховує зачеплені рядки.
- `updateDurationAndRiskForRow_`: оновлює ризик для одного рядка.
- `recalcAllDates_`: нормалізує колонку дат у вибраному діапазоні.
- `recalcAllDurations`: масово перераховує ризики для вибірки.
- `getRiskColumnForSheet_`: знаходить колонку RISK по заголовках.

## `FlightEntries.gs`

- `addFlight`: додає один новий рядок місії.
- `toOptionalNumber_`: конвертує вхід у число або порожнє значення.

## `SliceReports.gs`

- `runSliceWithFilters`: будує аркуш зрізу з фільтрами та підсумками.

## `SheetNavigation.gs`

- `sortByDateTime`: сортує аркуш даних за датою і часом зльоту.
- `goToLastRow`: переводить фокус на наступний рядок для запису.

## `QuickEntry.html`

- Призначення: модалка швидкого вводу місії.
- `showMsg`: показує банер успіху або помилки.
- `updateDurationPreview`: показує прев'ю тривалості за часом.
- `submitForm`: валідовує форму й надсилає payload польоту.
- `parseTimeToMinutes`: перетворює `HH:MM` у хвилини.

## `SliceDialog.html`

- Призначення: діапазон дат і опційні фільтри для зрізу.
- `setPreset`: виставляє діапазон дат за пресетом днів.
- `runSlice`: надсилає фільтри й показує статус результату.

Примітки:

- `Config.gs` є єдиним джерелом правди для схеми аркуша.
- Edit hooks, записи, звіти та чисті обчислення рознесені в окремі модулі.
