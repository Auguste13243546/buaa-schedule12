// 校历常量与日期计算。数据来自北航 2026—2027 学年校历。
// 用普通脚本而非 ES module，保证双击 index.html（file://）也能运行。

const TERM = {
  label: '2026—2027 秋季学期',
  startMonday: '2026-09-07',
  totalWeeks: 19,
  courseEndWeek: 16,
};

const SESSIONS = [
  { no: 1, start: '08:00', end: '08:45', part: 'am' },
  { no: 2, start: '08:50', end: '09:35', part: 'am' },
  { no: 3, start: '09:50', end: '10:35', part: 'am' },
  { no: 4, start: '10:40', end: '11:25', part: 'am' },
  { no: 5, start: '11:30', end: '12:15', part: 'am' },
  { no: 6, start: '14:00', end: '14:45', part: 'pm' },
  { no: 7, start: '14:50', end: '15:35', part: 'pm' },
  { no: 8, start: '15:50', end: '16:35', part: 'pm' },
  { no: 9, start: '16:40', end: '17:25', part: 'pm' },
  { no: 10, start: '17:30', end: '18:15', part: 'pm' },
  { no: 11, start: '19:00', end: '19:45', part: 'ev' },
  { no: 12, start: '19:50', end: '20:35', part: 'ev' },
  { no: 13, start: '20:40', end: '21:25', part: 'ev' },
  { no: 14, start: '21:30', end: '22:15', part: 'ev' },
];

const PART_LABEL = { am: '上午', pm: '下午', ev: '晚上' };

// 校历图上能确认的标注日。仅用于显示，不自动停课——停课走手动调课。
const HOLIDAYS = {
  '2026-09-25': '中秋节',
  '2026-10-01': '国庆节',
  '2026-10-16': '校运会',
  '2026-10-17': '校运会',
  '2026-10-25': '校庆日',
  '2027-01-01': '元旦',
};

const WEEKDAY_CN = ['一', '二', '三', '四', '五', '六', '日'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toDateStr(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function todayStr() {
  return toDateStr(new Date());
}

// 返回 1-7，周一为 1
function weekdayOf(str) {
  const d = parseDate(str).getDay();
  return d === 0 ? 7 : d;
}

function addDays(str, n) {
  const d = parseDate(str);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

// 不在学期内返回 null
function weekOfDate(str) {
  const diff = Math.round((parseDate(str) - parseDate(TERM.startMonday)) / 86400000);
  if (diff < 0) return null;
  const week = Math.floor(diff / 7) + 1;
  return week > TERM.totalWeeks ? null : week;
}

function dateOf(week, weekday) {
  return addDays(TERM.startMonday, (week - 1) * 7 + (weekday - 1));
}

function mondayOf(week) {
  return dateOf(week, 1);
}

function formatCN(str) {
  const d = parseDate(str);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function sessionRange(start, end) {
  return `${SESSIONS[start - 1].start}–${SESSIONS[end - 1].end}`;
}

function sessionLabel(start, end) {
  return start === end ? `第${start}节` : `第${start}–${end}节`;
}
