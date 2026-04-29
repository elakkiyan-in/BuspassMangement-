// ═══════════════════════════════════════════════════════════════════════
// Mahendra Bus Pass System — Google Apps Script v3.1
// ═══════════════════════════════════════════════════════════════════════
// Deploy as Web App: Execute as Me, Anyone (or Anyone in org) can access

// ── CONFIGURATION ──────────────────────────────────────────────────────
const ROOT_FOLDER_NAME  = 'Mahendra_Bus_Pass';
const SHEET_NAME_BOARD  = 'Boarding';
const SHEET_NAME_NOPASS = 'Without_Pass';
const SHEET_NAME_BUSES  = 'Buses';
const SHEET_NAME_PHOTOS = 'Student_Photos_Log';

// ── MAIN ENTRY POINT ───────────────────────────────────────────────────
function doPost(e) {
  try {
    const body    = JSON.parse(e.postData.contents);
    const action  = body.action || '';
    const lock    = LockService.scriptLock();
    lock.tryLock(10000);

    let result;
    switch (action) {
      case 'writeBoarding':       result = writeBoarding(body);       break;
      case 'writeNoPass':         result = writeNoPass(body);         break;
      case 'syncWithoutPass':     result = syncWithoutPass(body);     break;
      case 'saveDailyPhoto':      result = saveDailyPhoto(body);      break;
      case 'saveStudentPhoto':    result = saveStudentPhoto(body);    break;
      case 'createDailyFolders':  result = createDailyFolders(body);  break;
      case 'saveBusList':         result = saveBusList(body);         break;
      case 'syncStudents':        result = syncStudents(body);        break;
      case 'writePasses':         result = syncStudents(body);        break; // alias
      default: result = { status: 'error', message: 'Unknown action: ' + action };
    }

    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action || '';
    const date   = e.parameter.date   || getTodayStr();
    const folder = e.parameter.folder || '';

    let result;
    switch (action) {
      case 'ping':             result = { status: 'ok', message: 'Connected', time: new Date().toLocaleTimeString() }; break;
      case 'driveInfo':        result = getDriveInfo();                break;
      case 'getSubFolderUrl':  result = getSubFolderUrl(date, folder); break;
      case 'getTodayFolder':   result = getTodayFolderUrl(date);       break;
      default: result = { status: 'error', message: 'Unknown GET action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── HELPERS ────────────────────────────────────────────────────────────
function getTodayStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getRootFolder() {
  const folders = DriveApp.getFoldersByName(ROOT_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(ROOT_FOLDER_NAME);
}

function getOrCreateFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function getOrCreateSpreadsheet() {
  const root = getRootFolder();
  const files = root.getFilesByName('BusPassData');
  if (files.hasNext()) return SpreadsheetApp.open(files.next());
  const ss = SpreadsheetApp.create('BusPassData');
  DriveApp.getFileById(ss.getId()).moveTo(root);
  return ss;
}

function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
      .setBackground('#1a1f38').setFontColor('#a78bfa');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ── WRITE BOARDING RECORDS ─────────────────────────────────────────────
function writeBoarding(body) {
  const rows = body.rows || [];
  if (!rows.length) return { status: 'ok', written: 0 };

  const ss    = getOrCreateSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEET_NAME_BOARD,
    ['Date','Name','Roll No','Reg No','Bus No','Pass Type','Time','Synced At']);

  const today = body.rows[0].date || getTodayStr();
  // Clear today's rows first (avoid duplicates)
  const data = sheet.getDataRange().getValues();
  const toDelete = [];
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === today) toDelete.push(i + 1);
  }
  toDelete.forEach(r => sheet.deleteRow(r));

  const now = new Date().toLocaleTimeString();
  const writeRows = rows.map(r => [
    r.date, r.name, r.rollNo, r.regNo, r.busNo, r.passType || 'Semester', r.time, now
  ]);
  if (writeRows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, writeRows.length, writeRows[0].length)
      .setValues(writeRows);
  }
  return { status: 'ok', written: writeRows.length };
}

// ── WRITE NO-PASS RECORDS ──────────────────────────────────────────────
function writeNoPass(body) {
  const rows = body.rows || [];
  if (!rows.length) return { status: 'ok', written: 0 };

  const ss    = getOrCreateSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEET_NAME_NOPASS,
    ['Date','Name','College','Bus No','Gender','Photo Link','Time']);

  const writeRows = rows.map(r => [
    r.date, r.name, r.college || '', r.bus || '', r.gender || '', r.photoLink || '', r.time
  ]);
  sheet.getRange(sheet.getLastRow() + 1, 1, writeRows.length, writeRows[0].length)
    .setValues(writeRows);

  return { status: 'ok', written: writeRows.length };
}

