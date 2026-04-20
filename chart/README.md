# chart

Проєкт Google Apps Script для керування статусами бортів у таблиці chart.

Таблиця:

- [chart/chart.txt](chart/chart.txt)

Основні точки входу:

- `onOpen` in `Menu.gs`
- `showForm` для модального редагування статусу
- `updateReport` для оновлення зведеного звіту
- `runHealthCheck` для перевірки цілісності даних

Структура файлів:

- `Constants.gs`: назви аркушів і константи колонок
- `Menu.gs`: меню таблиці
- `FormService.gs`: відкриття модалки і формування payload форми
- `StatusWorkflow.gs`: додавання статусу, фарбування рядків, пошук історії
- `DictionaryService.gs`: CRUD довідника статусів/імен
- `ChartLog.gs`: допоміжні функції запису в лог-аркуш
- `BoardStatus.gs`: визначення борта та парсинг статусів
- `SheetUtils.gs`: загальні helper-и для таблиць і HTML
- `Report.gs`: генерація метрик і зведеного звіту
- `HealthCheck.gs`: перевірки та архівні операції
- `FormMain.html`, `FormBody.html`, `FormScripts.html`, `FormStyles.html`: UI діалогу

Файли та функції:

## `Constants.gs`

- `SHEET_*`, `COL_*`: ідентифікатори аркушів і мапінг колонок борта.

## `Menu.gs`

- `onOpen`: формує головне меню таблиці.

## `FormService.gs`

- `showForm`: перевіряє виділення та відкриває модальний діалог.
- `getFormData`: формує payload модалки зі статусами, іменами, meta та історією.

## `StatusWorkflow.gs`

- `appendData`: додає історію статусу в обрану(і) клітинку(и) статусу.
- `colorCells`: фарбує пов'язані блоки за кольором статусу.
- `getBoardHistory_`: читає останню історію логу для одного борта.

## `DictionaryService.gs`

- `getStatuses`: завантажує статуси й кольори з довідника.
- `getNames`: завантажує імена операторів з довідника.
- `testDictionary`: логує поточні значення довідника для дебагу.
- `addStatus`: додає новий статус, якщо його ще немає.
- `addName`: додає нове ім'я.
- `addDictionaryItem`: додає один запис у довідник.
- `getStatusColor`: повертає колір для статусу.
- `normalizeColor_`: нормалізує збережений колірний літерал.

## `ChartLog.gs`

- `logChange`: додає одну зміну статусу в лог-аркуш.
- `buildChartLogRow_`: мапить payload зміни в рядок логу.
- `ensureColumns_`: гарантує наявність потрібних заголовків логу.

## `BoardStatus.gs`

- `getBoardIdFromRow_`: визначає id борта з даних рядка.
- `buildStatusHistoryLine_`: форматує один рядок історії для додавання в клітинку.
- `getLatestBoardStatus_`: парсить останній статус з багаторядкової клітинки.
- `getLatestBoardStatusFromRow_`: знаходить найновіший статус у рядку.
- `isLostBoardStatus_`: визначає статуси втрати для архівації.
- `makeColorMatrix_`: будує повторювану матрицю фону.

## `SheetUtils.gs`

- `getOrCreateSheet`: повертає аркуш або створює його із заголовками.
- `requireSheet_`: кидає помилку, якщо потрібного аркуша немає.
- `include`: вбудовує HTML-парціал у шаблон.
- `logError`: пише помилку функції в консоль.

## `Report.gs`

- `updateReport`: перебудовує аркуш зведеного звіту.
- `safeCount`: рахує непорожні рядки в ключовій колонці.

## `HealthCheck.gs`

- `runHealthCheck`: виявляє відсутні id бортів і проблеми нумерації.
- `archiveLostDrones`: переносить втрачені борти в архів.

## `FormMain.html`

- Призначення: складає модалку з частин шаблону.
- JS-функції: немає.

## `FormBody.html`

- Призначення: розмітка полів і панелей форми статусу.
- JS-функції: немає.

## `FormStyles.html`

- Призначення: стилі модалки та компонентів.
- JS-функції: немає.

## `FormScripts.html`

- `loadAllData`: завантажує server payload для ініціалізації діалогу.
- `fillSelect`: заповнює select значеннями з масиву.
- `renderBoardInfo`: рендерить блок короткої інформації про борт.
- `renderHistory`: рендерить картки останньої історії статусів.
- `validateForm`: перевіряє обов'язкові поля перед відправкою.
- `updateSubmitAvailability`: вмикає/вимикає кнопку submit.
- `submitForm`: надсилає зміну статусу на сервер.
- `showNewField`: показує інлайн-поле додавання нового значення.
- `hideNewField`: ховає інлайн-поле додавання.
- `addItem`: додає новий статус або ім'я з модалки.
- `showToast`: показує коротке клієнтське повідомлення.
- `escapeHtml`: екранує HTML-фрагменти користувача.
- `formatDate`: форматує дату для компактного показу історії.

Дерево викликів:

1. `onOpen`
Дочірні (через меню): `showForm`, `runHealthCheck`.

2. `showForm`
Дочірні: `logError`.

3. `getFormData`
Дочірні: `getStatuses`, `getNames`, `getBoardIdFromRow_`, `getBoardHistory_`, `logError`.

4. `appendData`
Дочірні: `buildStatusHistoryLine_`, `colorCells`, `logChange`, `logError`.

5. `logChange`
Дочірні: `getOrCreateSheet`, `ensureColumns_`, `buildChartLogRow_`, `logError`.

6. `archiveLostDrones`
Дочірні: `getOrCreateSheet`, `getLatestBoardStatusFromRow_`, `isLostBoardStatus_`.

7. `getBoardHistory_`
Дочірні: `getOrCreateSheet`, `getStatusColor`.

8. `loadAllData` (FormScripts.html)
Дочірні серверні: `getFormData`.
Дочірні клієнтські: `fillSelect`, `renderBoardInfo`, `renderHistory`, `updateSubmitAvailability`.

9. `submitForm` (FormScripts.html)
Дочірні серверні: `appendData`.
Дочірні клієнтські: `validateForm`, `updateSubmitAvailability`, `showToast`.

10. `addItem` (FormScripts.html)
Дочірні серверні: `addStatus`, `addName`.
Дочірні клієнтські: `hideNewField`, `updateSubmitAvailability`.

Примітки:

- Зони UI, workflow, довідника та логу розділені на окремі модулі.
- Історія статусів додається в клітинку і дублюється в лог-аркуш.
