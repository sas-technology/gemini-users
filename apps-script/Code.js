/**
 * @fileoverview Google Workspace Gemini AI Usage Tracking & Management System
 *
 * Purpose:
 * Manages and tracks Google Gemini AI usage across Singapore American School,
 * including staff (Basic and Pro licenses), students, and usage analytics.
 *
 * Key Features:
 * 1. Pro User Management:
 *    - Tracks staff with Gemini Pro licenses (pro_user_list)
 *    - Auto-syncs with staff directory (staff_list)
 *    - Auto-renumbers and highlights duplicate emails
 *
 * 2. Dual Usage Data System:
 *    - Numerical usage data (usage_counts sheet)
 *    - Priority labels: High, Medium, Low, Zero (usage_by_priority sheet)
 *    - Both coexist for technical analysis and non-technical viewing
 *
 * 3. Student Access Tracking:
 *    - Students with Gemini access (student_gemini_access)
 *    - Students without access (student_no_gemini_access)
 *
 * 4. Untracked User Detection:
 *    - Identifies users with usage data but not in any known list
 *    - Helps find former employees, test accounts, or data quality issues
 *
 * 5. Interactive Analytics Dashboard:
 *    - SAS-branded visualization with Chart.js
 *    - Priority distribution, Pro vs Basic comparison
 *    - Service-specific usage breakdown
 *    - Searchable and filterable data table
 *
 * Auto-Triggers:
 * - onOpen(): Creates menu and syncs all data when spreadsheet opens
 * - onEdit(): Auto-syncs when source sheets (staff_list, usage sheets) are edited
 *
 * Data Flow:
 * staff_list → pro_user_list (Name, Division, Job Title, Person ID)
 * usage_counts + usage_by_priority → pro_user_list (Usage labels, Active Days)
 *
 * Author: Singapore American School IT Department
 * Last Updated: 2025
 */

// Constants for row configuration
const HEADER_ROW = 1;
const FIRST_DATA_ROW = HEADER_ROW + 1;

// Admin emails authorized to access the web app dashboard
const ADMIN_EMAILS = [
  // Add authorized admin email addresses here
  // e.g., 'admin@sas.edu.sg'
];

// Consistent color constants for usage priority levels
const USAGE_COLORS = {
  High: '#ff0000',
  Medium: '#ff9900',
  Low: '#ffcc00',
  Zero: '#28a745',
};

// Sheet names
const CHEATSHEET_NAME = 'staff_list';
const USER_LIST_NAME = 'pro_user_list';
const USAGE_COUNTS_SHEET_NAME = 'usage_counts';
const USAGE_PRIORITY_SHEET_NAME = 'usage_by_priority';
const STUDENT_GEMINI_ACCESS_SHEET_NAME = 'student_gemini_access';
const STUDENT_NO_GEMINI_ACCESS_SHEET_NAME = 'student_no_gemini_access';
const UNTRACKED_USERS_SHEET_NAME = 'untracked_users';

// staff_list column indices (0-based for array access)
const CHEAT_COLS = {
  NO: 0, // Column A (sequential number)
  PERSON_ID: 1, // Column B
  FULL_NAME: 2, // Column C
  EMAIL: 3, // Column D
  PRIMARY_SCHOOL: 4, // Column E
  JOB_TITLE: 5, // Column F
  ROLES: 6, // Column G
  USAGE: 7, // Column H (Usage priority label)
  ACTIVE_DAYS: 8, // Column I (Active days count)
};

// User list column indices (0-based for array access)
const USER_COLS = {
  NO: 0, // Column A
  NAME: 1, // Column B
  EMAIL: 2, // Column C
  DIVISION: 3, // Column D
  JOB_TITLE: 4, // Column E
  PERSON_ID: 5, // Column F
  USAGE: 6, // Column G
  ACTIVE_DAYS: 7, // Column H
};

// Usage sheet column indices (0-based for array access)
const USAGE_COLS = {
  EMAIL: 0, // Column A
  OVERALL_USAGE: 1, // Column B (Overall usage)
  ACTIVE_DAYS: 2, // Column C (Active days)
  GMAIL: 3, // Column D (Gmail usage)
  DOCS: 4, // Column E (Docs usage)
  SHEETS: 5, // Column F (Sheets usage)
  SLIDES: 6, // Column G (Slides usage)
  DRIVE: 7, // Column H (Drive usage)
  MEET: 8, // Column I (Meet usage)
  GEMINI: 9, // Column J (Gemini app usage)
};

// student_gemini_access sheet column indices (0-based for array access)
const STUDENT_COLS = {
  NO: 0, // Column A
  PERSON_ID: 1, // Column B
  FULL_NAME: 2, // Column C
  EMAIL: 3, // Column D
  CURRENT_GRADE: 4, // Column E
  ENROLLMENT_STATUS: 5, // Column F
  USAGE: 6, // Column G (Usage priority label)
  ACTIVE_DAYS: 7, // Column H (Active days count)
};

/**
 * Normalizes an email value: trims whitespace, lowercases, and handles null/undefined.
 * @param {*} value - The value to normalize
 * @return {string} Normalized email or empty string
 */
function normalizeEmail(value) {
  return value !== null && value !== undefined ? String(value).trim().toLowerCase() : '';
}

/**
 * Checks if the given email is in the ADMIN_EMAILS list.
 * @param {string} email - Email to check
 * @return {boolean} True if admin
 */
function isAdmin(email) {
  return ADMIN_EMAILS.includes(normalizeEmail(email));
}

/**
 * Initialization function that runs automatically when the spreadsheet is opened.
 *
 * Purpose: Sets up the user interface and ensures data is current
 *
 * Actions Performed:
 * 1. Creates custom "Custom Utilities" menu in the spreadsheet toolbar
 * 2. Automatically syncs all data to ensure freshness when user opens spreadsheet
 *
 * Menu Items:
 * - 📊 View Usage Dashboard: Opens interactive analytics dashboard
 * - Process Pro User List: Manually trigger renumbering and duplicate highlighting
 * - Clear Highlights: Remove all red highlights from current sheet
 * - Sync Pro User List from Staff List: Manually sync staff info to Pro users
 * - Sync Usage Data to Pro User List: Manually sync usage data to Pro users
 *
 * Auto-Sync on Open:
 * - Syncs pro_user_list with latest staff_list data
 * - Syncs pro_user_list with latest usage data
 * - Ensures users always see current information when opening spreadsheet
 *
 * Note: This is a "simple trigger" that runs automatically without installation
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Custom Utilities')
    .addItem('🔄 Run Full Sync', 'showProgressDialog')
    .addSeparator()
    .addItem('Process Pro User List (Renumber & Highlight)', 'highlightDuplicateEmailsAndRenumber')
    .addItem('Clear Highlights on Current Sheet', 'clearAllHighlightsOnCurrentSheet')
    .addSeparator()
    .addItem('Sync Pro User List from Staff List', 'syncUserListFromCheatsheet')
    .addItem('Sync Usage Data to All Sheets', 'syncUsageDataToAllSheets')
    .addItem('Update Untracked Users Sheet', 'updateUntrackedUsersSheet')
    .addToUi();

  // Automatically process all sheets on open
  // Process numbering and duplicates for all sheets
  processSheetNumberingAndDuplicates(USER_LIST_NAME, USER_COLS.EMAIL + 1, 6); // pro_user_list: Email in Column C, highlight A-F
  processSheetNumberingAndDuplicates(CHEATSHEET_NAME, CHEAT_COLS.EMAIL + 1, 9); // staff_list: Email in Column D, highlight A-I
  processSheetNumberingAndDuplicates(STUDENT_GEMINI_ACCESS_SHEET_NAME, STUDENT_COLS.EMAIL + 1, 8); // student_gemini_access: Email in Column D, highlight A-H

  // Sync data between sheets
  syncUserListFromCheatsheet();
  syncUsageDataToAllSheets();
  updateUntrackedUsersSheet();
}

/**
 * Checks if the given sheet should be processed based on its name.
 * Excludes sheets containing "form responses" or "sheet" in their names.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to check.
 * @return {boolean} True if the sheet should be processed, false otherwise.
 */
function shouldProcessSheet(sheet) {
  const sheetName = sheet.getName().toLowerCase();
  // Keywords that trigger exclusion if found in the sheet name
  const excludedKeywords = ['form responses', 'sheet'];

  for (const keyword of excludedKeywords) {
    if (sheetName.includes(keyword)) {
      Logger.log(`Skipping sheet "${sheet.getName()}" because its name contains "${keyword}".`);
      return false; // Found an excluded keyword
    }
  }
  return true; // No excluded keywords found
}

/**
 * Main function to renumber rows sequentially in Column A and highlight rows
 * with duplicate email addresses in Column C.
 * Columns A:E of duplicate rows will be highlighted red.
 * Assumes row 1 is a header and numbering/processing starts from row 2.
 * Only processes the "pro_user_list" sheet (Gemini Pro license holders).
 */
