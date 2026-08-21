/**
 * MKT Assistant Portal - Backend Google Apps Script
 * ------------------------------------------------
 * Gan voi file Google Sheets "Lich lam parttime".
 *
 * Cach cai dat:
 *   1. Mo Google Sheets > Extensions (Tien ich mo rong) > Apps Script
 *   2. Xoa het code mac dinh, dan toan bo file nay vao
 *   3. Deploy > New deployment > Type: Web app
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy URL /exec va dan vao bien moi truong APPS_SCRIPT_URL tren Vercel
 *
 * API:
 *   GET  ?action=bootstrap          -> { weeks, employees, taskGroups }
 *   GET  ?action=reports&week=...   -> { reports }
 *   POST { action: 'submit', ... }  -> { ok: true, saved: n }
 */

var SHEET_SCHEDULE = 'Lịch làm';
var SHEET_TASK = 'Task';
var SHEET_REPORT = 'Báo cáo';

var REPORT_HEADERS = [
  'Thời gian nộp',
  'Ngày làm việc',
  'Nhân viên',
  'Vị trí',
  'Ca làm',
  'Tuần',
  'Nhóm công việc',
  'Tên Task',
  'Câu hỏi',
  'Nội dung nhân viên điền',
  'Trạng thái',
  'Ghi chú chung'
];

/* ============================ ROUTER ============================ */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'bootstrap';
  try {
    if (action === 'bootstrap') {
      var weeks = readSchedule();
      return jsonOut({
        ok: true,
        updatedAt: new Date().toISOString(),
        weeks: weeks,
        taskGroups: readTasks(staffNamesOf(weeks))
      });
    }
    if (action === 'reports') {
      return jsonOut({ ok: true, reports: readReports(e.parameter.employee, e.parameter.date) });
    }
    if (action === 'ping') {
      return jsonOut({ ok: true, pong: true });
    }
    return jsonOut({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    if (body.action === 'submit') {
      var saved = saveReport(body);
      return jsonOut({ ok: true, saved: saved });
    }
    return jsonOut({ ok: false, error: 'Unknown action: ' + body.action });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ========================= SHEET: LỊCH LÀM ======================== */

/**
 * Doc sheet "Lich lam". Sheet nay chua NHIEU block tuan noi tiep nhau.
 * Moi block co dang:
 *      <nhan tuan, vd "17/8 - 23/8">
 *      Nhân viên | Vị trí | Thứ 2 (17/8) | ... | Chủ Nhật (23/8)
 *      Yến Ngọc  | Parttime MKT | OFF | ...
 *      ...
 *      17:00 - 18:00 | Đủ | ...          <- dong do phu ca
 *      18:00 - 24:00 | THIẾU | ...
 *
 * Parser tu do tim dong header (dong nao co o = "Nhân viên") nen khong phu
 * thuoc vao vi tri cot/dong cu the -> tuan sau them block moi van chay dung.
 */
function readSchedule() {
  var sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_SCHEDULE);
  if (!sheet) return [];

  var grid = sheet.getDataRange().getDisplayValues();
  var weeks = [];

  for (var r = 0; r < grid.length; r++) {
    var headerCol = indexOfCell(grid[r], 'Nhân viên');
    if (headerCol === -1) continue;

    var row = grid[r];
    var days = [];
    for (var c = headerCol + 2; c < row.length; c++) {
      var label = norm(row[c]);
      if (!label) continue;
      days.push({ col: c, label: label });
    }
    if (!days.length) continue;

    var week = {
      label: findWeekLabel(grid, r),
      days: days.map(function (d) { return d.label; }),
      staff: [],
      coverage: []
    };

    for (var rr = r + 1; rr < grid.length; rr++) {
      var line = grid[rr];
      var first = norm(line[headerCol]);

      // Gap header cua block ke tiep -> dung
      if (indexOfCell(line, 'Nhân viên') !== -1) break;

      if (!first) {
        // Dong trong: bo qua, nhung neu ca dong deu trong thi coi nhu het block
        if (isBlankRow(line)) {
          if (week.staff.length) break;
        }
        continue;
      }

      var shifts = days.map(function (d) { return norm(line[d.col]); });

      if (isTimeRange(first)) {
        week.coverage.push({ range: first, values: shifts });
      } else {
        week.staff.push({
          name: first,
          position: norm(line[headerCol + 1]),
          shifts: shifts
        });
      }
    }

    if (week.staff.length) weeks.push(week);
    r = r + week.staff.length + week.coverage.length;
  }

  return weeks;
}

/** Nhan tuan nam o dong ngay phia tren header (o merge). */
function findWeekLabel(grid, headerRowIndex) {
  for (var r = headerRowIndex - 1; r >= 0 && r >= headerRowIndex - 3; r--) {
    for (var c = 0; c < grid[r].length; c++) {
      var v = norm(grid[r][c]);
      if (v && v !== 'Nhân viên') return v;
    }
  }
  return 'Tuần ' + (headerRowIndex + 1);
}

/* =========================== SHEET: TASK ========================== */

/**
 * Doc sheet "Task": Nhom Logic | Ten Task | Danh sach cau hoi.
 * Cot cau hoi la text nhieu dong, moi dong bat dau bang "*".
 *
 * Ngoai cac nhom chung (co ten o cot "Nhom Logic"), sheet con co the co block
 * viec rieng cua tung nguoi: o cot "Ten Task" ghi dung ten mot nhan vien trong
 * sheet "Lich lam", cac dong ben duoi la dau viec cua rieng nguoi do.
 * Nhung nhom nay duoc danh dau owner = ten nhan vien va chi hien voi nguoi do.
 */
function readTasks(staffNames) {
  var owners = {};
  (staffNames || []).forEach(function (n) { owners[norm(n)] = true; });

  var sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_TASK);
  if (!sheet) return [];

  var grid = sheet.getDataRange().getDisplayValues();

  var headerRow = -1;
  var col = 0;
  for (var r = 0; r < grid.length; r++) {
    var i = indexOfCell(grid[r], 'Tên Task');
    if (i !== -1) { headerRow = r; col = i - 1; break; }
  }
  if (headerRow === -1) return [];
  if (col < 0) col = 0;

  var groups = [];
  var current = null;

  for (var rr = headerRow + 1; rr < grid.length; rr++) {
    var line = grid[rr];
    var groupName = norm(line[col]);
    var rawTask = String(line[col + 1] || '');
    var taskName = norm(rawTask);
    var rawQuestions = line[col + 2] || '';

    if (groupName) {
      current = { group: groupName, owner: '', tasks: [] };
      groups.push(current);
    }
    if (!taskName) continue;

    // Dong chi ghi ten mot nhan vien -> bat dau block viec rieng cua nguoi do
    if (owners[taskName] && !norm(rawQuestions)) {
      current = { group: 'Việc riêng của ' + taskName, owner: taskName, tasks: [] };
      groups.push(current);
      continue;
    }

    if (!current) {
      current = { group: 'Khác', owner: '', tasks: [] };
      groups.push(current);
    }

    // Khi khong co cot cau hoi, dong dau cua o la ten task, cac dong sau la y chi tiet
    var name = taskName;
    var questions = parseQuestions(rawQuestions);
    if (!questions.length) {
      var lines = splitLines(rawTask);
      if (lines.length > 1) {
        name = lines[0].replace(/:$/, '');
        questions = parseQuestions(lines.slice(1).join('\n'));
      }
    }

    current.tasks.push({
      id: slug(name) + '-' + groups.length + '-' + current.tasks.length,
      name: name,
      questions: questions
    });
  }

  return groups;
}

function parseQuestions(raw) {
  var text = String(raw || '').replace(/\r/g, '');
  if (!norm(text)) return [];

  var parts = text
    .split(/\n+|(?=\*\s)/)
    .map(function (s) { return norm(s).replace(/^\*\s*/, ''); })
    .filter(function (s) { return s.length > 0; });

  if (!parts.length) return [];

  return parts.map(function (line, idx) {
    var m = line.match(/^([^:]{1,40}):\s*(.+)$/);
    return {
      id: 'q' + (idx + 1),
      label: m ? norm(m[1]) : '',
      prompt: m ? norm(m[2]) : line
    };
  });
}

/* ========================== SHEET: BÁO CÁO ======================== */

function getReportSheet() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(SHEET_REPORT);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_REPORT);
    sheet.appendRow(REPORT_HEADERS);
    sheet.getRange(1, 1, 1, REPORT_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1f2937')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(9, 320);
    sheet.setColumnWidth(10, 420);
  }
  return sheet;
}

