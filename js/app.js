/* ===================================================
   Life Dashboard — Vanilla JS
   Features: Greeting, Focus Timer, To-Do, Quick Links
   Optional: Dark/Light Mode, Custom Name, No Duplicates, Change Pomodoro Time
=================================================== */

// ── Helpers ──────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const ls = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

// ── Theme ─────────────────────────────────────────────
const html     = document.documentElement;
const themeBtn = $('theme-toggle');

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  themeBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  ls.set('theme', theme);
}

themeBtn.addEventListener('click', () => {
  applyTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

applyTheme(ls.get('theme', 'dark'));

// ── Greeting & Clock ──────────────────────────────────
const greetingEl    = $('greeting-text');
const userNameEl    = $('user-name');
const datetimeEl    = $('datetime-text');
const nameModal     = $('name-modal');
const nameInput     = $('name-input');
const editNameBtn   = $('edit-name-btn');
const saveNameBtn   = $('save-name-btn');
const cancelNameBtn = $('cancel-name-btn');

const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli',
                'Agustus','September','Oktober','November','Desember'];

function getGreeting(h) {
  if (h >= 5  && h < 12) return 'Selamat Pagi';
  if (h >= 12 && h < 15) return 'Selamat Siang';
  if (h >= 15 && h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function updateClock() {
  const now = new Date();
  const h   = now.getHours();
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  greetingEl.textContent = getGreeting(h);
  datetimeEl.textContent =
    `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}` +
    `  ·  ${String(h).padStart(2,'0')}:${mm}:${ss}`;
}

editNameBtn.addEventListener('click', () => {
  nameInput.value = ls.get('userName', '');
  nameModal.classList.remove('hidden');
  setTimeout(() => nameInput.focus(), 50);
});
saveNameBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveName(); });
cancelNameBtn.addEventListener('click', () => nameModal.classList.add('hidden'));
nameModal.addEventListener('click', (e) => { if (e.target === nameModal) nameModal.classList.add('hidden'); });

function saveName() {
  const val = nameInput.value.trim();
  if (val) { ls.set('userName', val); userNameEl.textContent = val; }
  nameModal.classList.add('hidden');
}

userNameEl.textContent = ls.get('userName', 'Pengguna');
updateClock();
setInterval(updateClock, 1000);

// ── Focus Timer ───────────────────────────────────────
let customDuration = ls.get('timerDuration', 25);
let TIMER_DURATION = customDuration * 60;
let timerSeconds   = TIMER_DURATION;
let timerInterval  = null;
let timerRunning   = false;

const timerDisplay   = $('timer-display');
const ringProgress   = $('timer-ring-progress');
const startBtn       = $('timer-start');
const stopBtn        = $('timer-stop');
const resetBtn       = $('timer-reset');
const durationInput  = $('timer-duration-input');
const timerSetBtn    = $('timer-set-btn');

// SVG circle r=45 → circumference = 2π×45 ≈ 282.74
const CIRCUMFERENCE = 2 * Math.PI * 45;
ringProgress.style.strokeDasharray = CIRCUMFERENCE;

durationInput.value = customDuration;

function formatTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerSeconds);
  const progress = timerSeconds / TIMER_DURATION;
  ringProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  ringProgress.classList.toggle('done', timerSeconds === 0);
}

timerSetBtn.addEventListener('click', () => {
  const val = parseInt(durationInput.value, 10);
  if (!val || val < 1 || val > 120) return;
  clearInterval(timerInterval);
  timerRunning   = false;
  customDuration = val;
  TIMER_DURATION = val * 60;
  timerSeconds   = TIMER_DURATION;
  ls.set('timerDuration', val);
  renderTimer();
});

startBtn.addEventListener('click', () => {
  if (timerRunning || timerSeconds === 0) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      setTimeout(() => alert('⏰ Sesi fokus selesai! Waktunya istirahat.'), 100);
    }
  }, 1000);
});

stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = TIMER_DURATION;
  renderTimer();
});

renderTimer();

// ── To-Do List ────────────────────────────────────────
let todos = ls.get('todos', []);