function highlightDuplicateEmailsAndRenumber() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();

  // 1. Check if the current sheet is "pro_user_list"
  if (sheet.getName() !== USER_LIST_NAME) {
    spreadsheet.toast(
      `Skipped: Numbering only runs on the "${USER_LIST_NAME}" sheet.`,
      'Operation Aborted',
      5
    );
    return;
  }

  const lastRow = sheet.getLastRow();

  // 2. Update Column A numbering (renumber rows if needed)
  // This runs on every call, ensuring numbers are consecutive after any edit, addition, or deletion.
  if (lastRow >= FIRST_DATA_ROW) {
    const numDataRows = lastRow - FIRST_DATA_ROW + 1;
    const numbers = [];
    for (let i = 0; i < numDataRows; i++) {
      numbers.push([i + 1]); // Sequential numbers: 1, 2, 3...
    }
    sheet.getRange(FIRST_DATA_ROW, 1, numDataRows, 1).setValues(numbers);
  } else if (lastRow < FIRST_DATA_ROW && lastRow > 0) {
    // This case means there's only a header row or fewer rows than FIRST_DATA_ROW.
    // No data rows to number.
    // If there were previously numbers in column A below where data rows used to be,
    // they are not explicitly cleared by this section, but new data would get renumbered.
  }
  // If lastRow is 0 (empty sheet), no numbering occurs.

  // 3. Highlight duplicate emails in Column C
  let emailValues = [];
  if (lastRow > 0) {
    // Only try to get values if there's content
    // Consider C1:C[lastRow] to only process rows with content.
    // If C can be empty but other columns define lastRow, this is fine.
    emailValues = sheet.getRange(1, 3, lastRow, 1).getValues(); // Column C data from row 1 to lastRow
  } else {
    spreadsheet.toast('Sheet appears to be empty. Nothing to process.', 'Info', 5);
    return; // Nothing to process if sheet is empty
  }

  const emailCounts = {}; // Stores first row number for each email
  const rowsToHighlight = new Set(); // Stores 1-indexed row numbers to highlight

  for (let i = 0; i < emailValues.length; i++) {
    const cellValue = emailValues[i][0];
    // Ensure cellValue is not null or undefined before calling trim/toLowerCase
    const email = normalizeEmail(cellValue);

    if (email === '') {
      continue; // Skip empty or effectively empty cells
    }

    if (emailCounts[email]) {
      rowsToHighlight.add(i + 1); // Add current row
      rowsToHighlight.add(emailCounts[email]); // Add the first row where this email was seen
    } else {
      emailCounts[email] = i + 1; // Store the 1-indexed row of the first occurrence
    }
  }

  // 4. Clear existing background highlights in columns A:E
  if (lastRow > 0) {
    // This clears highlights from row 1. If row 1 (header) has specific formatting
    // that should never be cleared, adjust the start row and number of rows.
    // For example, to clear only from FIRST_DATA_ROW:
    // if (lastRow >= FIRST_DATA_ROW) {
    //   sheet.getRange(FIRST_DATA_ROW, 1, lastRow - FIRST_DATA_ROW + 1, 5).setBackground(null);
    // }
    sheet.getRange(1, 1, lastRow, 5).setBackground(null); // Clears A1:E[lastRow]
  }

  // 5. Apply new highlights
  let highlightedCount = 0;
  rowsToHighlight.forEach((rowNum) => {
    // Ensure rowNum is valid and within the actual content range of the sheet
    if (rowNum > 0 && rowNum <= lastRow) {
      sheet.getRange(rowNum, 1, 1, 5).setBackground('red'); // Highlight A:E
      highlightedCount++;
    }
  });

  SpreadsheetApp.flush(); // Apply all pending changes

  if (highlightedCount > 0) {
    spreadsheet.toast(
      `Processed: ${highlightedCount} row(s) involved in duplicates highlighted. Column A renumbered.`,
      'Success!',
      7
    );
  } else {
    spreadsheet.toast('Processed: No duplicate emails found. Column A renumbered.', 'Success!', 5);
  }
  Logger.log('Duplicate email highlighting and numbering complete for sheet: ' + sheet.getName());
}

/**
 * Generic function to renumber Column A and highlight duplicate emails on any sheet.
 * Works with any sheet that has:
 * - Column A: Sequential numbering (NO column)
 * - Specified email column for duplicate detection
 * - Specified range of columns to highlight (A through lastHighlightCol)
 *
 * @param {string} sheetName - Name of the sheet to process
 * @param {number} emailColIndex - Column index (1-based) for email column (e.g., 3 for Column C)
 * @param {number} lastHighlightCol - Last column to highlight (1-based, e.g., 5 for Column E)
 */
function processSheetNumberingAndDuplicates(sheetName, emailColIndex, lastHighlightCol) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`Sheet "${sheetName}" not found. Skipping.`);
    return;
  }

  const lastRow = sheet.getLastRow();

  // 1. Update Column A numbering (renumber rows if needed)
  if (lastRow >= FIRST_DATA_ROW) {
    const numDataRows = lastRow - FIRST_DATA_ROW + 1;
    const numbers = [];
    for (let i = 0; i < numDataRows; i++) {
      numbers.push([i + 1]); // Sequential numbers: 1, 2, 3...
    }
    sheet.getRange(FIRST_DATA_ROW, 1, numDataRows, 1).setValues(numbers);
  }

  // 2. Highlight duplicate emails
  let emailValues = [];
  if (lastRow > 0) {
    emailValues = sheet.getRange(1, emailColIndex, lastRow, 1).getValues();
  } else {
    Logger.log(`Sheet "${sheetName}" appears to be empty. Nothing to process.`);
    return;
  }

  const emailCounts = {};
  const rowsToHighlight = new Set();

  for (let i = 0; i < emailValues.length; i++) {
    const cellValue = emailValues[i][0];
    const email = normalizeEmail(cellValue);

    if (email === '') {
      continue;
    }

    if (emailCounts[email]) {
      rowsToHighlight.add(i + 1);
      rowsToHighlight.add(emailCounts[email]);
    } else {
      emailCounts[email] = i + 1;
    }
  }

  // 3. Clear existing background highlights in specified columns
  if (lastRow > 0) {
    sheet.getRange(1, 1, lastRow, lastHighlightCol).setBackground(null);
  }

  // 4. Apply new highlights
  let highlightedCount = 0;
  rowsToHighlight.forEach((rowNum) => {
    if (rowNum > 0 && rowNum <= lastRow) {
      sheet.getRange(rowNum, 1, 1, lastHighlightCol).setBackground('red');
      highlightedCount++;
    }
  });

  SpreadsheetApp.flush();

  if (highlightedCount > 0) {
    Logger.log(
      `Sheet "${sheetName}": ${highlightedCount} row(s) with duplicates highlighted. Column A renumbered.`
    );
  } else {
    Logger.log(`Sheet "${sheetName}": No duplicate emails found. Column A renumbered.`);
  }
}

/**
 * Syncs pro_user_list sheet data with staff_list based on email matching.
 *
 * Purpose: Keeps pro_user_list (Gemini Pro license holders) up-to-date with staff information
 *
 * Process:
 * 1. Reads all staff data from staff_list sheet (source of truth for staff information)
 * 2. Builds an email-based lookup map for O(1) matching performance
 * 3. Reads pro_user_list data
 * 4. For each Pro user, looks up their email in the staff_list
 * 5. Updates their Name, Division, Job Title, and Person ID from staff_list
 * 6. Only writes back rows that have actual changes (performance optimization)
 *
 * Updated Fields:
 * - Name (from staff_list Full Name)
 * - Division (from staff_list Primary School Level)
 * - Job Title (from staff_list Job Title)
 * - Person ID (from staff_list Person ID)
 *
 * Note: Email column is the matching key and is never modified
 *
 * Triggered by:
 * - Manual menu selection: "Sync Pro User List from Staff List"
 * - Automatically on spreadsheet open (onOpen trigger)
 * - Automatically when staff_list is edited (onEdit trigger)
 */
function syncUserListFromCheatsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const staffList = spreadsheet.getSheetByName(CHEATSHEET_NAME);
  const userList = spreadsheet.getSheetByName(USER_LIST_NAME);

  // Validation
  if (!staffList) {
    spreadsheet.toast(`Sheet "${CHEATSHEET_NAME}" not found.`, 'Error', 5);
    return;
  }
  if (!userList) {
    spreadsheet.toast(`Sheet "${USER_LIST_NAME}" not found.`, 'Error', 5);
    return;
  }

  const staffLastRow = staffList.getLastRow();
  const userLastRow = userList.getLastRow();

  if (staffLastRow < FIRST_DATA_ROW) {
    spreadsheet.toast('Staff list has no data to sync.', 'Error', 5);
    return;
  }
  if (userLastRow < FIRST_DATA_ROW) {
    spreadsheet.toast('Pro user list has no data to update.', 'Error', 5);
    return;
  }

  // Read all data from Staff List (including header for reference)
  const staffData = staffList
    .getRange(FIRST_DATA_ROW, 1, staffLastRow - FIRST_DATA_ROW + 1, 9)
    .getValues();

  // Build email lookup map from Staff List
  const staffMap = {};
  for (let i = 0; i < staffData.length; i++) {
    const email = normalizeEmail(staffData[i][CHEAT_COLS.EMAIL]);

    if (email !== '') {
      staffMap[email] = {
        personId: staffData[i][CHEAT_COLS.PERSON_ID],
        fullName: staffData[i][CHEAT_COLS.FULL_NAME],
        primarySchool: staffData[i][CHEAT_COLS.PRIMARY_SCHOOL],
        jobTitle: staffData[i][CHEAT_COLS.JOB_TITLE],
        roles: staffData[i][CHEAT_COLS.ROLES],
      };
    }
  }

  // Read all data from User list
  const userData = userList
    .getRange(FIRST_DATA_ROW, 1, userLastRow - FIRST_DATA_ROW + 1, 6)
    .getValues();

  let matchCount = 0;
  let updateCount = 0;
  const updates = [];

  // Process each user row
  for (let i = 0; i < userData.length; i++) {
    const userEmail = normalizeEmail(userData[i][USER_COLS.EMAIL]);

    if (userEmail !== '' && staffMap[userEmail]) {
      matchCount++;
      const staffRecord = staffMap[userEmail];

      // Check if any field needs updating
      const needsUpdate =
        userData[i][USER_COLS.NAME] !== staffRecord.fullName ||
        userData[i][USER_COLS.DIVISION] !== staffRecord.primarySchool ||
        userData[i][USER_COLS.JOB_TITLE] !== staffRecord.jobTitle ||
        userData[i][USER_COLS.PERSON_ID] !== staffRecord.personId;

      if (needsUpdate) {
        updateCount++;
        // Update the row data (keep No and Email as-is)
        userData[i][USER_COLS.NAME] = staffRecord.fullName;
        userData[i][USER_COLS.DIVISION] = staffRecord.primarySchool;
        userData[i][USER_COLS.JOB_TITLE] = staffRecord.jobTitle;
        userData[i][USER_COLS.PERSON_ID] = staffRecord.personId;
      }
    }
  }

  // Write updated data back to User list
  if (updateCount > 0) {
    userList.getRange(FIRST_DATA_ROW, 1, userData.length, 6).setValues(userData);
    SpreadsheetApp.flush();
  }

  // Report results
  const message = `Sync complete: ${matchCount} email(s) matched, ${updateCount} row(s) updated.`;
  spreadsheet.toast(message, 'Sync Results', 7);
  Logger.log(message);
}

/**
 * Syncs Usage data to pro_user_list based on email matching.
 *
 * Purpose: Updates Pro user usage information from dual data sources (numbers + labels)
 *
 * Data Sources:
 * - usage_counts: Numerical usage values and Active Days (e.g., 2692, 15 days)
 * - usage_by_priority: Priority labels (High, Medium, Low, Zero)
 *
 * Process:
 * 1. Reads numerical usage data from usage_counts sheet
 * 2. Reads priority labels from usage_by_priority sheet
 * 3. Builds two separate email-based lookup maps
 * 4. Matches each pro_user_list entry by email
 * 5. Updates Usage column with PRIORITY LABEL (not numbers)
 * 6. Updates Active Days column with numerical value
 * 7. Applies color coding to Usage column based on priority
 * 8. Only writes back rows with actual changes
 *
 * Updated Fields:
 * - Usage: Priority label from usage_by_priority (e.g., "High")
 * - Active Days: Numerical value from usage_counts (e.g., 15)
 *
 * Color Coding:
 * - High: Red background
 * - Medium: Orange background
 * - Low: Yellow background
 * - Zero: Green background
 *
 * Triggered by:
 * - Manual menu selection: "Sync Usage Data to Pro User List"
 * - Automatically on spreadsheet open (onOpen trigger)
 * - Automatically when usage_counts or usage_by_priority is edited (onEdit trigger)
 */
function syncUsageDataToUserList() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const usageCountsSheet = spreadsheet.getSheetByName(USAGE_COUNTS_SHEET_NAME);
  const usagePrioritySheet = spreadsheet.getSheetByName(USAGE_PRIORITY_SHEET_NAME);
  const userList = spreadsheet.getSheetByName(USER_LIST_NAME);

  // Validation
  if (!usageCountsSheet) {
    spreadsheet.toast(`Sheet "${USAGE_COUNTS_SHEET_NAME}" not found.`, 'Error', 5);
    return;
  }
  if (!usagePrioritySheet) {
    spreadsheet.toast(`Sheet "${USAGE_PRIORITY_SHEET_NAME}" not found.`, 'Error', 5);
    return;
  }
  if (!userList) {
    spreadsheet.toast(`Sheet "${USER_LIST_NAME}" not found.`, 'Error', 5);
    return;
  }

  const usageCountsLastRow = usageCountsSheet.getLastRow();
  const userLastRow = userList.getLastRow();

  if (usageCountsLastRow < FIRST_DATA_ROW) {
    spreadsheet.toast('Usage counts sheet has no data to sync.', 'Error', 5);
    return;
  }
  if (userLastRow < FIRST_DATA_ROW) {
    spreadsheet.toast('Pro user list has no data to update.', 'Error', 5);
    return;
  }

  // Read all data from usage_counts sheet (all 10 columns) for Active Days
  const usageCountsData = usageCountsSheet
    .getRange(FIRST_DATA_ROW, 1, usageCountsLastRow - FIRST_DATA_ROW + 1, 10)
    .getValues();

  // Read all data from usage_by_priority sheet (all 10 columns) for priority labels
  const usagePriorityLastRow = usagePrioritySheet.getLastRow();
  const usagePriorityData =
    usagePriorityLastRow >= FIRST_DATA_ROW
      ? usagePrioritySheet
          .getRange(FIRST_DATA_ROW, 1, usagePriorityLastRow - FIRST_DATA_ROW + 1, 10)
          .getValues()
      : [];

  // Build email lookup map from usage_counts sheet (for Active Days)
  const usageCountsMap = {};
  for (let i = 0; i < usageCountsData.length; i++) {
    const email = normalizeEmail(usageCountsData[i][USAGE_COLS.EMAIL]);

    if (email !== '') {
      usageCountsMap[email] = {
        activeDays: usageCountsData[i][USAGE_COLS.ACTIVE_DAYS],
      };
    }
  }

  // Build email lookup map from usage_by_priority sheet (for priority labels)
  const usagePriorityMap = {};
  for (let i = 0; i < usagePriorityData.length; i++) {
    const email = normalizeEmail(usagePriorityData[i][USAGE_COLS.EMAIL]);

    if (email !== '') {
      usagePriorityMap[email] = {
        overallUsagePriority: usagePriorityData[i][USAGE_COLS.OVERALL_USAGE] || 'Zero',
      };
    }
  }

  // Read all data from User list (now including columns G and H)
  const userData = userList
    .getRange(FIRST_DATA_ROW, 1, userLastRow - FIRST_DATA_ROW + 1, 8)
    .getValues();

  let matchCount = 0;
  let updateCount = 0;

  // Process each user row
  for (let i = 0; i < userData.length; i++) {
    const userEmail = normalizeEmail(userData[i][USER_COLS.EMAIL]);

    if (userEmail !== '' && (usagePriorityMap[userEmail] || usageCountsMap[userEmail])) {
      matchCount++;
      const priorityRecord = usagePriorityMap[userEmail] || { overallUsagePriority: 'Zero' };
      const countsRecord = usageCountsMap[userEmail] || { activeDays: 0 };

      // Check if any field needs updating
      const needsUpdate =
        userData[i][USER_COLS.USAGE] !== priorityRecord.overallUsagePriority ||
        userData[i][USER_COLS.ACTIVE_DAYS] !== countsRecord.activeDays;

      if (needsUpdate) {
        updateCount++;
        // Update the row data with PRIORITY LABEL (not number) and Active Days
        userData[i][USER_COLS.USAGE] = priorityRecord.overallUsagePriority;
        userData[i][USER_COLS.ACTIVE_DAYS] = countsRecord.activeDays;
      }
    }
  }

  // Write updated data back to User list
  if (updateCount > 0) {
    userList.getRange(FIRST_DATA_ROW, 1, userData.length, 8).setValues(userData);
    SpreadsheetApp.flush();
  }

  // Apply color coding to Usage column (Column G) based on priority data
  applyUsageColorCoding(userList, userLastRow, usagePrioritySheet);

  // Report results
  const message = `Usage sync complete: ${matchCount} email(s) matched, ${updateCount} row(s) updated.`;
  spreadsheet.toast(message, 'Usage Sync Results', 7);
  Logger.log(message);
}

/**
 * Applies color coding to the Usage column in pro_user_list based on priority data.
 * Reads priority labels (High, Medium, Low, Zero) from usage_by_priority sheet.
 * High = Red, Medium = Orange, Low = Yellow, Zero = Green
 * Only colors Gemini Pro license holders in the pro_user_list.
 */
