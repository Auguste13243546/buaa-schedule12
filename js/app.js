// 渲染与交互。三个视图：今日 / 课表 / 日程。

const $view = document.getElementById('view');
const $title = document.getElementById('view-title');
const $termLine = document.getElementById('term-line');
const $wide = document.getElementById('tabs-wide');
const $narrow = document.getElementById('tabs-narrow');
const $sheet = document.getElementById('sheet');
const $backdrop = document.getElementById('sheet-backdrop');

const TABS = [
  { route: 'today', label: '今日' },
  { route: 'schedule', label: '课表' },
  { route: 'todos', label: '日程' },
];

const currentWeek = weekOfDate(todayStr());
let viewWeek = currentWeek || 1;
let mobileDay = weekdayOf(todayStr());
let todoFilter = 'all';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function nowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function endMinutes(lesson) {
  const t = SESSIONS[lesson.end - 1].end.split(':');
  return Number(t[0]) * 60 + Number(t[1]);
}

// ---------- 顶部与导航 ----------

function renderTabs() {
  const html = TABS.map(
    (t) => `<button class="tab${t.route === route ? ' active' : ''}" data-route="${t.route}">${t.label}</button>`,
  ).join('');
  $wide.innerHTML = html;
  $narrow.innerHTML = html;
}

function renderHeader() {
  const label = TABS.find((t) => t.route === route).label;
  $title.textContent = label;
  const today = todayStr();
  if (!currentWeek) {
    const afterTerm = parseDate(today) > parseDate(dateOf(TERM.totalWeeks, 7));
    $termLine.textContent = afterTerm ? `${TERM.label} 已结束` : `${TERM.label} 尚未开学`;
  } else {
    $termLine.textContent = `${TERM.label} · 第 ${currentWeek} 周`;
  }
}

// ---------- 今日 ----------

function lessonRowHtml(lesson, dateStr) {
  const isToday = dateStr === todayStr();
  const past = isToday && nowMinutes() > endMinutes(lesson);
  const cat = lesson.kind === 'extra' ? '<span class="tag tag-extra">补课</span>' : '';
  return `
    <div class="lesson${past ? ' past' : ''}" data-slot="${esc(lesson.slotKey || '')}"
         data-override="${esc(lesson.overrideId || '')}" data-date="${dateStr}">
      <div class="lesson-time">
        <b>${sessionRange(lesson.start, lesson.end)}</b>
        <span>${sessionLabel(lesson.start, lesson.end)}</span>
      </div>
      <div class="lesson-body" style="--c:${esc(lesson.color)}">
        <div class="lesson-name">${esc(lesson.name)} ${cat}</div>
        <div class="lesson-room">${lesson.room ? esc(lesson.room) : '教室待定'}</div>
      </div>
    </div>`;
}

function todoRowHtml(t, opts) {
  const cat = categoryOf(t.category);
  const time = t.startTime ? `${esc(t.startTime)}${t.endTime ? '–' + esc(t.endTime) : ''}` : '全天';
  return `
    <div class="todo${t.done ? ' done' : ''}" data-id="${esc(t.id)}">
      <button class="check${t.done ? ' on' : ''}" data-act="toggle" aria-label="标记完成"></button>
      <div class="todo-main" data-act="edit">
        <div class="todo-title">${esc(t.title)}</div>
        <div class="todo-meta">
          <span class="dot" style="background:${cat.color}"></span>${cat.name}
          <span class="sep">·</span>${opts.showDate ? esc(t.date) : ''}${time}
          ${t.note ? `<span class="sep">·</span>${esc(t.note)}` : ''}
        </div>
      </div>
    </div>`;
}

