(function () {
  'use strict';

  const STORAGE_KEY = 'simple-todo-app:items';
  const FILTER_KEY = 'simple-todo-app:filter';

  /** @type {{id:string, text:string, done:boolean}[]} */
  let todos = loadTodos();
  let filter = loadFilter();

  const form = document.getElementById('todo-form');
  const input = document.getElementById('todo-input');
  const list = document.getElementById('todo-list');
  const counter = document.getElementById('counter');
  const clearBtn = document.getElementById('clear-completed');
  const filterButtons = document.querySelectorAll('.filter');

  // --- Persistence ------------------------------------------------------
  function loadTodos() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(isValidTodo) : [];
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

  function isValidTodo(t) {
    return t && typeof t.id === 'string' && typeof t.text === 'string' && typeof t.done === 'boolean';
  }

  // --- Rendering --------------------------------------------------------
  function render() {
    const visible = todos.filter(matchesFilter);
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

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = todo.text;

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'delete';
    del.setAttribute('aria-label', `Delete "${todo.text}"`);
    del.textContent = '×';
    del.addEventListener('click', () => remove(todo.id));

    li.append(checkbox, text, del);
    return li;
  }

  function matchesFilter(todo) {
    if (filter === 'active') return !todo.done;
    if (filter === 'completed') return todo.done;
    return true;
  }

  // --- Actions ----------------------------------------------------------
  function add(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.unshift({ id: makeId(), text: trimmed, done: false });
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
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    render();
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

  // --- Helpers ----------------------------------------------------------
  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // --- Wire up ----------------------------------------------------------
  form.addEventListener('submit', e => {
    e.preventDefault();
    add(input.value);
    input.value = '';
    input.focus();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  clearBtn.addEventListener('click', clearCompleted);

  // Initial filter UI sync
  setFilter(filter);
})();