function applyUsageColorCoding(userList, lastRow, usagePrioritySheet) {
  if (lastRow < FIRST_DATA_ROW) {
    return;
  }

  // Read priority data from usage_by_priority sheet
  const priorityLastRow = usagePrioritySheet.getLastRow();
  if (priorityLastRow < FIRST_DATA_ROW) {
    Logger.log('No priority data available for color coding.');
    return;
  }

  // Read all data from usage_by_priority sheet (columns A and B: Email and Overall usage priority)
  const priorityData = usagePrioritySheet
    .getRange(FIRST_DATA_ROW, 1, priorityLastRow - FIRST_DATA_ROW + 1, 2)
    .getValues();

  // Build email lookup map from priority sheet
  const priorityMap = {};
  for (let i = 0; i < priorityData.length; i++) {
    const email = normalizeEmail(priorityData[i][0]);
    const priority = priorityData[i][1]; // Overall usage priority (High, Medium, Low, Zero)

    if (email !== '') {
      priorityMap[email] = priority;
    }
  }

  // Read email addresses from User list
  const userEmails = userList
    .getRange(FIRST_DATA_ROW, USER_COLS.EMAIL + 1, lastRow - FIRST_DATA_ROW + 1, 1)
    .getValues();

  const usageColumn = USER_COLS.USAGE + 1; // Convert 0-based to 1-based column number
  const usageRange = userList.getRange(
    FIRST_DATA_ROW,
    usageColumn,
    lastRow - FIRST_DATA_ROW + 1,
    1
  );
  const backgrounds = [];

  for (let i = 0; i < userEmails.length; i++) {
    const email = normalizeEmail(userEmails[i][0]);
    const priority = priorityMap[email] || '';
    const status = String(priority || '').trim();
    backgrounds.push([USAGE_COLORS[status] || null]);
  }

  usageRange.setBackgrounds(backgrounds);
  SpreadsheetApp.flush();
}

/**
 * Generic function to apply color coding to Usage column on any sheet.
 * Works with any sheet that has:
 * - An email column for lookup
 * - A usage column with priority labels (High, Medium, Low, Zero)
 *
 * Color scheme: High = Red, Medium = Orange, Low = Yellow, Zero = Green
 *
 * @param {string} sheetName - Name of the sheet to apply color coding to
 * @param {number} emailColIndex - Column index (0-based) for email column
 * @param {number} usageColIndex - Column index (0-based) for usage column
 */
function applyUsageColorCodingToSheet(sheetName, emailColIndex, usageColIndex) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  const usagePrioritySheet = spreadsheet.getSheetByName(USAGE_PRIORITY_SHEET_NAME);

  if (!sheet) {
    Logger.log(`Sheet "${sheetName}" not found. Skipping color coding.`);
    return;
  }

  if (!usagePrioritySheet) {
    Logger.log('Usage priority sheet not found. Skipping color coding.');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < FIRST_DATA_ROW) {
    Logger.log(`Sheet "${sheetName}" has no data. Skipping color coding.`);
    return;
  }

  // Read priority data from usage_by_priority sheet
  const priorityLastRow = usagePrioritySheet.getLastRow();
  if (priorityLastRow < FIRST_DATA_ROW) {
    Logger.log('No priority data available for color coding.');
    return;
  }

  const priorityData = usagePrioritySheet
    .getRange(FIRST_DATA_ROW, 1, priorityLastRow - FIRST_DATA_ROW + 1, 2)
    .getValues();

  // Build email lookup map from priority sheet
  const priorityMap = {};
  for (let i = 0; i < priorityData.length; i++) {
    const email = normalizeEmail(priorityData[i][0]);
    const priority = priorityData[i][1];

    if (email !== '') {
      priorityMap[email] = priority;
    }
  }

  // Read email addresses from sheet
  const sheetEmails = sheet
    .getRange(FIRST_DATA_ROW, emailColIndex + 1, lastRow - FIRST_DATA_ROW + 1, 1)
    .getValues();

  const usageColumn = usageColIndex + 1; // Convert 0-based to 1-based column number
  const usageRange = sheet.getRange(FIRST_DATA_ROW, usageColumn, lastRow - FIRST_DATA_ROW + 1, 1);
  const backgrounds = [];

  for (let i = 0; i < sheetEmails.length; i++) {
    const email = normalizeEmail(sheetEmails[i][0]);
    const priority = priorityMap[email] || '';
    const status = String(priority || '').trim();
    backgrounds.push([USAGE_COLORS[status] || null]);
  }

  usageRange.setBackgrounds(backgrounds);
  SpreadsheetApp.flush();
  Logger.log(`Applied color coding to ${sheetName} Usage column`);
}

/**
 * Ensures that Usage and Active Days headers are present in specified columns.
 * If the header row (row 1) doesn't have the correct headers, they will be added.
 *
 * @param {string} sheetName - Name of the sheet to check/update headers
 * @param {number} usageColIndex - Column index (1-based) for Usage header
 * @param {number} activeDaysColIndex - Column index (1-based) for Active Days header
 */
function ensureUsageHeaders(sheetName, usageColIndex, activeDaysColIndex) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    Logger.log(`Sheet "${sheetName}" not found. Skipping header check.`);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 1) {
    Logger.log(`Sheet "${sheetName}" has no rows. Skipping header check.`);
    return;
  }

  // Check and set Usage header
  const usageHeader = sheet.getRange(HEADER_ROW, usageColIndex).getValue();
  if (usageHeader === '' || usageHeader === null) {
    sheet.getRange(HEADER_ROW, usageColIndex).setValue('Usage');
    sheet
      .getRange(HEADER_ROW, usageColIndex)
      .setFontWeight('bold')
      .setBackground('#1a2d58')
      .setFontColor('#ffffff');
    Logger.log(`Added "Usage" header to ${sheetName} column ${usageColIndex}`);
  }

  // Check and set Active Days header
  const activeDaysHeader = sheet.getRange(HEADER_ROW, activeDaysColIndex).getValue();
  if (activeDaysHeader === '' || activeDaysHeader === null) {
    sheet.getRange(HEADER_ROW, activeDaysColIndex).setValue('Active Days');
    sheet
      .getRange(HEADER_ROW, activeDaysColIndex)
      .setFontWeight('bold')
      .setBackground('#1a2d58')
      .setFontColor('#ffffff');
    Logger.log(`Added "Active Days" header to ${sheetName} column ${activeDaysColIndex}`);
  }

  SpreadsheetApp.flush();
}

/**
 * Syncs usage data from usage_counts and usage_by_priority to all user sheets.
 *
 * Updates usage information for:
 * - pro_user_list (Gemini Pro license holders)
 * - staff_list (all staff members)
 * - student_gemini_access (students with Gemini access)
 *
 * For each sheet, updates:
 * - Usage column (Column G): Priority label (High, Medium, Low, Zero)
 * - Active Days column (Column H): Numerical active days count
 */
function syncUsageDataToAllSheets() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const usageCountsSheet = spreadsheet.getSheetByName(USAGE_COUNTS_SHEET_NAME);
  const usagePrioritySheet = spreadsheet.getSheetByName(USAGE_PRIORITY_SHEET_NAME);

  if (!usageCountsSheet || !usagePrioritySheet) {
    Logger.log('Usage sheets not found. Skipping usage sync.');
    return;
  }

  // Build lookup maps for usage data
  const { usageCountsMap, usagePriorityMap } = buildUsageLookupMaps(
    usageCountsSheet,
    usagePrioritySheet
  );

  // Ensure headers are present on all sheets
  ensureUsageHeaders(CHEATSHEET_NAME, CHEAT_COLS.USAGE + 1, CHEAT_COLS.ACTIVE_DAYS + 1); // Columns H, I (8, 9)
  ensureUsageHeaders(
    STUDENT_GEMINI_ACCESS_SHEET_NAME,
    STUDENT_COLS.USAGE + 1,
    STUDENT_COLS.ACTIVE_DAYS + 1
  ); // Columns G, H (7, 8)

  // Sync to pro_user_list (maintains backward compatibility with existing function)
  syncUsageDataToUserList();

  // Sync to staff_list
  syncUsageToSheet(spreadsheet, CHEATSHEET_NAME, CHEAT_COLS, usageCountsMap, usagePriorityMap, 9);

  // Sync to student_gemini_access
  syncUsageToSheet(
    spreadsheet,
    STUDENT_GEMINI_ACCESS_SHEET_NAME,
    STUDENT_COLS,
    usageCountsMap,
    usagePriorityMap,
    8
  );

  // Apply color coding to all sheets with usage columns
  applyUsageColorCodingToSheet(CHEATSHEET_NAME, CHEAT_COLS.EMAIL, CHEAT_COLS.USAGE);
  applyUsageColorCodingToSheet(
    STUDENT_GEMINI_ACCESS_SHEET_NAME,
    STUDENT_COLS.EMAIL,
    STUDENT_COLS.USAGE
  );

  spreadsheet.toast('Usage data synced to all sheets', 'Sync Complete', 5);
}

/**
 * Helper function to build usage lookup maps from usage sheets.
 * Returns two maps: one for numerical counts, one for priority labels.
 */
