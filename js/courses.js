// 课表固定数据，录入自教务系统 2026—2027 秋季学期课表。
// 修改这里需要重新部署才会生效；临时调课请在页面上操作，存在本地。

const COURSES = [
  {
    id: 'zonghe-fayu',
    name: '综合法语(1)',
    teacher: '',
    color: '#7c3aed',
    weeks: { start: 1, end: 16, parity: 'all' },
    slots: [
      { day: 1, start: 6, end: 7, room: '教学二号楼' },
      { day: 2, start: 6, end: 7, room: '教学二号楼' },
      { day: 3, start: 3, end: 4, room: '教学二号楼' },
      { day: 4, start: 11, end: 12, room: '' },
    ],
  },
  {
    id: 'tiyu',
    name: '体育(1)',
    teacher: '',
    color: '#dc2626',
    weeks: { start: 1, end: 16, parity: 'all' },
    slots: [{ day: 1, start: 8, end: 9, room: '杭州田径场' }],
  },
  {
    id: 'fayu-shixun',
    name: '综合法语实训(1)',
    teacher: '',
    color: '#9333ea',
    weeks: { start: 1, end: 16, parity: 'all' },
    slots: [{ day: 2, start: 1, end: 2, room: '教学二号楼' }],
  },
  {
    id: 'jisuanji-jichu',
    name: '大学计算机基础',
    teacher: '',
    color: '#ea580c',
    weeks: { start: 1, end: 16, parity: 'all' },
    slots: [{ day: 2, start: 3, end: 5, room: '计算机房' }],
  },
  {
    id: 'jichu-yingyu',
    name: '基础英语(1)',
    teacher: '',
    color: '#e11d48',
    weeks: { start: 1, end: 16, parity: 'all' },
    slots: [{ day: 2, start: 8, end: 9, room: '教学一号楼' }],
  },
  {
    id: 'xinli-jiankang',
    name: '心理健康(1)',
    teacher: '',
    color: '#f97316',
    weeks: { start: 1, end: 16, parity: 'all' },
    slots: [{ day: 3, start: 11, end: 12, room: '' }],
  },
  {
    id: 'shuxue-jichu',
    name: '数学基础',
    teacher: '',
    color: '#8b5cf6',
    weeks: { start: 1, end: 16, parity: 'all' },
    slots: [{ day: 4, start: 6, end: 7, room: '科研一号楼' }],
  },
  {
    id: 'xinshidai',
    name: '习近平新时代中国特色社会主义思想',
    teacher: '',
    color: '#ef4444',
    weeks: { start: 1, end: 16, parity: 'all' },
    slots: [{ day: 5, start: 1, end: 4, room: '科研一号楼' }],
  },
  {
    id: 'hangkong-gailun',
    name: '航空航天概论A',
    teacher: '',
    color: '#a855f7',
    weeks: { start: 1, end: 16, parity: 'all' },
    slots: [{ day: 5, start: 6, end: 7, room: '教学一号楼' }],
  },
];

function slotKey(courseId, day, start) {
  return `${courseId}|${day}|${start}`;
}

function courseById(id) {
  return COURSES.find((c) => c.id === id);
}

// 某门课的某个时段在这一周是否上课
function courseActiveInWeek(course, week) {
  if (week < course.weeks.start || week > course.weeks.end) return false;
  if (course.weeks.parity === 'odd' && week % 2 === 0) return false;
  if (course.weeks.parity === 'even' && week % 2 === 1) return false;
  return true;
}