const todoInput  = $('todo-input');
const todoAddBtn = $('todo-add-btn');
const todoList   = $('todo-list');
const todoError  = $('todo-error');

function saveTodos() { ls.set('todos', todos); }

function isDuplicate(text, excludeIdx = -1) {
  return todos.some((t, i) => i !== excludeIdx && t.text.toLowerCase() === text.toLowerCase());
}

function renderTodos() {
  todoList.innerHTML = '';

  if (todos.length === 0) {
    todoList.innerHTML = '<li class="empty-state">Belum ada tugas. Yuk tambahkan!</li>';
    return;
  }

  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    const check = document.createElement('input');
    check.type = 'checkbox';
    check.className = 'todo-check';
    check.checked = todo.done;
    check.setAttribute('aria-label', 'Tandai selesai');
    check.addEventListener('change', () => {
      todos[idx].done = check.checked;
      saveTodos();
      renderTodos();
    });

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit tugas');
    editBtn.addEventListener('click', () => startEdit(li, idx, span, editBtn));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.textContent = 'Hapus';
    delBtn.setAttribute('aria-label', 'Hapus tugas');
    delBtn.addEventListener('click', () => {
      todos.splice(idx, 1);
      saveTodos();
      renderTodos();
    });

    actions.append(editBtn, delBtn);
    li.append(check, span, actions);
    todoList.appendChild(li);
  });
}

function startEdit(li, idx, span, editBtn) {
  const input = document.createElement('input');
  input.className = 'todo-edit-input';
  input.value = todos[idx].text;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn-save';
  saveBtn.textContent = 'Simpan';
  saveBtn.setAttribute('aria-label', 'Simpan perubahan');

  span.replaceWith(input);
  editBtn.replaceWith(saveBtn);
  input.focus();

  function commitEdit() {
    const newText = input.value.trim();
    if (!newText) return;
    if (isDuplicate(newText, idx)) {
      todoError.textContent = 'Tugas sudah ada!';
      todoError.classList.remove('hidden');
      setTimeout(() => todoError.classList.add('hidden'), 2500);
      return;
    }
    todos[idx].text = newText;
    saveTodos();
    renderTodos();
  }

  saveBtn.addEventListener('click', commitEdit);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') renderTodos(); });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  if (isDuplicate(text)) {
    todoError.textContent = 'Tugas sudah ada!';
    todoError.classList.remove('hidden');
    setTimeout(() => todoError.classList.add('hidden'), 2500);
    return;
  }
  todoError.classList.add('hidden');
  todos.push({ text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

todoAddBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });
renderTodos();

// ── Quick Links ───────────────────────────────────────
let links = ls.get('quickLinks', []);

const linkNameInput = $('link-name-input');
const linkUrlInput  = $('link-url-input');
const linkAddBtn    = $('link-add-btn');
const linksList     = $('links-list');

function saveLinks() { ls.set('quickLinks', links); }

function getFavicon(url) {
  try {
    const domain = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch { return null; }
}

function renderLinks() {
  linksList.innerHTML = '';

  if (links.length === 0) {
    linksList.innerHTML = '<div class="empty-state">Belum ada link tersimpan.</div>';
    return;
  }

  links.forEach((link, idx) => {
    const item = document.createElement('div');
    item.className = 'link-item';

    const favicon = getFavicon(link.url);
    if (favicon) {
      const img = document.createElement('img');
      img.src = favicon;
      img.className = 'link-favicon';
      img.alt = '';
      img.onerror = () => img.remove();
      item.appendChild(img);
    }

    const a = document.createElement('a');
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.textContent = link.name || link.url;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-link-delete';
    delBtn.textContent = 'Hapus';
    delBtn.setAttribute('aria-label', 'Hapus link');
    delBtn.addEventListener('click', () => {
      links.splice(idx, 1);
      saveLinks();
      renderLinks();
    });

    item.append(a, delBtn);
    linksList.appendChild(item);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  let   url  = linkUrlInput.value.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  links.push({ name: name || url, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });
renderLinks();