function buildUsageLookupMaps(usageCountsSheet, usagePrioritySheet) {
  const usageCountsLastRow = usageCountsSheet.getLastRow();
  const usagePriorityLastRow = usagePrioritySheet.getLastRow();

  const usageCountsData =
    usageCountsLastRow >= FIRST_DATA_ROW
      ? usageCountsSheet
          .getRange(FIRST_DATA_ROW, 1, usageCountsLastRow - FIRST_DATA_ROW + 1, 10)
          .getValues()
      : [];

  const usagePriorityData =
    usagePriorityLastRow >= FIRST_DATA_ROW
      ? usagePrioritySheet
          .getRange(FIRST_DATA_ROW, 1, usagePriorityLastRow - FIRST_DATA_ROW + 1, 10)
          .getValues()
      : [];

  // Build counts map
  const usageCountsMap = {};
  for (let i = 0; i < usageCountsData.length; i++) {
    const email = normalizeEmail(usageCountsData[i][USAGE_COLS.EMAIL]);
    if (email !== '') {
      usageCountsMap[email] = {
        activeDays: usageCountsData[i][USAGE_COLS.ACTIVE_DAYS] || 0,
      };
    }
  }

  // Build priority map
  const usagePriorityMap = {};
  for (let i = 0; i < usagePriorityData.length; i++) {
    const email = normalizeEmail(usagePriorityData[i][USAGE_COLS.EMAIL]);
    if (email !== '') {
      usagePriorityMap[email] = {
        overallUsagePriority: usagePriorityData[i][USAGE_COLS.OVERALL_USAGE] || 'Zero',
      };
    }
  }

  return { usageCountsMap, usagePriorityMap };
}

/**
 * Helper function to sync usage data to a specific sheet.
 * @param {Spreadsheet} spreadsheet - The active spreadsheet
 * @param {string} sheetName - Name of the sheet to update
 * @param {object} colDefs - Column definitions object
 * @param {object} usageCountsMap - Map of email to usage counts
 * @param {object} usagePriorityMap - Map of email to usage priority
 * @param {number} totalCols - Total number of columns to read/write
 */
function syncUsageToSheet(
  spreadsheet,
  sheetName,
  colDefs,
  usageCountsMap,
  usagePriorityMap,
  totalCols
) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(`Sheet "${sheetName}" not found. Skipping.`);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < FIRST_DATA_ROW) {
    Logger.log(`Sheet "${sheetName}" has no data. Skipping.`);
    return;
  }

  const sheetData = sheet
    .getRange(FIRST_DATA_ROW, 1, lastRow - FIRST_DATA_ROW + 1, totalCols)
    .getValues();
  let updateCount = 0;

  for (let i = 0; i < sheetData.length; i++) {
    const email = normalizeEmail(sheetData[i][colDefs.EMAIL]);

    if (email !== '') {
      const countsRecord = usageCountsMap[email] || { activeDays: 0 };
      const priorityRecord = usagePriorityMap[email] || { overallUsagePriority: 'Zero' };

      const needsUpdate =
        sheetData[i][colDefs.USAGE] !== priorityRecord.overallUsagePriority ||
        sheetData[i][colDefs.ACTIVE_DAYS] !== countsRecord.activeDays;

      if (needsUpdate) {
        updateCount++;
        sheetData[i][colDefs.USAGE] = priorityRecord.overallUsagePriority;
        sheetData[i][colDefs.ACTIVE_DAYS] = countsRecord.activeDays;
      }
    }
  }

  if (updateCount > 0) {
    sheet.getRange(FIRST_DATA_ROW, 1, sheetData.length, totalCols).setValues(sheetData);
    Logger.log(`Updated ${updateCount} rows in ${sheetName}`);
  }
}

/**
 * Creates or updates the untracked_users sheet with users who have usage but aren't in any known list.
 *
 * Purpose: Provides a dedicated sheet listing all untracked users for easy review and management
 *
 * Columns:
 * - Email
 * - Usage Priority (High, Medium, Low, Zero)
 * - Overall Usage (numerical)
 * - Active Days
 * - Last Updated (timestamp)
 */
function updateUntrackedUsersSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Get untracked users data using existing function
  const usageData = getUsageData();
  const untrackedData = usageData.untrackedUsers;

  if (!untrackedData) {
    Logger.log('No untracked users data available');
    return;
  }

  // Get or create the untracked_users sheet
  let sheet = spreadsheet.getSheetByName(UNTRACKED_USERS_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(UNTRACKED_USERS_SHEET_NAME);

    // Set up headers
    const headers = [['Email', 'Usage Priority', 'Overall Usage', 'Active Days', 'Last Updated']];
    sheet.getRange(1, 1, 1, 5).setValues(headers);
    sheet
      .getRange(1, 1, 1, 5)
      .setFontWeight('bold')
      .setBackground('#1a2d58')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  // Clear existing data (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
  }

  // Populate with untracked users
  if (untrackedData.count > 0) {
    const now = new Date();
    const rows = untrackedData.users.map((user) => [
      user.email,
      user.priority,
      user.overallUsage,
      user.activeDays,
      now,
    ]);

    sheet.getRange(2, 1, rows.length, 5).setValues(rows);

    // Apply formatting
    sheet.autoResizeColumns(1, 5);
    sheet.setColumnWidth(5, 150); // Timestamp column

    spreadsheet.toast(
      `Found ${untrackedData.count} untracked user(s)`,
      'Untracked Users Updated',
      5
    );
  } else {
    sheet.getRange(2, 1, 1, 5).setValues([['No untracked users found', '', '', '', new Date()]]);
    spreadsheet.toast('No untracked users found', 'Untracked Users Updated', 3);
  }

  Logger.log(`Untracked users sheet updated with ${untrackedData.count} users`);
}

/**
 * Auto-trigger function that runs automatically every time the spreadsheet is edited.
 *
 * Purpose: Maintains data integrity by automatically syncing and processing data
 * when relevant sheets are edited.
 *
 * Sheet-Specific Behaviors:
 *
 * 1. pro_user_list (Gemini Pro license holders):
 *    - Automatically renumbers Column A sequentially (1, 2, 3...)
 *    - Detects duplicate emails in Column C
 *    - Highlights duplicate email rows in red (columns A:E)
 *
 * 2. staff_list (all staff information):
 *    - Triggers sync to pro_user_list
 *    - Updates Name, Division, Job Title, Person ID for Pro users
 *
 * 3. usage_counts OR usage_by_priority (usage data):
 *    - Triggers usage data sync to ALL sheets
 *    - Updates untracked users sheet
 *    - Updates Usage column with priority labels
 *    - Updates Active Days column with numerical values
 *    - Applies color coding based on priority
 *
 * Note: This is a "simple trigger" in Google Apps Script, which means it:
 * - Runs automatically without manual installation
 * - Has limited permissions (can't send emails, access external services)
 * - Only processes the specific sheet that was edited (optimized for performance)
 *
 * @param {GoogleAppsScript.Events.SheetsOnEdit} e The event object containing edit details
 */
function onEdit(e) {
  // Get the sheet that was actually edited
  const editedSheet = e.range.getSheet();
  const spreadsheet = e.source;
  const sheetName = editedSheet.getName();

  // Process pro_user_list: renumber and highlight duplicates
  if (sheetName === USER_LIST_NAME) {
    processSheetNumberingAndDuplicates(USER_LIST_NAME, USER_COLS.EMAIL + 1, 6);
    return;
  }

  // Process staff_list: renumber, highlight duplicates, and sync data to pro_user_list
  if (sheetName === CHEATSHEET_NAME) {
    processSheetNumberingAndDuplicates(CHEATSHEET_NAME, CHEAT_COLS.EMAIL + 1, 9); // Email in Column D, highlight A-I
    syncUserListFromCheatsheet();
    return;
  }

  // Process student_gemini_access: renumber and highlight duplicates
  if (sheetName === STUDENT_GEMINI_ACCESS_SHEET_NAME) {
    processSheetNumberingAndDuplicates(STUDENT_GEMINI_ACCESS_SHEET_NAME, STUDENT_COLS.EMAIL + 1, 8); // Email in Column D, highlight A-H
    return;
  }

  // Process usage sheets: sync usage data to ALL sheets and update untracked users
  if (sheetName === USAGE_COUNTS_SHEET_NAME || sheetName === USAGE_PRIORITY_SHEET_NAME) {
    syncUsageDataToAllSheets();
    updateUntrackedUsersSheet();
    return;
  }
}

/**
 * Clears all red background highlights from columns A:E on the current sheet.
 */
function clearAllHighlightsOnCurrentSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getActiveSheet();

  if (!shouldProcessSheet(sheet)) {
    spreadsheet.toast(
      'Skipped: This sheet should not be processed due to its name.',
      'Operation Aborted',
      5
    );
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow > 0) {
    // To clear only from FIRST_DATA_ROW downwards:
    // if (lastRow >= FIRST_DATA_ROW) {
    //   sheet.getRange(FIRST_DATA_ROW, 1, lastRow - FIRST_DATA_ROW + 1, 5).setBackground(null);
    // }
    sheet.getRange(1, 1, lastRow, 5).setBackground(null); // Clears A1:E[lastRow]
    SpreadsheetApp.flush();
    spreadsheet.toast('Highlights cleared from A:E on the current sheet.', 'Clear Complete', 5);
    Logger.log('All highlights in A:E cleared on sheet: ' + sheet.getName());
  } else {
    spreadsheet.toast('Sheet is empty. Nothing to clear.', 'Info', 5);
  }
}