// ── SYNC WITHOUT-PASS (full replace for today) ─────────────────────────
function syncWithoutPass(body) {
  const date    = body.date       || getTodayStr();
  const entries = body.noPassList || [];

  const ss    = getOrCreateSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEET_NAME_NOPASS,
    ['Date','Name','Roll No','Bus No','Dept','Time','Photo Link']);

  // Remove today's rows
  const data = sheet.getDataRange().getValues();
  const del  = [];
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === date) del.push(i + 1);
  }
  del.forEach(r => sheet.deleteRow(r));

  if (entries.length) {
    const rows = entries.map(n => [date, n.name, n.rollNo, n.busNo, n.dept, n.time, n.photoLink || '']);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }
  return { status: 'ok', synced: entries.length };
}

// ── SAVE DAILY PHOTO (incharge → With_Pass / Without_Pass) ────────────
function saveDailyPhoto(body) {
  const date      = body.date      || getTodayStr();
  const folder    = body.folder    || 'Unknown';   // e.g. "Bus01/Boys/With_Pass"
  const base64    = body.base64Data || '';
  const name      = body.name      || 'photo';
  const rollNo    = body.rollNo    || '';
  const mimeType  = body.mimeType  || 'image/jpeg';
  const ext       = mimeType.includes('png') ? 'png' : 'jpg';

  if (!base64) return { status: 'error', message: 'No photo data' };

  const root         = getRootFolder();
  const dateFolder   = getOrCreateFolder(root, date);
  const parts        = folder.split('/');
  let   subFolder    = dateFolder;
  parts.forEach(p => { if (p) subFolder = getOrCreateFolder(subFolder, p); });

  const fileName = (rollNo ? rollNo + '_' : '') + name.replace(/\s+/g,'_').substring(0,40) + '.' + ext;
  const blob     = Utilities.newBlob(Utilities.base64Decode(base64.split(',').pop()), mimeType, fileName);
  const file     = subFolder.createFile(blob);

  return { status: 'ok', link: file.getUrl(), name: fileName };
}

// ── SAVE STUDENT PHOTO (Students → Boys/Girls subfolders) ─────────────
// NEW: Student photos saved to Student_Photos/Boys or Student_Photos/Girls
function saveStudentPhoto(body) {
  const base64   = body.base64Data || '';
  const name     = body.name       || 'student';
  const rollNo   = body.rollNo     || '';
  const gender   = body.gender     || '';   // 'Male' or 'Female'
  const mimeType = body.mimeType   || 'image/jpeg';
  const ext      = mimeType.includes('png') ? 'png' : 'jpg';

  if (!base64) return { status: 'error', message: 'No photo data' };

  const root          = getRootFolder();
  const photosFolder  = getOrCreateFolder(root, 'Student_Photos');

  // Create Boys/Girls subfolder based on gender
  let genderFolder;
  if (gender === 'Male') {
    genderFolder = getOrCreateFolder(photosFolder, 'Boys');
  } else if (gender === 'Female') {
    genderFolder = getOrCreateFolder(photosFolder, 'Girls');
  } else {
    genderFolder = getOrCreateFolder(photosFolder, 'Others');
  }

  const fileName = (rollNo ? rollNo + '_' : '') + name.replace(/\s+/g,'_').substring(0,40) + '.' + ext;
  const blob     = Utilities.newBlob(Utilities.base64Decode(base64.split(',').pop()), mimeType, fileName);
  const file     = genderFolder.createFile(blob);

  // Log to sheet
  const ss    = getOrCreateSpreadsheet();
  const sheet = getOrCreateSheet(ss, SHEET_NAME_PHOTOS,
    ['Date','Name','Roll No','Gender','Photo Link','Folder']);
  sheet.appendRow([getTodayStr(), name, rollNo, gender, file.getUrl(),
    'Student_Photos/' + (gender === 'Male' ? 'Boys' : gender === 'Female' ? 'Girls' : 'Others')]);

  return { status: 'ok', link: file.getUrl(), name: fileName, folder: genderFolder.getName() };
}

