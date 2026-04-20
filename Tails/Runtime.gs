/** ===========================
 *  Runtime helpers
 *  =========================== */

function shouldRunDebounced(key, ms) {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const last = Number(props.getProperty(key) || 0);
  if (now - last < ms) return false;
  props.setProperty(key, String(now));
  return true;
}

function sendErrorNotification(err, name) {
  const email = CONFIG.errorNotificationEmail;
  const subject = 'Помилка в скрипті' + (name ? ' - ' + name : '');
  const body = 'Function: ' + (name || 'unknown') + '\nMsg: ' + err.message + '\nStack: ' + err.stack + '\nObj: ' + JSON.stringify(err, Object.getOwnPropertyNames(err));
  Logger.log(body);
  if (email) MailApp.sendEmail(email, subject, body);
}

function toast(msg, sec) {
  SpreadsheetApp.getActive().toast(msg, 'Інфо', sec || 3);
}