// config.js — Mahendra Bus Pass System v3.0
// Loaded before app scripts in every HTML file

window.BUS_CONFIG = {
  version: '3.0.0',

  // ── AUTH KEYS ──────────────────────────────────
  ADMIN_USER_KEY : 'bus_admin_username',
  ADMIN_PASS_KEY : 'bus_admin_password',
  DEFAULT_ADMIN_USER : 'Maha123',
  DEFAULT_ADMIN_PASS : 'Maha@123',

  // ── STORAGE KEYS ───────────────────────────────
  keys: {
    students  : 'bus_students',
    boarding  : 'bus_boarding',
    nopass    : 'bus_nopass_today',
    absent    : 'bus_absent_today',
    sheetUrl  : 'bus_sheet_url',
    incharges : 'bus_incharges',
    buses     : 'bus_list',
    colleges  : 'bus_colleges',
    scanFields : 'bus_scan_fields',
    boardFields: 'bus_board_fields',
    studentFields: 'bus_student_fields',
    departments  : 'bus_departments',
    boardingPts  : 'bus_boarding_points',
  },

  // ── DEFAULT BUSES (none — admin adds manually) ──
  defaultBuses: [],

  // ── DEFAULT COLLEGES ───────────────────────────
  defaultColleges: ['MCE','MEI'],

  // ── PASS TYPES ─────────────────────────────────
  passTypes: ['Semester'],

  // ── BOARDING POINTS ────────────────────────────
  boardingPoints: [
    'Salem Bus Stand','Namakkal','Tiruchengode','Rasipuram',
    'Erode','Sankagiri','Omalur','Mettur','Attur'
  ],

  // ── DEPARTMENTS ────────────────────────────────
  departments: ['CSE','ECE','EEE','MECH','CIVIL','IT','MBA','MCA','Arts & Science'],

  // ── STUDENT FORM FIELDS (admin-configurable) ───
  defaultStudentFields: [
    {key:'name',       label:'Full Name',     required:true,  enabled:true},
    {key:'rollNo',     label:'Roll Number',   required:true,  enabled:true},
    {key:'regNo',      label:'Register No',   required:false, enabled:true},
    {key:'college',    label:'College',       required:false, enabled:true},
    {key:'dept',       label:'Department',    required:false, enabled:true},
    {key:'year',       label:'Year',          required:false, enabled:true},
    {key:'gender',     label:'Gender',        required:false, enabled:true},
    {key:'busNo',      label:'Bus No',        required:true,  enabled:true},
    {key:'boardingAt', label:'Boarding At',   required:false, enabled:true},
    {key:'passType',   label:'Pass Type',     required:false, enabled:true},
    {key:'periodFrom', label:'Period From',   required:false, enabled:true},
    {key:'periodTo',   label:'Period To',     required:false, enabled:true},
    {key:'phone',      label:'Phone',         required:false, enabled:true},
  ],

  // ── SCANNER FIELDS (admin-configurable) ────────
  defaultScanFields: [
    {key:'name',      label:'Name',            required:true,  enabled:true},
    {key:'rollNo',    label:'Roll No',          required:true,  enabled:true},
    {key:'regNo',     label:'Register Number',  required:true,  enabled:true},
    {key:'busNo',     label:'Bus No',           required:true,  enabled:true},
    {key:'dept',      label:'Department',       required:false, enabled:true},
    {key:'year',      label:'Year',             required:false, enabled:true},
    {key:'boardingAt',label:'Boarding At',      required:false, enabled:true},
    {key:'periodFrom',label:'Period From',      required:false, enabled:true},
    {key:'periodTo',  label:'Period To',        required:false, enabled:true},
    {key:'phone',     label:'Phone',            required:false, enabled:false},
  ],

  // ── BOARDING FIELDS (admin-configurable) ───────
  defaultBoardFields: [
    {key:'name',      label:'Name',         required:true,  enabled:true},
    {key:'rollNo',    label:'Roll No',      required:true,  enabled:true},
    {key:'regNo',     label:'Reg No',       required:false, enabled:true},
    {key:'busNo',     label:'Bus No',       required:true,  enabled:true},
    {key:'boardingAt',label:'Boarding At',  required:false, enabled:true},
    {key:'time',      label:'Time',         required:true,  enabled:true},
    {key:'date',      label:'Date',         required:true,  enabled:true},
  ],

  // ── SHEET HEADERS ──────────────────────────────
  sheetHeaders: ['Name','Roll No','Reg No','Bus No','Pass Type','Date','Photo'],
};