function renderToday() {
  const today = todayStr();
  const week = weekOfDate(today);
  const lessons = lessonsOn(today);
  const holiday = HOLIDAYS[today];
  const todos = state.todos.filter((t) => t.date === today);
  const undone = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  const head = `
    <div class="day-head">
      <div class="day-date">${formatCN(today)}</div>
      <div class="day-sub">
        星期${WEEKDAY_CN[weekdayOf(today) - 1]}
        ${week ? `<span class="sep">·</span>第 ${week} 周` : ''}
        ${holiday ? `<span class="tag tag-holiday">${esc(holiday)}</span>` : ''}
      </div>
    </div>`;

  const lessonBlock = lessons.length
    ? `<section class="card"><h2>今日课程</h2>${lessons.map((l) => lessonRowHtml(l, today)).join('')}</section>`
    : `<section class="card"><h2>今日课程</h2>
         <p class="empty">${week ? '今天没有课。' : '不在学期周内，没有课程。'}</p></section>`;

  const todoBlock = `
    <section class="card">
      <h2>今日待办<span class="count">${undone.length ? `未完成 ${undone.length}` : '全部完成'}</span></h2>
      ${undone.length || done.length
        ? undone.map((t) => todoRowHtml(t, {})).join('') +
          done.map((t) => todoRowHtml(t, {})).join('')
        : '<p class="empty">今天没有安排。</p>'}
      <button class="btn btn-ghost" data-act="add-today">+ 添加待办</button>
    </section>`;

  return head + lessonBlock + todoBlock;
}

// ---------- 课表 ----------

function weekDates(week) {
  return Array.from({ length: 7 }, (_, i) => dateOf(week, i + 1));
}

function renderSchedule() {
  const dates = weekDates(viewWeek);
  const bar = `
    <div class="weekbar">
      <button class="nav" data-act="week-prev" aria-label="上一周">‹</button>
      <div class="week-now">
        <b>第 ${viewWeek} 周</b>
        <span>${formatCN(dates[0])} – ${formatCN(dates[6])}</span>
      </div>
      <button class="nav" data-act="week-next" aria-label="下一周">›</button>
    </div>
    ${currentWeek && viewWeek !== currentWeek
      ? `<button class="btn btn-ghost btn-today" data-act="week-today">回到本周</button>` : ''}
    ${viewWeek > TERM.courseEndWeek ? '<p class="hint">这一周已超过第 ' + TERM.courseEndWeek + ' 周，按校历不再排课。</p>' : ''}`;

  const overrides = state.overrides.filter((o) => dates.includes(o.date));
  const overrideBlock = overrides.length
    ? `<section class="card"><h2>本周调课</h2>${overrides.map((o) => `
        <div class="ov-row">
          <div>
            <b>${esc(o.date)}</b>
            <span class="sep">·</span>${o.action === 'cancel' ? '停课' : '补课'}
            <span class="sep">·</span>${esc(o.label || o.name || '')} ${sessionLabel(o.start, o.end)}
          </div>
          <button class="btn btn-mini" data-act="undo-override" data-id="${esc(o.id)}">撤销</button>
        </div>`).join('')}</section>`
    : '';

  return bar + renderGrid(dates) + renderMobileDay(dates) + overrideBlock;
}

function renderGrid(dates) {
  const cells = [];

  cells.push('<div class="g-corner">节次</div>');
  dates.forEach((d, i) => {
    const isToday = d === todayStr();
    cells.push(
      `<div class="g-day${isToday ? ' today' : ''}" style="grid-column:${i + 2}"><b>周${WEEKDAY_CN[i]}</b><span>${formatCN(d)}</span></div>`,
    );
  });

  for (const s of SESSIONS) {
    cells.push(`<div class="g-label" style="grid-row:${s.no + 1}"><b>${s.no}</b><span>${s.start}</span></div>`);
  }

  for (let day = 1; day <= 7; day++) {
    for (const s of SESSIONS) {
      cells.push(
        `<div class="g-cell" data-act="add-extra" data-day="${day}" data-start="${s.no}"
              style="grid-column:${day + 1};grid-row:${s.no + 1}"></div>`,
      );
    }
  }

  const blocks = [];
  dates.forEach((d, i) => {
    const day = i + 1;
    for (const l of lessonsOn(d)) {
      blocks.push(
        `<div class="g-block" data-act="open-lesson" data-slot="${esc(l.slotKey || '')}"
              data-date="${d}" style="grid-column:${day + 1};grid-row:${l.start + 1} / ${l.end + 2};--c:${esc(l.color)}">
           <b>${esc(l.name)}</b><i>${sessionLabel(l.start, l.end)}</i>
           ${l.room ? `<span>${esc(l.room)}</span>` : ''}
         </div>`,
      );
    }
  });

  return `<section class="card card-flush schedule-desktop">
            <div class="grid">${cells.join('')}${blocks.join('')}</div>
          </section>`;
}