/**
 * Opens the progress dialog and runs the full sync sequence.
 * Called from the "Run Full Sync" menu item.
 */
function showProgressDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Progress').setWidth(520).setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(html, '🔄 Sync & Optimise');
}

/**
 * Runs all sync and optimisation operations in sequence.
 * Called by Progress.html via google.script.run.
 * Returns a structured result with a log and elapsed time.
 */
function runFullSync() {
  const start = Date.now();
  const log = [];
  const stepResults = [];

  function step(id, label, fn) {
    log.push({ message: label + '…', type: 'info' });
    try {
      fn();
      log.push({ message: '✓ ' + label, type: 'ok' });
      stepResults.push({ id: id, ok: true });
    } catch (e) {
      log.push({ message: '✗ ' + label + ': ' + e.message, type: 'err' });
      stepResults.push({ id: id, ok: false });
    }
  }

  step('dupes', 'Detecting duplicate emails', function () {
    processSheetNumberingAndDuplicates(USER_LIST_NAME, USER_COLS.EMAIL + 1, 6);
    processSheetNumberingAndDuplicates(CHEATSHEET_NAME, CHEAT_COLS.EMAIL + 1, 9);
    processSheetNumberingAndDuplicates(STUDENT_GEMINI_ACCESS_SHEET_NAME, STUDENT_COLS.EMAIL + 1, 8);
  });

  step('sync-staff', 'Syncing pro user list from staff list', function () {
    syncUserListFromCheatsheet();
  });

  step('sync-usage', 'Syncing usage data to all sheets', function () {
    syncUsageDataToAllSheets();
  });

  step('untracked', 'Updating untracked users sheet', function () {
    updateUntrackedUsersSheet();
  });

  step('colors', 'Applying usage colour coding', function () {
    applyUsageColorCoding();
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  log.push({ message: 'All done in ' + elapsed + 's', type: 'ok' });

  return { log: log, stepResults: stepResults, elapsed: elapsed };
}

/**
 * Retrieves usage data for all users from usage_counts and usage_by_priority sheets.
 *
 * This function performs the following:
 * 1. Reads numerical usage data from usage_counts sheet
 * 2. Reads priority labels (High, Medium, Low, Zero) from usage_by_priority sheet
 * 3. Identifies Gemini Pro license holders from pro_user_list sheet
 * 4. Identifies all known staff from staff_list sheet
 * 5. Identifies students with Gemini access from student_gemini_access sheet
 * 6. Tracks "untracked users" - users with usage > 0 who aren't in any known list
 *
 * Returns: Array of user objects with usage data, plus metadata about untracked users
 * Each user object contains:
 *   - email, overallUsage (number), overallUsagePriority (label)
 *   - activeDays, hasGeminiPro (boolean)
 *   - services (object with numerical values for each service)
 *   - servicesPriority (object with priority labels for each service)
 *
 * Result also includes:
 *   - result.untrackedUsers.count: Number of users with usage but not in any list
 *   - result.untrackedUsers.users: Array of untracked user details
 *
 * Includes all users regardless of Active Days (including 0 Active Days).
 */
function getUsageData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const usageCountsSheet = spreadsheet.getSheetByName(USAGE_COUNTS_SHEET_NAME);
  const usagePrioritySheet = spreadsheet.getSheetByName(USAGE_PRIORITY_SHEET_NAME);
  const userList = spreadsheet.getSheetByName(USER_LIST_NAME);
  const staffList = spreadsheet.getSheetByName(CHEATSHEET_NAME);

  // Validation
  if (!usageCountsSheet) {
    throw new Error(`Sheet "${USAGE_COUNTS_SHEET_NAME}" not found.`);
  }
  if (!usagePrioritySheet) {
    throw new Error(`Sheet "${USAGE_PRIORITY_SHEET_NAME}" not found.`);
  }

  const lastRow = usageCountsSheet.getLastRow();

  if (lastRow < FIRST_DATA_ROW) {
    return []; // No data to return
  }

  // Build set of Gemini Pro license holders from pro_user_list
  const geminiProUsers = new Set();
  if (userList) {
    const userListLastRow = userList.getLastRow();
    if (userListLastRow >= FIRST_DATA_ROW) {
      const userListEmails = userList
        .getRange(FIRST_DATA_ROW, USER_COLS.EMAIL + 1, userListLastRow - FIRST_DATA_ROW + 1, 1)
        .getValues();
      for (let i = 0; i < userListEmails.length; i++) {
        const email = normalizeEmail(userListEmails[i][0]);
        if (email !== '') {
          geminiProUsers.add(email);
        }
      }
    }
  }

  // Build set of all known staff from staff_list
  // This includes all staff members (both Basic and Pro license holders)
  const knownStaff = new Set();
  if (staffList) {
    const staffLastRow = staffList.getLastRow();
    if (staffLastRow >= FIRST_DATA_ROW) {
      const staffEmails = staffList
        .getRange(FIRST_DATA_ROW, CHEAT_COLS.EMAIL + 1, staffLastRow - FIRST_DATA_ROW + 1, 1)
        .getValues();
      for (let i = 0; i < staffEmails.length; i++) {
        const email = normalizeEmail(staffEmails[i][0]);
        if (email !== '') {
          knownStaff.add(email);
        }
      }
    }
  }

  // Build set of students with Gemini access
  // This helps identify which usage records belong to students vs staff
  const studentUsers = new Set();
  const studentAccessSheet = spreadsheet.getSheetByName(STUDENT_GEMINI_ACCESS_SHEET_NAME);
  if (studentAccessSheet) {
    const studentLastRow = studentAccessSheet.getLastRow();
    if (studentLastRow >= FIRST_DATA_ROW) {
      const studentEmails = studentAccessSheet
        .getRange(FIRST_DATA_ROW, STUDENT_COLS.EMAIL + 1, studentLastRow - FIRST_DATA_ROW + 1, 1)
        .getValues();
      for (let i = 0; i < studentEmails.length; i++) {
        const email = normalizeEmail(studentEmails[i][0]);
        if (email !== '') {
          studentUsers.add(email);
        }
      }
    }
  }

  // Build set of students WITHOUT Gemini access - these should be excluded from all metrics
  const studentsNoGemini = new Set();
  const studentNoAccessSheet = spreadsheet.getSheetByName(STUDENT_NO_GEMINI_ACCESS_SHEET_NAME);
  if (studentNoAccessSheet) {
    const noAccessLastRow = studentNoAccessSheet.getLastRow();
    if (noAccessLastRow >= FIRST_DATA_ROW) {
      // Assuming same column structure as student_gemini_access
      const noAccessEmails = studentNoAccessSheet
        .getRange(FIRST_DATA_ROW, STUDENT_COLS.EMAIL + 1, noAccessLastRow - FIRST_DATA_ROW + 1, 1)
        .getValues();
      for (let i = 0; i < noAccessEmails.length; i++) {
        const email = normalizeEmail(noAccessEmails[i][0]);
        if (email !== '') {
          studentsNoGemini.add(email);
        }
      }
    }
  }

  // Read all data from usage_counts sheet (all 10 columns) - numerical values
  const usageCountsData = usageCountsSheet
    .getRange(FIRST_DATA_ROW, 1, lastRow - FIRST_DATA_ROW + 1, 10)
    .getValues();

  // Read all data from usage_by_priority sheet (all 10 columns) - priority labels
  const priorityLastRow = usagePrioritySheet.getLastRow();
  const usagePriorityData =
    priorityLastRow >= FIRST_DATA_ROW
      ? usagePrioritySheet
          .getRange(FIRST_DATA_ROW, 1, priorityLastRow - FIRST_DATA_ROW + 1, 10)
          .getValues()
      : [];

  // Build email lookup map for priority labels
  const priorityMap = {};
  for (let i = 0; i < usagePriorityData.length; i++) {
    const email = normalizeEmail(usagePriorityData[i][USAGE_COLS.EMAIL]);

    if (email !== '') {
      priorityMap[email] = {
        overallUsagePriority: usagePriorityData[i][USAGE_COLS.OVERALL_USAGE] || 'Zero',
        servicesPriority: {
          Gmail: usagePriorityData[i][USAGE_COLS.GMAIL] || 'Zero',
          Docs: usagePriorityData[i][USAGE_COLS.DOCS] || 'Zero',
          Sheets: usagePriorityData[i][USAGE_COLS.SHEETS] || 'Zero',
          Slides: usagePriorityData[i][USAGE_COLS.SLIDES] || 'Zero',
          Drive: usagePriorityData[i][USAGE_COLS.DRIVE] || 'Zero',
          Meet: usagePriorityData[i][USAGE_COLS.MEET] || 'Zero',
          Gemini: usagePriorityData[i][USAGE_COLS.GEMINI] || 'Zero',
        },
      };
    }
  }

  // Filter and transform data, tracking untracked users
  const result = [];

  // Track users who have usage data but aren't in any known list
  // These are "ghost" users - could be former employees, test accounts, or data quality issues
  let untrackedUsersCount = 0;
  const untrackedUsersList = [];

  for (let i = 0; i < usageCountsData.length; i++) {
    const row = usageCountsData[i];
    const activeDays = parseInt(row[USAGE_COLS.ACTIVE_DAYS]) || 0;
    const overallUsage = parseInt(row[USAGE_COLS.OVERALL_USAGE]) || 0;
    const email = normalizeEmail(row[USAGE_COLS.EMAIL]);

    // SKIP students without Gemini access - they should be excluded from all metrics
    if (studentsNoGemini.has(email)) {
      continue;
    }

    // Get priority labels for this email
    const priorityLabels = priorityMap[email] || {
      overallUsagePriority: 'Zero',
      servicesPriority: {
        Gmail: 'Zero',
        Docs: 'Zero',
        Sheets: 'Zero',
        Slides: 'Zero',
        Drive: 'Zero',
        Meet: 'Zero',
        Gemini: 'Zero',
      },
    };

    // Check if this user has usage but isn't in any known list
    if (email !== '' && overallUsage > 0) {
      const isTracked =
        geminiProUsers.has(email) || knownStaff.has(email) || studentUsers.has(email);

      if (!isTracked) {
        untrackedUsersCount++;
        untrackedUsersList.push({
          email: row[USAGE_COLS.EMAIL] || '',
          overallUsage: overallUsage,
          activeDays: activeDays,
          priority: priorityLabels.overallUsagePriority,
        });
      }
    }

    // Include all users (Active Days >= 0) except students without Gemini
    // This ensures Pro users with Zero priority and 0 Active Days are included
    if (email !== '') {
      result.push({
        email: row[USAGE_COLS.EMAIL] || '',
        overallUsage: overallUsage,
        overallUsagePriority: priorityLabels.overallUsagePriority,
        activeDays: activeDays,
        hasGeminiPro: geminiProUsers.has(email),
        isStaff: knownStaff.has(email),
        isStudent: studentUsers.has(email),
        services: {
          Gmail: row[USAGE_COLS.GMAIL] || 0,
          Docs: row[USAGE_COLS.DOCS] || 0,
          Sheets: row[USAGE_COLS.SHEETS] || 0,
          Slides: row[USAGE_COLS.SLIDES] || 0,
          Drive: row[USAGE_COLS.DRIVE] || 0,
          Meet: row[USAGE_COLS.MEET] || 0,
          Gemini: row[USAGE_COLS.GEMINI] || 0,
        },
        servicesPriority: priorityLabels.servicesPriority,
      });
    }
  }

  Logger.log(
    `Retrieved ${result.length} users from usage data out of ${usageCountsData.length} total users.`
  );
  Logger.log(`Gemini Pro license holders: ${geminiProUsers.size}`);
  Logger.log(`Known staff members: ${knownStaff.size}`);
  Logger.log(`Students with Gemini access: ${studentUsers.size}`);
  Logger.log(`Students without Gemini access (excluded): ${studentsNoGemini.size}`);
  Logger.log(`Untracked users with usage > 0: ${untrackedUsersCount}`);

  // Return as a proper object (not array with properties) for reliable serialization
  return {
    users: result,
    untrackedUsers: {
      count: untrackedUsersCount,
      users: untrackedUsersList,
    },
    studentsNoGeminiCount: studentsNoGemini.size,
  };
}

/**
 * Retrieves student Gemini access data from both student sheets.
 * Returns statistics about students with and without Gemini access, including grade distribution.
 */
function getStudentData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const studentAccessSheet = spreadsheet.getSheetByName(STUDENT_GEMINI_ACCESS_SHEET_NAME);
  const studentNoAccessSheet = spreadsheet.getSheetByName(STUDENT_NO_GEMINI_ACCESS_SHEET_NAME);

  const result = {
    withAccess: {
      total: 0,
      byGrade: {},
      byEnrollmentStatus: {},
      students: [],
    },
    withoutAccess: {
      total: 0,
    },
  };

  // Process students WITHOUT Gemini access (just count them)
  if (studentNoAccessSheet) {
    const noAccessLastRow = studentNoAccessSheet.getLastRow();
    if (noAccessLastRow >= FIRST_DATA_ROW) {
      result.withoutAccess.total = noAccessLastRow - FIRST_DATA_ROW + 1;
    }
  }

  // Process students WITH Gemini access (detailed analysis)
  if (studentAccessSheet) {
    const accessLastRow = studentAccessSheet.getLastRow();
    if (accessLastRow >= FIRST_DATA_ROW) {
      const studentData = studentAccessSheet
        .getRange(FIRST_DATA_ROW, 1, accessLastRow - FIRST_DATA_ROW + 1, 6)
        .getValues();

      result.withAccess.total = studentData.length;

      for (let i = 0; i < studentData.length; i++) {
        const row = studentData[i];
        const email = normalizeEmail(row[STUDENT_COLS.EMAIL]);
        const grade = String(row[STUDENT_COLS.CURRENT_GRADE] || 'Unknown');
        const enrollmentStatus = String(row[STUDENT_COLS.ENROLLMENT_STATUS] || 'Unknown');

        // Count by grade
        if (!result.withAccess.byGrade[grade]) {
          result.withAccess.byGrade[grade] = 0;
        }
        result.withAccess.byGrade[grade]++;

        // Count by enrollment status
        if (!result.withAccess.byEnrollmentStatus[enrollmentStatus]) {
          result.withAccess.byEnrollmentStatus[enrollmentStatus] = 0;
        }
        result.withAccess.byEnrollmentStatus[enrollmentStatus]++;

        // Store student data
        result.withAccess.students.push({
          no: row[STUDENT_COLS.NO],
          personId: row[STUDENT_COLS.PERSON_ID],
          fullName: row[STUDENT_COLS.FULL_NAME],
          email: email,
          currentGrade: grade,
          enrollmentStatus: enrollmentStatus,
        });
      }
    }
  }

  Logger.log(`Students with Gemini access: ${result.withAccess.total}`);
  Logger.log(`Students without Gemini access: ${result.withoutAccess.total}`);
  return result;
}