// ── INIT STORAGE ────────────────────────────────────────────────────────────
(function initStorage() {
  var K = window.BUS_CONFIG.keys;

  // Buses
  if (!localStorage.getItem(K.buses)) {
    localStorage.setItem(K.buses, JSON.stringify(window.BUS_CONFIG.defaultBuses));
  }
  // Colleges
  if (!localStorage.getItem(K.colleges)) {
    localStorage.setItem(K.colleges, JSON.stringify(window.BUS_CONFIG.defaultColleges));
  }
  // Scan fields
  if (!localStorage.getItem(K.scanFields)) {
    localStorage.setItem(K.scanFields, JSON.stringify(window.BUS_CONFIG.defaultScanFields));
  }
  // Board fields
  if (!localStorage.getItem(K.boardFields)) {
    localStorage.setItem(K.boardFields, JSON.stringify(window.BUS_CONFIG.defaultBoardFields));
  }
  // Student fields
  if (!localStorage.getItem(K.studentFields)) {
    localStorage.setItem(K.studentFields, JSON.stringify(window.BUS_CONFIG.defaultStudentFields));
  }
  // Incharges list
  if (!localStorage.getItem(K.incharges)) {
    localStorage.setItem(K.incharges, JSON.stringify([]));
  }
  // Students
  if (!localStorage.getItem(K.students)) {
    localStorage.setItem(K.students, JSON.stringify([]));
  }
  // Departments
  if (!localStorage.getItem(K.departments)) {
    localStorage.setItem(K.departments, JSON.stringify(window.BUS_CONFIG.departments));
  }
  // Boarding Points
  if (!localStorage.getItem(K.boardingPts)) {
    localStorage.setItem(K.boardingPts, JSON.stringify(window.BUS_CONFIG.boardingPoints));
  }
})();

