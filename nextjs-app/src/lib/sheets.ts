import { google } from 'googleapis';
import type {
  UsageData,
  UserData,
  StudentData,
  DivisionData,
  Division,
  DivisionUser,
  UserProfile,
  ServiceCounts,
  ServicePriorities,
  UsagePriority,
  UntrackedUser,
} from '@/types';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID ?? '';

// Sheet names
const SHEETS = {
  STAFF_LIST: 'staff_list',
  PRO_USER_LIST: 'pro_user_list',
  USAGE_COUNTS: 'usage_counts',
  USAGE_PRIORITY: 'usage_by_priority',
  STUDENT_ACCESS: 'student_gemini_access',
  STUDENT_NO_ACCESS: 'student_no_gemini_access',
};

// Column indices (0-based), matching Code.js constants
const CHEAT_COLS = { NO: 0, PERSON_ID: 1, FULL_NAME: 2, EMAIL: 3, PRIMARY_SCHOOL: 4, JOB_TITLE: 5 };
const USER_COLS = { EMAIL: 2 };
const USAGE_COLS = { EMAIL: 0, OVERALL_USAGE: 1, ACTIVE_DAYS: 2, GMAIL: 3, DOCS: 4, SHEETS: 5, SLIDES: 6, DRIVE: 7, MEET: 8, GEMINI: 9 };
const STUDENT_COLS = { NO: 0, PERSON_ID: 1, FULL_NAME: 2, EMAIL: 3, CURRENT_GRADE: 4, ENROLLMENT_STATUS: 5 };

function getSheetsClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

function normalizeEmail(value: unknown): string {
  return value != null ? String(value).trim().toLowerCase() : '';
}

function parseNum(value: unknown): number {
  return parseInt(String(value ?? '0'), 10) || 0;
}

async function getSheetValues(sheetName: string, range: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
  });
  return (res.data.values ?? []) as string[][];
}

// Rows start at row 2 (header = row 1). We fetch A2:Z to get all data rows.
async function getDataRows(sheetName: string, colCount: number): Promise<string[][]> {
  try {
    return await getSheetValues(sheetName, `A2:${colLetter(colCount)}`);
  } catch {
    return [];
  }
}

function colLetter(n: number): string {
  return String.fromCharCode(64 + n); // 1→A, 10→J, etc.
}

// Build email → row lookup maps for both usage sheets
function buildUsageMaps(
  countRows: string[][],
  priorityRows: string[][]
): {
  countsMap: Map<string, string[]>;
  priorityMap: Map<string, string[]>;
} {
  const countsMap = new Map<string, string[]>();
  for (const row of countRows) {
    const email = normalizeEmail(row[USAGE_COLS.EMAIL]);
    if (email) countsMap.set(email, row);
  }
  const priorityMap = new Map<string, string[]>();
  for (const row of priorityRows) {
    const email = normalizeEmail(row[USAGE_COLS.EMAIL]);
    if (email) priorityMap.set(email, row);
  }
  return { countsMap, priorityMap };
}

function serviceCountsFromRow(row: string[]): ServiceCounts {
  return {
    Gmail: parseNum(row[USAGE_COLS.GMAIL]),
    Docs: parseNum(row[USAGE_COLS.DOCS]),
    Sheets: parseNum(row[USAGE_COLS.SHEETS]),
    Slides: parseNum(row[USAGE_COLS.SLIDES]),
    Drive: parseNum(row[USAGE_COLS.DRIVE]),
    Meet: parseNum(row[USAGE_COLS.MEET]),
    Gemini: parseNum(row[USAGE_COLS.GEMINI]),
  };
}

function servicePrioritiesFromRow(row: string[]): ServicePriorities {
  const p = (v: unknown): UsagePriority =>
    (['High', 'Medium', 'Low', 'Zero'].includes(String(v)) ? String(v) : 'Zero') as UsagePriority;
  return {
    Gmail: p(row[USAGE_COLS.GMAIL]),
    Docs: p(row[USAGE_COLS.DOCS]),
    Sheets: p(row[USAGE_COLS.SHEETS]),
    Slides: p(row[USAGE_COLS.SLIDES]),
    Drive: p(row[USAGE_COLS.DRIVE]),
    Meet: p(row[USAGE_COLS.MEET]),
    Gemini: p(row[USAGE_COLS.GEMINI]),
  };
}

const ZERO_PRIORITIES: ServicePriorities = {
  Gmail: 'Zero', Docs: 'Zero', Sheets: 'Zero', Slides: 'Zero',
  Drive: 'Zero', Meet: 'Zero', Gemini: 'Zero',
};

