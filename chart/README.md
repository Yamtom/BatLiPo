# chart

Проєкт Google Apps Script для керування статусами бортів у таблиці chart.

## Швидка навігація

- Основні дані таблиці: [chart.txt](chart.txt)
- План роботи з HTML-знімками: [HTML_EXPORT_IMPLEMENTATION.md](HTML_EXPORT_IMPLEMENTATION.md)
- Консолідований беклог покращень: [IMPROVEMENT_BACKLOG.md](IMPROVEMENT_BACKLOG.md)
- Альтернативний Markdown-експорт HTML: [Особи закріплення бортів/_markdown_exports](Особи%20закріплення%20бортів/_markdown_exports)

## Точки входу

- `onOpen` у `Menu.gs`
- `showForm` у `FormService.gs`
- `updateReport` у `Report.gs`
- `runHealthCheck` у `HealthCheck.gs`

## Модулі

- `Constants.gs`: константи аркушів і колонок
- `Menu.gs`: пункти меню
- `FormService.gs`: відкриття модалки і формування payload
- `StatusWorkflow.gs`: запис статусу, фарбування, історія
- `DictionaryService.gs`: довідники статусів/імен та кольори
- `ChartLog.gs`: лог змін
- `BoardStatus.gs`: парсинг/побудова рядків історії статусу
- `SheetUtils.gs`: загальні helper-и для аркушів і HTML
- `Report.gs`: зведений звіт
- `HealthCheck.gs`: перевірки цілісності й архівація
- `Form*.html`: UI модального вікна

## Що вже зафіксовано

- Є потреба толерантного парсингу історії (варіанти `Дата`/`Дата зміни`, `Хто`/`Хто змінив`).
- Є дрейф словника статусів і колірних літералів.
- Потрібен єдиний health-check з підсумком `OK/WARN/FAIL`.

Детальна пріоритизація винесена в [IMPROVEMENT_BACKLOG.md](IMPROVEMENT_BACKLOG.md).