function renderMobileDay(dates) {
  const chips = dates.map((d, i) => {
    const n = lessonsOn(d).length;
    return `<button class="chip${mobileDay === i + 1 ? ' on' : ''}" data-act="pick-day" data-day="${i + 1}">
              周${WEEKDAY_CN[i]}<small>${n}</small></button>`;
  }).join('');

  const d = dates[mobileDay - 1];
  const lessons = lessonsOn(d);
  const body = lessons.length
    ? lessons.map((l) => lessonRowHtml(l, d)).join('')
    : `<p class="empty">周${WEEKDAY_CN[mobileDay - 1]}没有课。</p>`;

  return `<section class="card schedule-mobile">
            <h2>${formatCN(d)} 星期${WEEKDAY_CN[mobileDay - 1]}</h2>
            <div class="chips">${chips}</div>
            ${body}
            <button class="btn btn-ghost" data-act="add-extra" data-day="${mobileDay}" data-start="1">+ 补一节课</button>
          </section>`;
}

// ---------- 日程 ----------

function renderTodos() {
  const today = todayStr();
  const all = state.todos.slice().sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const list = todoFilter === 'all' ? all : all.filter((t) => t.category === todoFilter);

  const overdue = [];
  const upcoming = [];
  const past = [];
  const done = [];
  for (const t of list) {
    if (t.done) done.push(t);
    else if (t.date < today) overdue.push(t);
    else if (t.date === today) upcoming.push(t);
    else past.push(t);
  }

  const chips = [`<button class="chip${todoFilter === 'all' ? ' on' : ''}" data-act="filter" data-cat="all">全部</button>`]
    .concat(CATEGORIES.map((c) =>
      `<button class="chip${todoFilter === c.id ? ' on' : ''}" data-act="filter" data-cat="${c.id}">${c.name}</button>`))
    .join('');

  const group = (name, items) => (items.length
    ? `<section class="card"><h2>${name}<span class="count">${items.length}</span></h2>
        ${items.map((t) => todoRowHtml(t, { showDate: true })).join('')}</section>` : '');

  const empty = !list.length ? '<section class="card"><p class="empty">还没有日程，点下面的按钮添加。</p></section>' : '';

  return `<div class="chips">${chips}</div>${empty}
    ${group('已逾期', overdue)}${group('今天', upcoming)}${group('以后', past)}${group('已完成', done)}
    <button class="btn btn-primary" data-act="add-todo">+ 添加日程</button>`;
}

// ---------- 抽屉表单 ----------

function openSheet(html) {
  $sheet.innerHTML = html;
  // 读一次几何属性强制重排，确保浏览器以隐藏态完成布局，过渡才会播放
  void $sheet.offsetHeight;
  $sheet.classList.add('open');
  $backdrop.classList.add('open');
}

function closeSheet() {
  $sheet.classList.remove('open');
  $backdrop.classList.remove('open');
  setTimeout(() => {
    if (!$sheet.classList.contains('open')) $sheet.innerHTML = '';
  }, 400);
}