// ── GLOBAL HELPERS ───────────────────────────────────────────────────────────
window.BUS_HELPERS = {

  today: function() {
    return new Date().toLocaleDateString('en-CA');
  },

  nowTime: function() {
    return new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'});
  },

  getStudents: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.students)||'[]'); }
    catch(e) { return []; }
  },

  getBoarding: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.boarding)||'[]'); }
    catch(e) { return []; }
  },

  saveBoarding: function(b) {
    localStorage.setItem(window.BUS_CONFIG.keys.boarding, JSON.stringify(b));
  },

  getNoPass: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.nopass)||'[]'); }
    catch(e) { return []; }
  },

  saveNoPass: function(n) {
    localStorage.setItem(window.BUS_CONFIG.keys.nopass, JSON.stringify(n));
  },

  getAbsent: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.absent)||'[]'); }
    catch(e) { return []; }
  },

  saveAbsent: function(a) {
    localStorage.setItem(window.BUS_CONFIG.keys.absent, JSON.stringify(a));
  },

  getBuses: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.buses)||'[]'); }
    catch(e) { return window.BUS_CONFIG.defaultBuses; }
  },

  getColleges: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.colleges)||'[]'); }
    catch(e) { return window.BUS_CONFIG.defaultColleges; }
  },

  getIncharges: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.incharges)||'[]'); }
    catch(e) { return []; }
  },

  getSheetUrl: function() {
    return localStorage.getItem(window.BUS_CONFIG.keys.sheetUrl)||'';
  },

  getDepartments: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.departments)||'null') || window.BUS_CONFIG.departments; }
    catch(e) { return window.BUS_CONFIG.departments; }
  },

  getBoardingPoints: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.boardingPts)||'null') || window.BUS_CONFIG.boardingPoints; }
    catch(e) { return window.BUS_CONFIG.boardingPoints; }
  },

  getStudentFields: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.studentFields)||'null') || window.BUS_CONFIG.defaultStudentFields; }
    catch(e) { return window.BUS_CONFIG.defaultStudentFields; }
  },

  getScanFields: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.scanFields)||'null') || window.BUS_CONFIG.defaultScanFields; }
    catch(e) { return window.BUS_CONFIG.defaultScanFields; }
  },

  getBoardFields: function() {
    try { return JSON.parse(localStorage.getItem(window.BUS_CONFIG.keys.boardFields)||'null') || window.BUS_CONFIG.defaultBoardFields; }
    catch(e) { return window.BUS_CONFIG.defaultBoardFields; }
  },

  uid: function() {
    return Math.random().toString(36).slice(2,9).toUpperCase();
  },

  esc: function(str) {
    return (str||'').toString()
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },

  // ── AUTH ──────────────────────────────────────
  isAdminLoggedIn: function() {
    return sessionStorage.getItem('bus_admin_session') === 'true';
  },

  checkAdminLogin: function(user, pass) {
    var storedUser = localStorage.getItem(window.BUS_CONFIG.ADMIN_USER_KEY) || window.BUS_CONFIG.DEFAULT_ADMIN_USER;
    var storedPass = localStorage.getItem(window.BUS_CONFIG.ADMIN_PASS_KEY) || window.BUS_CONFIG.DEFAULT_ADMIN_PASS;
    return user === storedUser && pass === storedPass;
  },

  adminLogin: function(user, pass) {
    if (this.checkAdminLogin(user, pass)) {
      sessionStorage.setItem('bus_admin_session', 'true');
      return true;
    }
    return false;
  },

  adminLogout: function() {
    sessionStorage.removeItem('bus_admin_session');
    // Note: does NOT remove bus_incharge_session — incharge has its own logout
  },

  inchargeLogout: function() {
    sessionStorage.removeItem('bus_incharge_session');
  },

  // ── INCHARGE AUTH ─────────────────────────────
  getInchargeSession: function() {
    try { return JSON.parse(sessionStorage.getItem('bus_incharge_session')||'null'); }
    catch(e) { return null; }
  },

  saveInchargeSession: function(ic) {
    sessionStorage.setItem('bus_incharge_session', JSON.stringify(ic));
  },

  inchargeLogin: function(userId, pass) {
    var incharges = this.getIncharges();
    if (!incharges || incharges.length === 0) return null;

    var uid_norm  = (userId || '').trim().toLowerCase();
    var pass_raw  = (pass   || '');           // exact as typed
    var pass_trim = pass_raw.trim();          // trimmed
    var pass_low  = pass_trim.toLowerCase();  // lowercase fallback

    // Pass 1 — exact trimmed match (case-insensitive userId, exact password)
    var ic = incharges.find(function(i) {
      var storedUid  = (i.userId   || '').trim().toLowerCase();
      var storedPass = (i.password || '').trim();
      return storedUid === uid_norm && storedPass === pass_trim;
    }) || null;

    // Pass 2 — case-insensitive password (caps-lock / shift typo)
    if (!ic) {
      ic = incharges.find(function(i) {
        var storedUid  = (i.userId   || '').trim().toLowerCase();
        var storedPass = (i.password || '').trim().toLowerCase();
        return storedUid === uid_norm && storedPass === pass_low;
      }) || null;
    }

    // Pass 3 — raw (untrimmed) password match — catches saved-with-spaces passwords
    if (!ic) {
      ic = incharges.find(function(i) {
        var storedUid  = (i.userId   || '').trim().toLowerCase();
        var storedPass = (i.password || '');
        return storedUid === uid_norm && storedPass === pass_raw;
      }) || null;
    }

    if (ic) {
      // Normalise the stored record before saving session —
      // strip any accidental whitespace from userId / password
      var clean = {};
      for (var k in ic) { if (Object.prototype.hasOwnProperty.call(ic, k)) clean[k] = ic[k]; }
      clean.userId   = (clean.userId   || '').trim();
      clean.password = (clean.password || '').trim();
      sessionStorage.setItem('bus_incharge_session', JSON.stringify(clean));
      return clean;
    }
    return null;
  },

  // Returns true if admin OR any incharge is logged in
  isAnyStaffLoggedIn: function() {
    return this.isAdminLoggedIn() || !!this.getInchargeSession();
  },

  // ── AUTO SHEET SYNC ───────────────────────────
  autoSync: async function() {
    var url = this.getSheetUrl();
    if (!url) return;
    var H = window.BUS_HELPERS;
    var today = H.today();
    var students = H.getStudents();
    var boarding = H.getBoarding().filter(function(b){ return b.date===today && !b.noPass; });
    if (!boarding.length) return;
    var rows = boarding.map(function(b){
      var s = students.find(function(x){ return x.id===b.sid; })||{};
      return {date:b.date,name:s.name||'',rollNo:s.rollNo||'',regNo:s.regNo||'',
              busNo:s.busNo||'',passType:s.passType||'Semester',time:b.time};
    });
    try {
      await fetch(url,{method:'POST',body:JSON.stringify({action:'writeBoarding',rows:rows})});
    } catch(e) {}
  },
};

// ── SYNC BUS LIST TO SHEET (call once after admin changes buses) ──────────────
window.BUS_HELPERS.syncBusList = async function() {
  var url = this.getSheetUrl();
  if (!url) return;
  var buses = this.getBuses();
  try {
    await fetch(url, {method:'POST', body:JSON.stringify({action:'saveBusList', buses:buses})});
  } catch(e) {}
};

// ── AUTO SYNC EVERY 10 SECONDS ───────────────────────────────────────────────
setInterval(function() {
  window.BUS_HELPERS.autoSync();
}, 10000);
