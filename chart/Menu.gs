function onOpen() {
  SpreadsheetApp.getUi().createMenu('🌟 Меню')
    .addItem('📝 Змінити статус / Відкрити форму', 'showForm')
    .addSeparator()
    //.addItem('📊 Оновити Звіт', 'updateReport')
    .addSeparator()
    .addItem('✅ Health Check (Перевірка)', 'runHealthCheck')
    //.addItem('📦 Архівувати втрачені', 'archiveLostDrones')
    .addToUi();
}