/**
 * Web App entry point — serves two roles:
 *
 * 1. JSON data API for the Next.js dashboard (when ?format=json&key=KEY&endpoint=...)
 * 2. Fallback read-only HTML dashboard (when Next.js is unavailable)
 *
 * Deploy as: Web App → Execute as "Me" → Access "Anyone with Google Account"
 *
 * API key: Apps Script editor → Project Settings → Script Properties → API_KEY = <secret>
 * (Same value goes in the Next.js .env as APPS_SCRIPT_API_KEY)
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};

  // ── JSON API (called by Next.js) ──────────────────────────────────────────
  if (params.format === 'json') {
    var storedKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
    if (!storedKey || params.key !== storedKey) {
      return ContentService
        .createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var data;
    switch (params.endpoint) {
      case 'usage':     data = getUsageData();                     break;
      case 'students':  data = getStudentData();                   break;
      case 'divisions': data = getDivisionData();                  break;
      case 'user':      data = getUserProfile(params.email || ''); break;
      default:          data = { error: 'Unknown endpoint: ' + params.endpoint };
    }

    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ── Fallback HTML dashboard ───────────────────────────────────────────────
  // Shown when the Next.js app is unavailable.
  // Restricted to the same admin emails defined in Code.js.
  var userEmail = Session.getActiveUser().getEmail();
  if (ADMIN_EMAILS.length > 0 && !isAdmin(userEmail)) {
    return HtmlService.createHtmlOutput(
      '<html><body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;background:#f0f2f5">' +
      '<div style="text-align:center;padding:40px;background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.1)">' +
      '<h1 style="color:#a0192a">Access Denied</h1>' +
      '<p style="color:#666;margin-top:8px">Logged in as: ' + userEmail + '</p>' +
      '</div></body></html>'
    ).setTitle('Access Denied');
  }

  return HtmlService.createHtmlOutputFromFile('Fallback')
    .setTitle('SAS Usage Analytics — Fallback')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * Includes an HTML partial. Used in templates as: <?!= include('filename') ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
