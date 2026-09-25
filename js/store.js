// 本地存储层：日程活动 + 手动调课记录。
// 这些数据只存在于当前浏览器，换设备或清缓存会丢失（第一版已确认接受）。

const STORAGE_KEY = 'buaa-schedule:v1';

const CATEGORIES = [
  { id: 'homework', name: '作业', color: '#2563eb' },
  { id: 'exam', name: '考试', color: '#dc2626' },
  { id: 'life', name: '生活', color: '#059669' },
  { id: 'club', name: '社团', color: '#d97706' },
];

function categoryOf(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[2];
}

let state = load();
const listeners = new Set();

function defaults() {
  return { version: 1, todos: [], overrides: [] };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return defaults();
    return {
      version: 1,
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      overrides: Array.isArray(parsed.overrides) ? parsed.overrides : [],
    };
  } catch (err) {
    console.warn('读取本地数据失败，使用空数据', err);
    return defaults();
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    alert('保存失败：浏览器可能禁用了本地存储或空间已满。');
    console.warn(err);
  }
  listeners.forEach((fn) => fn());
}

function onChange(fn) {
  listeners.add(fn);
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function addTodo(input) {
  state.todos.push({
    id: uid(),
    title: input.title,
    date: input.date,
    startTime: input.startTime || '',
    endTime: input.endTime || '',
    note: input.note || '',
    category: input.category || 'life',
    done: false,
    createdAt: Date.now(),
  });
  persist();
}

function updateTodo(id, patch) {
  const t = state.todos.find((x) => x.id === id);
  if (!t) return;
  Object.assign(t, patch);
  persist();
}

function removeTodo(id) {
  state.todos = state.todos.filter((x) => x.id !== id);
  persist();
}

function toggleTodo(id) {
  const t = state.todos.find((x) => x.id === id);
  if (!t) return;
  t.done = !t.done;
  persist();
}

function addOverride(input) {
  state.overrides.push({ id: uid(), ...input });
  persist();
}

function removeOverride(id) {
  state.overrides = state.overrides.filter((x) => x.id !== id);
  persist();
}

function overridesOn(dateStr) {
  return state.overrides.filter((o) => o.date === dateStr);
}

// 某天实际上课表：固定课表按周次过滤后，叠加当天的停/补
function lessonsOn(dateStr) {
  const week = weekOfDate(dateStr);
  const weekday = weekdayOf(dateStr);
  const items = [];

  if (week && week <= TERM.courseEndWeek) {
    for (const course of COURSES) {
      if (!courseActiveInWeek(course, week)) continue;
      for (const slot of course.slots) {
        if (slot.day !== weekday) continue;
        items.push({
          kind: 'course',
          slotKey: slotKey(course.id, slot.day, slot.start),
          courseId: course.id,
          name: course.name,
          color: course.color,
          room: slot.room,
          start: slot.start,
          end: slot.end,
        });
      }
    }
  }

  const ovs = overridesOn(dateStr);
  const cancelled = new Set(ovs.filter((o) => o.action === 'cancel').map((o) => o.slotKey));
  const visible = items.filter((i) => !cancelled.has(i.slotKey));

  for (const o of ovs) {
    if (o.action !== 'extra') continue;
    visible.push({
      kind: 'extra',
      overrideId: o.id,
      courseId: null,
      name: o.name,
      color: '#0d9488',
      room: o.room || '',
      start: o.start,
      end: o.end,
    });
  }

  return visible.sort((a, b) => a.start - b.start);
}