// ── CREATE DAILY FOLDERS (bus structure) ──────────────────────────────
function createDailyFolders(body) {
  const date    = body.date || getTodayStr();
  const busFilter = body.bus || null;

  const root       = getRootFolder();
  const dateFolder = getOrCreateFolder(root, date);

  // Get bus list from sheet
  const ss       = getOrCreateSpreadsheet();
  const busSheet = ss.getSheetByName(SHEET_NAME_BUSES);
  let buses = [];
  if (busSheet) {
    const data = busSheet.getDataRange().getValues();
    buses = data.slice(1).map(r => r[0]).filter(Boolean);
  }

  if (!buses.length) buses = ['Bus01', 'Bus02']; // fallback

  if (busFilter) buses = buses.filter(b => b === busFilter);

  let created = 0;
  buses.forEach(bus => {
    const busKey    = bus.replace(/\s+/g,'_');
    const busFolder = getOrCreateFolder(dateFolder, busKey);
    ['Boys', 'Girls'].forEach(gender => {
      const gFolder = getOrCreateFolder(busFolder, gender);
      getOrCreateFolder(gFolder, 'With_Pass');
      getOrCreateFolder(gFolder, 'Without_Pass');
      created += 2;
    });
  });

  return { status: 'ok', message: `Created folders for ${buses.length} bus(es) (${created} subfolders)`, date };
}

// ── SAVE BUS LIST ──────────────────────────────────────────────────────
function saveBusList(body) {
  const buses = body.buses || [];
  const ss    = getOrCreateSpreadsheet();

  let sheet = ss.getSheetByName(SHEET_NAME_BUSES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_BUSES);
  } else {
    sheet.clearContents();
  }

  sheet.getRange(1, 1).setValue('Bus No');
  sheet.getRange(1, 1).setFontWeight('bold').setBackground('#1a1f38').setFontColor('#a78bfa');

  if (buses.length) {
    sheet.getRange(2, 1, buses.length, 1).setValues(buses.map(b => [b]));
  }
  return { status: 'ok', saved: buses.length };
}

// ── GET SUB-FOLDER URL ─────────────────────────────────────────────────
// folder param: e.g. "Bus01/Boys/With_Pass"
function getSubFolderUrl(date, folder) {
  const root       = getRootFolder();
  const dateFolder = getOrCreateFolder(root, date);

  const parts  = folder.split('/');
  let subF     = dateFolder;
  for (const p of parts) {
    if (!p) continue;
    const children = subF.getFoldersByName(p);
    if (children.hasNext()) {
      subF = children.next();
    } else {
      // Auto-create if missing
      subF = subF.createFolder(p);
    }
  }
  return { status: 'ok', url: subF.getUrl(), folder };
}

// ── GET TODAY'S ROOT FOLDER URL ────────────────────────────────────────
function getTodayFolderUrl(date) {
  const root       = getRootFolder();
  const dateFolder = getOrCreateFolder(root, date);
  return { status: 'ok', url: dateFolder.getUrl(), date };
}

// ── DRIVE INFO ────────────────────────────────────────────────────────
function getDriveInfo() {
  try {
    const root = getRootFolder();
    return { status: 'ok', rootFolder: root.getName(), rootUrl: root.getUrl() };
  } catch (err) {
    return { status: 'error', message: err.message };
  }
}

// ── SYNC STUDENTS (full student list) ─────────────────────────────────
// action: 'syncStudents' or 'writePasses'
// body.students or body.passes = array of student objects
function syncStudents(body) {
  const students = body.students || body.passes || [];
  if (!students.length) return { status: 'ok', count: 0, message: 'No students to sync' };

  const ss = getOrCreateSpreadsheet();

  // Auto-detect headers from first student object
  const keys = Object.keys(students[0]);
  const headers = keys.map(k => k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1').trim());
  headers.push('Synced At');

  let sheet = ss.getSheetByName('Students');
  if (!sheet) {
    sheet = ss.insertSheet('Students');
  } else {
    sheet.clearContents();
  }

  // Write headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1a1f38')
    .setFontColor('#a78bfa');
  sheet.setFrozenRows(1);

  // Write data rows
  const now = new Date().toLocaleString();
  const rows = students.map(s => {
    const row = keys.map(k => {
      const v = s[k];
      return (v === null || v === undefined) ? '' : String(v);
    });
    row.push(now);
    return row;
  });

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  // Auto-resize columns
  for (let i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }

  return { status: 'ok', count: rows.length, message: rows.length + ' students synced to Sheet' };
}