export async function getUsageData(): Promise<UsageData> {
  const [countRows, priorityRows, proRows, staffRows, studentRows, noAccessRows] = await Promise.all([
    getDataRows(SHEETS.USAGE_COUNTS, 10),
    getDataRows(SHEETS.USAGE_PRIORITY, 10),
    getDataRows(SHEETS.PRO_USER_LIST, 8),
    getDataRows(SHEETS.STAFF_LIST, 9),
    getDataRows(SHEETS.STUDENT_ACCESS, 8),
    getDataRows(SHEETS.STUDENT_NO_ACCESS, 8),
  ]);

  const geminiProUsers = new Set(proRows.map(r => normalizeEmail(r[USER_COLS.EMAIL])).filter(Boolean));
  const knownStaff = new Set(staffRows.map(r => normalizeEmail(r[CHEAT_COLS.EMAIL])).filter(Boolean));
  const studentUsers = new Set(studentRows.map(r => normalizeEmail(r[STUDENT_COLS.EMAIL])).filter(Boolean));
  const studentsNoGemini = new Set(noAccessRows.map(r => normalizeEmail(r[STUDENT_COLS.EMAIL])).filter(Boolean));

  const { priorityMap } = buildUsageMaps(countRows, priorityRows);

  const users: UserData[] = [];
  const untrackedUsersList: UntrackedUser[] = [];

  for (const row of countRows) {
    const email = normalizeEmail(row[USAGE_COLS.EMAIL]);
    if (!email) continue;
    if (studentsNoGemini.has(email)) continue;

    const overallUsage = parseNum(row[USAGE_COLS.OVERALL_USAGE]);
    const activeDays = parseNum(row[USAGE_COLS.ACTIVE_DAYS]);
    const pRow = priorityMap.get(email);
    const overallUsagePriority: UsagePriority = pRow
      ? ((['High', 'Medium', 'Low', 'Zero'].includes(String(pRow[USAGE_COLS.OVERALL_USAGE]))
          ? pRow[USAGE_COLS.OVERALL_USAGE]
          : 'Zero') as UsagePriority)
      : 'Zero';

    if (overallUsage > 0) {
      const isTracked = geminiProUsers.has(email) || knownStaff.has(email) || studentUsers.has(email);
      if (!isTracked) {
        untrackedUsersList.push({ email: row[USAGE_COLS.EMAIL] ?? email, overallUsage, activeDays, priority: overallUsagePriority });
      }
    }

    users.push({
      email: row[USAGE_COLS.EMAIL] ?? email,
      overallUsage,
      overallUsagePriority,
      activeDays,
      hasGeminiPro: geminiProUsers.has(email),
      isStaff: knownStaff.has(email),
      isStudent: studentUsers.has(email),
      services: serviceCountsFromRow(row),
      servicesPriority: pRow ? servicePrioritiesFromRow(pRow) : { ...ZERO_PRIORITIES },
    });
  }

  return {
    users,
    untrackedUsers: { count: untrackedUsersList.length, users: untrackedUsersList },
    studentsNoGeminiCount: studentsNoGemini.size,
  };
}

export async function getStudentData(): Promise<StudentData> {
  const [accessRows, noAccessRows] = await Promise.all([
    getDataRows(SHEETS.STUDENT_ACCESS, 6),
    getDataRows(SHEETS.STUDENT_NO_ACCESS, 6),
  ]);

  const byGrade: Record<string, number> = {};
  const byEnrollmentStatus: Record<string, number> = {};
  const students = accessRows.map(row => {
    const grade = String(row[STUDENT_COLS.CURRENT_GRADE] ?? 'Unknown');
    const status = String(row[STUDENT_COLS.ENROLLMENT_STATUS] ?? 'Unknown');
    byGrade[grade] = (byGrade[grade] ?? 0) + 1;
    byEnrollmentStatus[status] = (byEnrollmentStatus[status] ?? 0) + 1;
    return {
      no: row[STUDENT_COLS.NO] ?? '',
      personId: String(row[STUDENT_COLS.PERSON_ID] ?? ''),
      fullName: String(row[STUDENT_COLS.FULL_NAME] ?? ''),
      email: normalizeEmail(row[STUDENT_COLS.EMAIL]),
      currentGrade: grade,
      enrollmentStatus: status,
    };
  });

  return {
    withAccess: { total: accessRows.length, byGrade, byEnrollmentStatus, students },
    withoutAccess: { total: noAccessRows.length },
  };
}