function todoForm(existing, presetDate) {
  const t = existing || { title: '', date: presetDate || todayStr(), startTime: '', endTime: '', note: '', category: 'life' };
  return `
    <h3>${existing ? '编辑日程' : '添加日程'}</h3>
    <label>标题<input id="f-title" value="${esc(t.title)}" placeholder="例如：法语课后作业" maxlength="60" /></label>
    <label>日期<input id="f-date" type="date" value="${esc(t.date)}" /></label>
    <div class="row2">
      <label>开始<input id="f-start" type="time" value="${esc(t.startTime)}" /></label>
      <label>结束<input id="f-end" type="time" value="${esc(t.endTime)}" /></label>
    </div>
    <label>分类
      <select id="f-cat">${CATEGORIES.map((c) =>
        `<option value="${c.id}"${c.id === t.category ? ' selected' : ''}>${c.name}</option>`).join('')}</select>
    </label>
    <label>备注<textarea id="f-note" rows="3" placeholder="可选">${esc(t.note)}</textarea></label>
    <div class="sheet-actions">
      ${existing ? '<button class="btn btn-danger" data-act="del-todo">删除</button>' : ''}
      <button class="btn btn-ghost" data-act="close-sheet">取消</button>
      <button class="btn btn-primary" data-act="save-todo" data-id="${existing ? esc(existing.id) : ''}">保存</button>
    </div>`;
}

function lessonForm(slotKey, dateStr) {
  const lesson = lessonsOn(dateStr).find((l) => l.slotKey === slotKey);
  if (!lesson) return '';
  const week = weekOfDate(dateStr);
  return `
    <h3>${esc(lesson.name)}</h3>
    <p class="sheet-info">${formatCN(dateStr)} 星期${WEEKDAY_CN[weekdayOf(dateStr) - 1]}
       ${week ? `· 第 ${week} 周` : ''}<br />
       ${sessionLabel(lesson.start, lesson.end)} ${sessionRange(lesson.start, lesson.end)}<br />
       ${lesson.room ? esc(lesson.room) : '教室待定'}</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-act="close-sheet">关闭</button>
      <button class="btn btn-danger" data-act="cancel-lesson" data-slot="${esc(slotKey)}" data-date="${dateStr}"
              data-name="${esc(lesson.name)}" data-start="${lesson.start}" data-end="${lesson.end}">
        停掉这一节
      </button>
    </div>
    <p class="hint">只停 ${formatCN(dateStr)} 这一天这一节，其他周不受影响。</p>`;
}

function extraForm(day, dateStr) {
  const options = SESSIONS.map((s) => `<option value="${s.no}">第 ${s.no} 节 ${s.start}–${s.end}</option>`).join('');
  return `
    <h3>补一节课</h3>
    <p class="sheet-info">${esc(dateStr)} 星期${WEEKDAY_CN[day - 1]}</p>
    <label>课程名<input id="x-name" placeholder="例如：线性代数 补课" maxlength="40" /></label>
    <div class="row2">
      <label>开始<select id="x-start">${options}</select></label>
      <label>结束<select id="x-end">${options}</select></label>
    </div>
    <label>教室<input id="x-room" placeholder="可选" maxlength="30" /></label>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-act="close-sheet">取消</button>
      <button class="btn btn-primary" data-act="save-extra" data-date="${dateStr}" data-day="${day}">保存</button>
    </div>`;
}

// ---------- 事件 ----------

