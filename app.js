(function () {
  'use strict';

  const STORAGE_KEY = 'simple-todo-app:items';
  const FILTER_KEY = 'simple-todo-app:filter';
  const SORT_KEY = 'simple-todo-app:sort';

  const PRIORITY_ORDER = { high: 0, med: 1, low: 2 };
  const PRIORITY_LABELS = { low: 'Low', med: 'Medium', high: 'High' };

  /** @type {{id:string, text:string, done:boolean, due:string|null, priority:'low'|'med'|'high', order:number}[]} */
  let todos = loadTodos();
  let filter = loadFilter();
  let sortMode = loadSort();
  let orderCounter = todos.reduce((m, t) => Math.max(m, t.order || 0), 0);

  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const dateInput = document.getElementById('todo-date');
  const priorityInput = document.getElementById('todo-priority');
  const resetBtn = document.getElementById('reset-form');
  const list = document.getElementById('todo-list');
  const counter = document.getElementById('counter');
  const clearBtn = document.getElementById('clear-completed');
  const sortSelect = document.getElementById('sort-select');
  const filterButtons = document.querySelectorAll('.filter');
  const totalBadge = document.getElementById('total-badge');

  // --- Persistence ------------------------------------------------------
  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isValidTodo).map(normalizeTodo);
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  function loadFilter() {
    const v = localStorage.getItem(FILTER_KEY);
    return v === 'active' || v === 'completed' ? v : 'all';
  }

  function saveFilter() {
    localStorage.setItem(FILTER_KEY, filter);
  }

  function loadSort() {
    const v = localStorage.getItem(SORT_KEY);
    return v === 'date' || v === 'priority' ? v : 'manual';
  }

  function saveSort() {
    localStorage.setItem(SORT_KEY, sortMode);
  }

  function isValidTodo(t) {
    return t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean';
  }

  function normalizeTodo(t) {
    const order = typeof t.order === 'number' ? t.order : Date.now();
    const priority = (t.priority === 'low' || t.priority === 'high') ? t.priority : 'med';
    const due = typeof t.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.due) ? t.due : null;
    return { id: t.id, text: t.text, done: t.done, due, priority, order };
  }

  // --- Date helpers -----------------------------------------------------
  function todayISO() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function diffDays(isoA, isoB) {
    const [ya, ma, da] = isoA.split('-').map(Number);
    const [yb, mb, db] = isoB.split('-').map(Number);
    const a = Date.UTC(ya, ma - 1, da);
    const b = Date.UTC(yb, mb - 1, db);
    return Math.round((a - b) / 86400000);
  }

  function formatDue(iso) {
    const today = todayISO();
    const days = diffDays(iso, today);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days === -1) return 'Yesterday';
    if (days > 0 && days <= 7) return `In ${days} days`;
    if (days < 0 && days >= -7) return `${-days}d overdue`;
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: dt.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    });
  }

  // --- Rendering --------------------------------------------------------
  function render() {
    const visible = todos
      .filter(matchesFilter)
      .slice()
      .sort(comparator);

    list.innerHTML = '';

    if (visible.length === 0) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = todos.length === 0
        ? 'Nothing here yet. Add your first todo above.'
        : 'No todos match this filter.';
      list.appendChild(li);
    } else {
      for (const todo of visible) {
        list.appendChild(renderItem(todo));
      }
    }

    const remaining = todos.filter(t => !t.done).length;
    counter.textContent = `${remaining} ${remaining === 1 ? 'item' : 'items'} left`;

    if (totalBadge) {
      totalBadge.textContent = String(todos.length);
      totalBadge.hidden = todos.length === 0;
    }
  }

  function renderItem(todo) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' completed' : '');
    li.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.setAttribute('aria-label', `Mark "${todo.text}" as ${todo.done ? 'active' : 'completed'}`);
    checkbox.addEventListener('change', () => toggle(todo.id));

    const body = document.createElement('div');
    body.className = 'body';

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = todo.text;
    body.appendChild(text);

    if (todo.due || todo.priority) {
      const meta = document.createElement('div');
      meta.className = 'meta';
      if (todo.due) meta.appendChild(dueBadge(todo));
      if (todo.priority) meta.appendChild(priorityBadge(todo));
      body.appendChild(meta);
    }

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'delete';
    del.setAttribute('aria-label', `Delete "${todo.text}"`);
    del.textContent = '×';
    del.addEventListener('click', () => remove(todo.id));

    li.append(checkbox, body, del);
    return li;
  }

  function dueBadge(todo) {
    const span = document.createElement('span');
    span.className = 'badge date';
    const today = todayISO();
    if (!todo.done) {
      const days = diffDays(todo.due, today);
      if (days < 0) span.classList.add('overdue');
      else if (days <= 1) span.classList.add('soon');
    }
    span.textContent = `📅 ${formatDue(todo.due)}`;
    return span;
  }

  function priorityBadge(todo) {
    const span = document.createElement('span');
    span.className = `badge priority-${todo.priority}`;
    const dot = todo.priority === 'high' ? '🔴' : todo.priority === 'low' ? '🟢' : '🟡';
    span.textContent = `${dot} ${PRIORITY_LABELS[todo.priority]}`;
    return span;
  }

  function matchesFilter(todo) {
    if (filter === 'active') return !todo.done;
    if (filter === 'completed') return todo.done;
    return true;
  }

  function comparator(a, b) {
    if (sortMode === 'date') {
      if (a.due && !b.due) return -1;
      if (!a.due && b.due) return 1;
      if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
      return a.order > b.order ? -1 : 1;
    }
    if (sortMode === 'priority') {
      const pa = PRIORITY_ORDER[a.priority] ?? 1;
      const pb = PRIORITY_ORDER[b.priority] ?? 1;
      if (pa !== pb) return pa - pb;
      return a.order > b.order ? -1 : 1;
    }
    return a.order > b.order ? -1 : 1;
  }

  // --- Actions ----------------------------------------------------------
  function add(text, due, priority) {
    const trimmed = text.trim();
    if (!trimmed) return;
    orderCounter += 1;
    todos.unshift({
      id: makeId(),
      text: trimmed,
      done: false,
      due: due || null,
      priority: priority || 'med',
      order: orderCounter,
    });
    saveTodos();
    render();
  }

  function toggle(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    todo.done = !todo.done;
    saveTodos();
    render();
  }

  function remove(id) {
    const li = list.querySelector(`[data-id="${id}"]`);
    if (li) {
      li.classList.add('removing');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const delay = reduceMotion ? 0 : 200;
      setTimeout(() => {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        render();
      }, delay);
    } else {
      todos = todos.filter(t => t.id !== id);
      saveTodos();
      render();
    }
  }

  function clearCompleted() {
    const before = todos.length;
    todos = todos.filter(t => !t.done);
    if (todos.length !== before) {
      saveTodos();
      render();
    }
  }

  function setFilter(next) {
    filter = next;
    saveFilter();
    filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === next);
    });
    render();
  }

  function setSort(next) {
    sortMode = next;
    saveSort();
    sortSelect.value = next;
    render();
  }

  // --- Helpers ----------------------------------------------------------
  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // --- Wire up ----------------------------------------------------------
  form.addEventListener('submit', e => {
    e.preventDefault();
    add(input.value, dateInput.value, priorityInput.value);
    input.value = '';
    dateInput.value = '';
    priorityInput.value = 'med';
    input.focus();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  sortSelect.addEventListener('change', e => setSort(e.target.value));
  clearBtn.addEventListener('click', clearCompleted);

  resetBtn.addEventListener('click', () => {
    input.value = '';
    dateInput.value = '';
    priorityInput.value = 'med';
    input.focus();
  });

  setFilter(filter);
  setSort(sortMode);
})();