/**
 * body = {
 *   employee, position, date, shift, week, note,
 *   entries: [{ group, task, question, answer, status }]
 * }
 */
function saveReport(body) {
  var sheet = getReportSheet();
  var now = new Date();
  var entries = body.entries || [];
  if (!entries.length) return 0;

  var rows = entries.map(function (item) {
    return [
      now,
      body.date || '',
      body.employee || '',
      body.position || '',
      body.shift || '',
      body.week || '',
      item.group || '',
      item.task || '',
      item.question || '',
      item.answer || '',
      item.status || '',
      body.note || ''
    ];
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, REPORT_HEADERS.length).setValues(rows);
  SpreadsheetApp.flush();
  return rows.length;
}

function readReports(employee, date) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_REPORT);
  if (!sheet || sheet.getLastRow() < 2) return [];

  var grid = sheet.getDataRange().getDisplayValues();
  var out = [];
  for (var r = 1; r < grid.length; r++) {
    var row = grid[r];
    if (employee && norm(row[2]) !== norm(employee)) continue;
    if (date && norm(row[1]) !== norm(date)) continue;
    out.push({
      submittedAt: row[0], date: row[1], employee: row[2], position: row[3],
      shift: row[4], week: row[5], group: row[6], task: row[7],
      question: row[8], answer: row[9], status: row[10], note: row[11]
    });
  }
  return out.slice(-500);
}

/* ============================ HELPERS ============================ */

function staffNamesOf(weeks) {
  var seen = {};
  var out = [];
  (weeks || []).forEach(function (w) {
    (w.staff || []).forEach(function (s) {
      var n = norm(s.name);
      if (n && !seen[n]) { seen[n] = true; out.push(n); }
    });
  });
  return out;
}

function splitLines(raw) {
  return String(raw || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(function (s) { return norm(s); })
    .filter(function (s) { return s.length > 0; });
}

function norm(v) {
  return String(v === null || v === undefined ? '' : v).replace(/\s+/g, ' ').trim();
}

function isBlankRow(row) {
  for (var i = 0; i < row.length; i++) {
    if (norm(row[i])) return false;
  }
  return true;
}

function indexOfCell(row, value) {
  for (var i = 0; i < row.length; i++) {
    if (norm(row[i]) === value) return i;
  }
  return -1;
}

function isTimeRange(v) {
  return /^\d{1,2}\s*:\s*\d{2}\s*-\s*\d{1,2}\s*:\s*\d{2}$/.test(norm(v));
}

function slug(s) {
  return norm(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