/**
 * Retrieves all staff email addresses from the staff_list sheet.
 * Used by the dashboard to identify staff members for filtering.
 *
 * Returns: Array of objects containing email addresses
 */
function getStaffEmails() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const staffList = spreadsheet.getSheetByName(CHEATSHEET_NAME);

  const result = [];

  if (!staffList) {
    Logger.log('Staff list sheet not found');
    return result;
  }

  const lastRow = staffList.getLastRow();
  if (lastRow < FIRST_DATA_ROW) {
    Logger.log('Staff list has no data');
    return result;
  }

  const staffData = staffList
    .getRange(FIRST_DATA_ROW, CHEAT_COLS.EMAIL + 1, lastRow - FIRST_DATA_ROW + 1, 1)
    .getValues();

  for (let i = 0; i < staffData.length; i++) {
    const email = normalizeEmail(staffData[i][0]);

    if (email !== '') {
      result.push({ email: email });
    }
  }

  Logger.log(`Retrieved ${result.length} staff emails`);
  return result;
}

/**
 * Retrieves usage data aggregated by division (PRIMARY_SCHOOL from staff_list).
 * Groups staff by division and cross-references with usage data.
 *
 * Returns: Object with per-division stats including user counts, usage averages,
 * priority breakdowns, and top users.
 */
