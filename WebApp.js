/**
 * JSON data API for the Next.js dashboard.
 *
 * Deploy as: Web App → Execute as "Me" → Access "Anyone"
 *
 * Set the API key in Apps Script editor:
 *   Project Settings → Script Properties → API_KEY = <your secret>
 *
 * Endpoints (all via GET with ?format=json&key=KEY&endpoint=...):
 *   endpoint=usage               → getUsageData()
 *   endpoint=students            → getStudentData()
 *   endpoint=divisions           → getDivisionData()
 *   endpoint=user&email=...      → getUserProfile(email)
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  const storedKey = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!storedKey || params.key !== storedKey) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: 'Unauthorized' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  let data;
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