document.addEventListener('click', (ev) => {
  const tab = ev.target.closest('[data-route]');
  if (tab) {
    location.hash = `#/${tab.dataset.route}`;
    return;
  }

  const el = ev.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;

  if (act === 'toggle') {
    toggleTodo(el.closest('.todo').dataset.id);
  } else if (act === 'edit') {
    const t = state.todos.find((x) => x.id === el.closest('.todo').dataset.id);
    if (t) openSheet(todoForm(t));
  } else if (act === 'add-today') {
    openSheet(todoForm(null, todayStr()));
  } else if (act === 'add-todo') {
    openSheet(todoForm(null, todayStr()));
  } else if (act === 'close-sheet') {
    closeSheet();
  } else if (act === 'save-todo') {
    saveTodo(el.dataset.id);
  } else if (act === 'del-todo') {
    const id = $sheet.querySelector('[data-act="save-todo"]').dataset.id;
    if (id) {
      removeTodo(id);
      closeSheet();
    }
  } else if (act === 'week-prev') {
    viewWeek = Math.max(1, viewWeek - 1);
    render();
  } else if (act === 'week-next') {
    viewWeek = Math.min(TERM.totalWeeks, viewWeek + 1);
    render();
  } else if (act === 'week-today') {
    viewWeek = currentWeek || 1;
    render();
  } else if (act === 'pick-day') {
    mobileDay = Number(el.dataset.day);
    render();
  } else if (act === 'filter') {
    todoFilter = el.dataset.cat;
    render();
  } else if (act === 'open-lesson') {
    const key = el.dataset.slot;
    if (key) openSheet(lessonForm(key, el.dataset.date));
  } else if (act === 'cancel-lesson') {
    addOverride({
      date: el.dataset.date,
      action: 'cancel',
      slotKey: el.dataset.slot,
      start: Number(el.dataset.start),
      end: Number(el.dataset.end),
      label: el.dataset.name,
    });
    closeSheet();
  } else if (act === 'add-extra') {
    const day = Number(el.dataset.day);
    openSheet(extraForm(day, dateOf(viewWeek, day)));
    const start = Number(el.dataset.start);
    $sheet.querySelector('#x-start').value = start;
    $sheet.querySelector('#x-end').value = start;
  } else if (act === 'save-extra') {
    saveExtra(el.dataset.date, Number(el.dataset.day));
  } else if (act === 'undo-override') {
    removeOverride(el.dataset.id);
  }
});

function saveTodo(id) {
  const title = $sheet.querySelector('#f-title').value.trim();
  const date = $sheet.querySelector('#f-date').value;
  if (!title || !date) {
    alert('标题和日期不能为空。');
    return;
  }
  const patch = {
    title,
    date,
    startTime: $sheet.querySelector('#f-start').value,
    endTime: $sheet.querySelector('#f-end').value,
    category: $sheet.querySelector('#f-cat').value,
    note: $sheet.querySelector('#f-note').value.trim(),
  };
  if (id) updateTodo(id, patch);
  else addTodo(patch);
  closeSheet();
}

function saveExtra(dateStr, day) {
  const name = $sheet.querySelector('#x-name').value.trim();
  const start = Number($sheet.querySelector('#x-start').value);
  const end = Number($sheet.querySelector('#x-end').value);
  if (!name) {
    alert('请填写课程名。');
    return;
  }
  if (end < start) {
    alert('结束节次不能早于开始节次。');
    return;
  }
  addOverride({
    date: dateStr,
    action: 'extra',
    name,
    day,
    start,
    end,
    room: $sheet.querySelector('#x-room').value.trim(),
    label: name,
  });
  closeSheet();
}

$backdrop.addEventListener('click', closeSheet);
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') closeSheet();
});

// ---------- 路由 ----------

let route = (location.hash.replace('#/', '') || 'today');
if (!TABS.some((t) => t.route === route)) route = 'today';

window.addEventListener('hashchange', () => {
  route = location.hash.replace('#/', '') || 'today';
  if (!TABS.some((t) => t.route === route)) route = 'today';
  render();
});

let lastRoute = null;

function render() {
  closeSheet();
  renderTabs();
  renderHeader();
  $title.textContent = TABS.find((t) => t.route === route).label;

  const entering = route !== lastRoute;
  lastRoute = route;
  $view.classList.toggle('entering', entering);
  $view.innerHTML =
    route === 'today' ? renderToday() : route === 'schedule' ? renderSchedule() : renderTodos();
  if (entering) window.scrollTo(0, 0);
}

onChange(render);
render();
