/**
 * Web App entry point and router for the standalone analytics dashboard.
 *
 * Deploy as: Web App → Execute as "User accessing the web app" → Access "Anyone with Google Account"
 *
 * Routes (via ?page= parameter):
 * - overview (default): Enhanced usage analytics dashboard
 * - divisions: Division-level drilldown and comparison
 * - user: Individual user profile (?page=user&email=...)
 *
 * Access restricted to ADMIN_EMAILS defined in Code.js.
 */

/**
 * Serves the web app. Called automatically when the deployed URL is accessed.
 * @param {GoogleAppsScript.Events.DoGet} e - The event parameter
 * @return {GoogleAppsScript.HTML.HtmlOutput} The HTML page to serve
 */
function doGet(e) {
  const userEmail = Session.getActiveUser().getEmail();

  // Check admin access
  if (ADMIN_EMAILS.length > 0 && !isAdmin(userEmail)) {
    return HtmlService.createHtmlOutput(
      '<html><body style="font-family: DM Sans, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8f9fa;">' +
      '<div style="text-align: center; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">' +
      '<h1 style="color: #a0192a;">Access Denied</h1>' +
      '<p style="color: #666;">You do not have permission to view this dashboard.</p>' +
      '<p style="color: #999; font-size: 14px;">Logged in as: ' + userEmail + '</p>' +
      '</div></body></html>'
    ).setTitle('Access Denied - SAS Analytics');
  }

  const page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'overview';

  let template;

  switch (page) {
    case 'divisions':
      template = HtmlService.createTemplateFromFile('PageDivisions');
      break;
    case 'user':
      template = HtmlService.createTemplateFromFile('PageUser');
      template.userEmail = (e.parameter && e.parameter.email) ? e.parameter.email : '';
      break;
    case 'overview':
    default:
      template = HtmlService.createTemplateFromFile('PageOverview');
      break;
  }

  return template.evaluate()
    .setTitle('Usage Analytics Dashboard - SAS')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * Includes an HTML file as a partial. Use in templates as: <?!= include('Styles') ?>
 * @param {string} filename - The HTML file to include (without .html extension)
 * @return {string} The file content
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