export async function getDivisionData(): Promise<DivisionData> {
  const [staffRows, countRows, priorityRows, proRows] = await Promise.all([
    getDataRows(SHEETS.STAFF_LIST, 9),
    getDataRows(SHEETS.USAGE_COUNTS, 10),
    getDataRows(SHEETS.USAGE_PRIORITY, 10),
    getDataRows(SHEETS.PRO_USER_LIST, 8),
  ]);

  const geminiProUsers = new Set(proRows.map(r => normalizeEmail(r[USER_COLS.EMAIL])).filter(Boolean));
  const { countsMap, priorityMap } = buildUsageMaps(countRows, priorityRows);

  const divisions: Record<string, Division> = {};

  for (const row of staffRows) {
    const email = normalizeEmail(row[CHEAT_COLS.EMAIL]);
    if (!email) continue;

    const division = String(row[CHEAT_COLS.PRIMARY_SCHOOL] ?? 'Unknown').trim() || 'Unknown';
    if (!divisions[division]) {
      divisions[division] = {
        userCount: 0, proCount: 0, totalActiveDays: 0, avgActiveDays: 0,
        priorityBreakdown: { High: 0, Medium: 0, Low: 0, Zero: 0 },
        users: [], topUsers: [],
      };
    }

    const div = divisions[division];
    div.userCount++;
    if (geminiProUsers.has(email)) div.proCount++;

    const cRow = countsMap.get(email);
    const pRow = priorityMap.get(email);
    const activeDays = cRow ? parseNum(cRow[USAGE_COLS.ACTIVE_DAYS]) : 0;
    const priority: UsagePriority = pRow
      ? ((['High', 'Medium', 'Low', 'Zero'].includes(String(pRow[USAGE_COLS.OVERALL_USAGE]))
          ? pRow[USAGE_COLS.OVERALL_USAGE]
          : 'Zero') as UsagePriority)
      : 'Zero';

    div.totalActiveDays += activeDays;
    div.priorityBreakdown[priority]++;
    div.users.push({
      email: row[CHEAT_COLS.EMAIL] ?? email,
      name: String(row[CHEAT_COLS.FULL_NAME] ?? ''),
      jobTitle: String(row[CHEAT_COLS.JOB_TITLE] ?? ''),
      hasGeminiPro: geminiProUsers.has(email),
      priority,
      activeDays,
    });
  }

  for (const div of Object.values(divisions)) {
    div.avgActiveDays = div.userCount > 0 ? Math.round(div.totalActiveDays / div.userCount) : 0;
    div.topUsers = [...div.users].sort((a, b) => b.activeDays - a.activeDays).slice(0, 5);
  }

  return { divisions };
}

export async function getUserProfile(email: string): Promise<UserProfile | null> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const [staffRows, proRows, countRows, priorityRows] = await Promise.all([
    getDataRows(SHEETS.STAFF_LIST, 9),
    getDataRows(SHEETS.PRO_USER_LIST, 8),
    getDataRows(SHEETS.USAGE_COUNTS, 10),
    getDataRows(SHEETS.USAGE_PRIORITY, 10),
  ]);

  const profile: UserProfile = {
    email: normalizedEmail, name: '', division: '', jobTitle: '', personId: '',
    hasGeminiPro: false, overallUsage: 0, overallPriority: 'Zero', activeDays: 0,
    services: { Gmail: 0, Docs: 0, Sheets: 0, Slides: 0, Drive: 0, Meet: 0, Gemini: 0 },
    servicesPriority: { ...ZERO_PRIORITIES },
    divisionAvg: { activeDays: 0, userCount: 0 },
  };

  const staffRow = staffRows.find(r => normalizeEmail(r[CHEAT_COLS.EMAIL]) === normalizedEmail);
  if (staffRow) {
    profile.name = String(staffRow[CHEAT_COLS.FULL_NAME] ?? '');
    profile.division = String(staffRow[CHEAT_COLS.PRIMARY_SCHOOL] ?? '').trim();
    profile.jobTitle = String(staffRow[CHEAT_COLS.JOB_TITLE] ?? '');
    profile.personId = String(staffRow[CHEAT_COLS.PERSON_ID] ?? '');
  }

  profile.hasGeminiPro = proRows.some(r => normalizeEmail(r[USER_COLS.EMAIL]) === normalizedEmail);

  const cRow = countRows.find(r => normalizeEmail(r[USAGE_COLS.EMAIL]) === normalizedEmail);
  if (cRow) {
    profile.overallUsage = parseNum(cRow[USAGE_COLS.OVERALL_USAGE]);
    profile.activeDays = parseNum(cRow[USAGE_COLS.ACTIVE_DAYS]);
    profile.services = serviceCountsFromRow(cRow);
  }

  const pRow = priorityRows.find(r => normalizeEmail(r[USAGE_COLS.EMAIL]) === normalizedEmail);
  if (pRow) {
    profile.overallPriority = ((['High', 'Medium', 'Low', 'Zero'].includes(String(pRow[USAGE_COLS.OVERALL_USAGE]))
      ? pRow[USAGE_COLS.OVERALL_USAGE]
      : 'Zero') as UsagePriority);
    profile.servicesPriority = servicePrioritiesFromRow(pRow);
  }

  if (profile.division) {
    const { countsMap } = buildUsageMaps(countRows, priorityRows);
    const divStaff = staffRows.filter(r => String(r[CHEAT_COLS.PRIMARY_SCHOOL] ?? '').trim() === profile.division);
    let totalDays = 0;
    for (const r of divStaff) {
      const e = normalizeEmail(r[CHEAT_COLS.EMAIL]);
      totalDays += e ? parseNum(countsMap.get(e)?.[USAGE_COLS.ACTIVE_DAYS]) : 0;
    }
    profile.divisionAvg = {
      activeDays: divStaff.length > 0 ? Math.round(totalDays / divStaff.length) : 0,
      userCount: divStaff.length,
    };
  }

  return profile;
}