function getDivisionData() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const staffList = spreadsheet.getSheetByName(CHEATSHEET_NAME);
  const usageCountsSheet = spreadsheet.getSheetByName(USAGE_COUNTS_SHEET_NAME);
  const usagePrioritySheet = spreadsheet.getSheetByName(USAGE_PRIORITY_SHEET_NAME);
  const userList = spreadsheet.getSheetByName(USER_LIST_NAME);

  if (!staffList || !usageCountsSheet || !usagePrioritySheet) {
    throw new Error('Required sheets not found.');
  }

  // Build usage lookup maps
  const { usageCountsMap, usagePriorityMap } = buildUsageLookupMaps(
    usageCountsSheet,
    usagePrioritySheet
  );

  // Build pro users set
  const geminiProUsers = new Set();
  if (userList) {
    const userLastRow = userList.getLastRow();
    if (userLastRow >= FIRST_DATA_ROW) {
      const userEmails = userList
        .getRange(FIRST_DATA_ROW, USER_COLS.EMAIL + 1, userLastRow - FIRST_DATA_ROW + 1, 1)
        .getValues();
      for (let i = 0; i < userEmails.length; i++) {
        const email = normalizeEmail(userEmails[i][0]);
        if (email !== '') geminiProUsers.add(email);
      }
    }
  }

  // Read staff data
  const staffLastRow = staffList.getLastRow();
  if (staffLastRow < FIRST_DATA_ROW) {
    return { divisions: {} };
  }

  const staffData = staffList
    .getRange(FIRST_DATA_ROW, 1, staffLastRow - FIRST_DATA_ROW + 1, 9)
    .getValues();

  // Group by division
  const divisions = {};

  for (let i = 0; i < staffData.length; i++) {
    const email = normalizeEmail(staffData[i][CHEAT_COLS.EMAIL]);
    const division = String(staffData[i][CHEAT_COLS.PRIMARY_SCHOOL] || 'Unknown').trim();

    if (email === '') continue;

    if (!divisions[division]) {
      divisions[division] = {
        userCount: 0,
        proCount: 0,
        totalUsage: 0,
        totalActiveDays: 0,
        priorityBreakdown: { High: 0, Medium: 0, Low: 0, Zero: 0 },
        users: [],
      };
    }

    const div = divisions[division];
    div.userCount++;

    if (geminiProUsers.has(email)) {
      div.proCount++;
    }

    const countsRecord = usageCountsMap[email] || { activeDays: 0 };
    const priorityRecord = usagePriorityMap[email] || { overallUsagePriority: 'Zero' };
    const activeDays = parseInt(countsRecord.activeDays) || 0;

    // Get numerical overall usage from usage_counts
    const usageCountsLastRow = usageCountsSheet.getLastRow();
    // We already have the map, but need overall usage - rebuild from counts map
    // Actually we need to read full usage data for this. Let's use a separate lookup.
    let overallUsage = 0;

    div.totalActiveDays += activeDays;

    const priority = String(priorityRecord.overallUsagePriority || 'Zero');
    if (div.priorityBreakdown[priority] !== undefined) {
      div.priorityBreakdown[priority]++;
    }

    div.users.push({
      email: staffData[i][CHEAT_COLS.EMAIL] || '',
      name: staffData[i][CHEAT_COLS.FULL_NAME] || '',
      jobTitle: staffData[i][CHEAT_COLS.JOB_TITLE] || '',
      hasGeminiPro: geminiProUsers.has(email),
      priority: priority,
      activeDays: activeDays,
    });
  }

  // Calculate averages and get top users
  Object.keys(divisions).forEach((divName) => {
    const div = divisions[divName];
    div.avgActiveDays = div.userCount > 0 ? Math.round(div.totalActiveDays / div.userCount) : 0;

    // Sort users by active days descending, take top 5
    div.topUsers = div.users.sort((a, b) => b.activeDays - a.activeDays).slice(0, 5);
  });

  Logger.log(`Division data retrieved for ${Object.keys(divisions).length} divisions`);
  return { divisions: divisions };
}

/**
 * Retrieves full profile data for a single user by email.
 * Includes staff info, usage data, and comparison with division averages.
 *
 * @param {string} email - The user's email address
 * @return {object} User profile data or null if not found
 */
function getUserProfile(email) {
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail === '') return null;

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const staffList = spreadsheet.getSheetByName(CHEATSHEET_NAME);
  const userList = spreadsheet.getSheetByName(USER_LIST_NAME);
  const usageCountsSheet = spreadsheet.getSheetByName(USAGE_COUNTS_SHEET_NAME);
  const usagePrioritySheet = spreadsheet.getSheetByName(USAGE_PRIORITY_SHEET_NAME);

  const profile = {
    email: normalizedEmail,
    name: '',
    division: '',
    jobTitle: '',
    personId: '',
    hasGeminiPro: false,
    overallUsage: 0,
    overallPriority: 'Zero',
    activeDays: 0,
    services: {},
    servicesPriority: {},
    divisionAvg: {},
  };

  // Find in staff_list
  if (staffList) {
    const staffLastRow = staffList.getLastRow();
    if (staffLastRow >= FIRST_DATA_ROW) {
      const staffData = staffList
        .getRange(FIRST_DATA_ROW, 1, staffLastRow - FIRST_DATA_ROW + 1, 9)
        .getValues();
      for (let i = 0; i < staffData.length; i++) {
        if (normalizeEmail(staffData[i][CHEAT_COLS.EMAIL]) === normalizedEmail) {
          profile.name = staffData[i][CHEAT_COLS.FULL_NAME] || '';
          profile.division = staffData[i][CHEAT_COLS.PRIMARY_SCHOOL] || '';
          profile.jobTitle = staffData[i][CHEAT_COLS.JOB_TITLE] || '';
          profile.personId = staffData[i][CHEAT_COLS.PERSON_ID] || '';
          break;
        }
      }
    }
  }

  // Check pro user status
  if (userList) {
    const userLastRow = userList.getLastRow();
    if (userLastRow >= FIRST_DATA_ROW) {
      const userEmails = userList
        .getRange(FIRST_DATA_ROW, USER_COLS.EMAIL + 1, userLastRow - FIRST_DATA_ROW + 1, 1)
        .getValues();
      for (let i = 0; i < userEmails.length; i++) {
        if (normalizeEmail(userEmails[i][0]) === normalizedEmail) {
          profile.hasGeminiPro = true;
          break;
        }
      }
    }
  }

  // Get usage counts
  if (usageCountsSheet) {
    const countsLastRow = usageCountsSheet.getLastRow();
    if (countsLastRow >= FIRST_DATA_ROW) {
      const countsData = usageCountsSheet
        .getRange(FIRST_DATA_ROW, 1, countsLastRow - FIRST_DATA_ROW + 1, 10)
        .getValues();
      for (let i = 0; i < countsData.length; i++) {
        if (normalizeEmail(countsData[i][USAGE_COLS.EMAIL]) === normalizedEmail) {
          profile.overallUsage = parseInt(countsData[i][USAGE_COLS.OVERALL_USAGE]) || 0;
          profile.activeDays = parseInt(countsData[i][USAGE_COLS.ACTIVE_DAYS]) || 0;
          profile.services = {
            Gmail: parseInt(countsData[i][USAGE_COLS.GMAIL]) || 0,
            Docs: parseInt(countsData[i][USAGE_COLS.DOCS]) || 0,
            Sheets: parseInt(countsData[i][USAGE_COLS.SHEETS]) || 0,
            Slides: parseInt(countsData[i][USAGE_COLS.SLIDES]) || 0,
            Drive: parseInt(countsData[i][USAGE_COLS.DRIVE]) || 0,
            Meet: parseInt(countsData[i][USAGE_COLS.MEET]) || 0,
            Gemini: parseInt(countsData[i][USAGE_COLS.GEMINI]) || 0,
          };
          break;
        }
      }
    }
  }

  // Get priority labels
  if (usagePrioritySheet) {
    const priorityLastRow = usagePrioritySheet.getLastRow();
    if (priorityLastRow >= FIRST_DATA_ROW) {
      const priorityData = usagePrioritySheet
        .getRange(FIRST_DATA_ROW, 1, priorityLastRow - FIRST_DATA_ROW + 1, 10)
        .getValues();
      for (let i = 0; i < priorityData.length; i++) {
        if (normalizeEmail(priorityData[i][USAGE_COLS.EMAIL]) === normalizedEmail) {
          profile.overallPriority = priorityData[i][USAGE_COLS.OVERALL_USAGE] || 'Zero';
          profile.servicesPriority = {
            Gmail: priorityData[i][USAGE_COLS.GMAIL] || 'Zero',
            Docs: priorityData[i][USAGE_COLS.DOCS] || 'Zero',
            Sheets: priorityData[i][USAGE_COLS.SHEETS] || 'Zero',
            Slides: priorityData[i][USAGE_COLS.SLIDES] || 'Zero',
            Drive: priorityData[i][USAGE_COLS.DRIVE] || 'Zero',
            Meet: priorityData[i][USAGE_COLS.MEET] || 'Zero',
            Gemini: priorityData[i][USAGE_COLS.GEMINI] || 'Zero',
          };
          break;
        }
      }
    }
  }

  // Calculate division average for comparison
  if (profile.division && staffList && usageCountsSheet) {
    const { usageCountsMap } = buildUsageLookupMaps(usageCountsSheet, usagePrioritySheet);
    const staffLastRow = staffList.getLastRow();
    if (staffLastRow >= FIRST_DATA_ROW) {
      const staffData = staffList
        .getRange(FIRST_DATA_ROW, 1, staffLastRow - FIRST_DATA_ROW + 1, 9)
        .getValues();
      let divCount = 0;
      let divTotalActiveDays = 0;

      for (let i = 0; i < staffData.length; i++) {
        const staffDivision = String(staffData[i][CHEAT_COLS.PRIMARY_SCHOOL] || '').trim();
        if (staffDivision === profile.division) {
          const staffEmail = normalizeEmail(staffData[i][CHEAT_COLS.EMAIL]);
          const record = usageCountsMap[staffEmail] || { activeDays: 0 };
          divCount++;
          divTotalActiveDays += parseInt(record.activeDays) || 0;
        }
      }

      profile.divisionAvg = {
        activeDays: divCount > 0 ? Math.round(divTotalActiveDays / divCount) : 0,
        userCount: divCount,
      };
    }
  }

  Logger.log(`Retrieved profile for ${normalizedEmail}`);
  return profile;
}
