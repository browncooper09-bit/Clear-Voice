'use strict';

const STORAGE_KEY = 'clarityAAC-v1';
const SLOT_COUNT = 16;

const defaultBoards = {
  core: {
    name: 'Core words',
    tiles: [
      tile('core-1', 'I want', '🙋'), tile('core-2', 'More', '➕'), tile('core-3', 'Go', '➡️'), tile('core-4', 'Like', '👍'),
      tile('core-5', 'Help', '🤝'), tile('core-6', 'Eat', '🥣'), tile('core-7', 'Drink', '🥤'), tile('core-8', 'Stop', '✋'),
      folder('folder-food', 'Food and drink', '🍎', 'food'), folder('folder-feelings', 'Feelings', '🙂', 'feelings'),
      folder('folder-activities', 'Activities', '🧩', 'activities'), folder('folder-people', 'People', '👥', 'people'),
      folder('folder-places', 'Places', '📍', 'places'), tile('core-14', 'Again', '🔁'), tile('core-15', 'Finished', '✅'), tile('core-16', 'Different', '🔄')
    ]
  },
  food: { name: 'Food and drink', tiles: [tile('food-1','Water','💧'), tile('food-2','Snack','🍘'), tile('food-3','Breakfast','🥣'), tile('food-4','Lunch','🥪'), tile('food-5','Dinner','🍽️'), tile('food-6','Fruit','🍎'), tile('food-7','Hot','♨️'), tile('food-8','Cold','🧊')] },
  feelings: { name: 'Feelings', tiles: [tile('feel-1','Happy','🙂'), tile('feel-2','Sad','🙁'), tile('feel-3','Worried','😟'), tile('feel-4','Calm','😌'), tile('feel-5','Hurt','🩹'), tile('feel-6','Tired','😴'), tile('feel-7','Too loud','🔉'), tile('feel-8','Too much','🫷')] },
  activities: { name: 'Activities', tiles: [tile('act-1','Play','🧩'), tile('act-2','Read','📖'), tile('act-3','Music','🎵'), tile('act-4','Outside','🌳'), tile('act-5','Rest','🛋️'), tile('act-6','Watch','📺')] },
  people: { name: 'People', tiles: [tile('people-1','Family','🏠'), tile('people-2','Friend','🧑‍🤝‍🧑'), tile('people-3','Teacher','🧑‍🏫'), tile('people-4','Caregiver','🤲'), tile('people-5','Doctor','🩺')] },
  places: { name: 'Places', tiles: [tile('place-1','Home','🏠'), tile('place-2','School','🏫'), tile('place-3','Bathroom','🚻'), tile('place-4','Outside','🌳'), tile('place-5','Car','🚗'), tile('place-6','Store','🛒')] }
};

function tile(id, label, icon, image = '') { return { id, label, icon, image, kind: 'word', visible: true }; }
function folder(id, label, icon, target) { return { id, label, icon, target, kind: 'folder', visible: true }; }

const quickResponses = [
  { label: 'Yes', icon: '✓', className: 'quick-yes' },
  { label: 'No', icon: '✕', className: 'quick-no' },
  { label: 'Stop / Help', spoken: 'Stop. I need help.', icon: '✋', className: 'quick-help' },
  { label: 'I need a break', icon: '🌿', className: 'quick-break' }
];

let state = loadState();
let currentBoard = 'core';
let sentence = [];
let holdTimer;

const els = {
  grid: document.querySelector('#tile-grid'), title: document.querySelector('#board-title'), back: document.querySelector('#back-button'),
  sentence: document.querySelector('#sentence-strip'), status: document.querySelector('#status-message'), focus: document.querySelector('#focus-toggle'),
  maskButton: document.querySelector('#mask-button'), maskDialog: document.querySelector('#mask-dialog'), maskList: document.querySelector('#mask-list'),
  pinDialog: document.querySelector('#pin-dialog'), pinForm: document.querySelector('#pin-form'), pinInput: document.querySelector('#pin-input'), pinError: document.querySelector('#pin-error'),
  drawer: document.querySelector('#admin-drawer'), backdrop: document.querySelector('#drawer-backdrop'), category: document.querySelector('#tile-category'),
  icon: document.querySelector('#tile-icon'), label: document.querySelector('#tile-label'), image: document.querySelector('#tile-image'),
  form: document.querySelector('#tile-form'), formMessage: document.querySelector('#form-message'), rate: document.querySelector('#speech-rate')
};

init();
function init() {
  renderQuickStrip(); fillSelects(); renderBoard(); renderSentence();
  els.focus.checked = state.focusMode; els.maskButton.hidden = !state.focusMode; els.rate.value = state.rate;
  bindEvents();
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.boards) return { boards: saved.boards, focusMode: !!saved.focusMode, rate: saved.rate || .9, pin: saved.pin || '2468' };
  } catch (error) { console.warn('Saved board could not be loaded.', error); }
  return { boards: structuredClone(defaultBoards), focusMode: false, rate: .9, pin: '2468' };
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

function renderQuickStrip() {
  const strip = document.querySelector('#quick-strip'); strip.innerHTML = '';
  quickResponses.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = `quick-tile ${item.className}`; button.textContent = `${item.icon} ${item.label}`;
    button.addEventListener('click', () => { addWord({ label: item.spoken || item.label, icon: item.icon }); speak(item.spoken || item.label); flash(button); });
    strip.appendChild(button);
  });
}

function renderBoard() {
  const board = state.boards[currentBoard];
  els.title.textContent = board.name; els.back.hidden = currentBoard === 'core'; els.grid.innerHTML = '';
  for (let index = 0; index < SLOT_COUNT; index++) {
    const item = board.tiles[index];
    if (!item || (state.focusMode && item.visible === false)) {
      const space = document.createElement('div'); space.className = `tile-space ${item ? 'masked' : ''}`; space.setAttribute('aria-hidden','true'); els.grid.appendChild(space); continue;
    }
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'aac-tile'; button.dataset.kind = item.kind; button.setAttribute('aria-label', item.kind === 'folder' ? `Open ${item.label}` : `Say ${item.label}`);
    if (item.image) {
      const img = document.createElement('img'); img.src = item.image; img.alt = ''; button.appendChild(img);
    } else {
      const symbol = document.createElement('span'); symbol.className = 'symbol'; symbol.setAttribute('aria-hidden','true'); symbol.textContent = item.icon || '💬'; button.appendChild(symbol);
    }
    const label = document.createElement('span'); label.className = 'label'; label.textContent = item.label; button.appendChild(label);
    button.addEventListener('click', () => {
      flash(button);
      if (item.kind === 'folder') { currentBoard = item.target; renderBoard(); }
      else { addWord(item); speak(item.label); }
    });
    els.grid.appendChild(button);
  }
}

function renderSentence() {
  els.sentence.innerHTML = '';
  if (!sentence.length) { const p = document.createElement('span'); p.className = 'sentence-placeholder'; p.textContent = 'Your words will appear here.'; els.sentence.appendChild(p); return; }
  sentence.forEach(item => {
    const chip = document.createElement('span'); chip.className = 'sentence-chip';
    chip.innerHTML = `<span class="symbol" aria-hidden="true"></span><span></span>`;
    chip.querySelector('.symbol').textContent = item.icon || '💬'; chip.querySelector('span:last-child').textContent = item.label; els.sentence.appendChild(chip);
  });
  els.sentence.scrollLeft = els.sentence.scrollWidth;
}
function addWord(item) { sentence.push({ label: item.label, icon: item.icon || '💬' }); renderSentence(); }

function speak(text) {
  if (!('speechSynthesis' in window)) { announce('Speech is not available in this browser.'); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text); utterance.rate = Number(state.rate); utterance.pitch = 1; window.speechSynthesis.speak(utterance);
}
function flash(element) { element.classList.add('was-pressed'); setTimeout(() => element.classList.remove('was-pressed'), 300); }
function announce(message) { els.status.textContent = message; setTimeout(() => { if (els.status.textContent === message) els.status.textContent = ''; }, 2500); }

function renderMaskList() {
  els.maskList.innerHTML = '';
  state.boards[currentBoard].tiles.forEach((item, index) => {
    const label = document.createElement('label'); label.className = 'mask-option';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = item.visible !== false;
    checkbox.addEventListener('change', () => { state.boards[currentBoard].tiles[index].visible = checkbox.checked; saveState(); renderBoard(); });
    label.append(checkbox, document.createTextNode(`${item.icon || '💬'} ${item.label}`)); els.maskList.appendChild(label);
  });
}

function fillSelects() {
  els.category.innerHTML = ''; Object.entries(state.boards).forEach(([key, board]) => { const option = new Option(board.name, key); els.category.add(option); });
  const icons = ['💬','👍','👎','🙂','🙁','🍎','🥤','🏠','🚗','🎵','🧩','👤','📍','✅','✋','🤝'];
  els.icon.innerHTML = ''; icons.forEach(icon => els.icon.add(new Option(`${icon} Symbol`, icon)));
}

function bindEvents() {
  document.querySelector('#speak-sentence').addEventListener('click', () => sentence.length ? speak(sentence.map(x => x.label).join(' ')) : announce('Choose a word first.'));
  document.querySelector('#delete-last').addEventListener('click', () => { sentence.pop(); renderSentence(); });
  document.querySelector('#clear-sentence').addEventListener('click', () => { sentence = []; renderSentence(); announce('Message cleared.'); });
  els.back.addEventListener('click', () => { currentBoard = 'core'; renderBoard(); });
  els.focus.addEventListener('change', () => { state.focusMode = els.focus.checked; els.maskButton.hidden = !state.focusMode; saveState(); renderBoard(); announce(state.focusMode ? 'Focus mode on.' : 'Focus mode off.'); });
  els.maskButton.addEventListener('click', () => { renderMaskList(); openModal(els.maskDialog); });
  document.querySelector('#show-all').addEventListener('click', () => { state.boards[currentBoard].tiles.forEach(x => x.visible = true); saveState(); renderMaskList(); renderBoard(); });
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closeModal(document.querySelector(`#${button.dataset.close}`))));
  document.querySelector('#admin-hold').addEventListener('pointerdown', startHold); document.querySelector('#admin-hold').addEventListener('pointerup', cancelHold); document.querySelector('#admin-hold').addEventListener('pointerleave', cancelHold); document.querySelector('#admin-hold').addEventListener('pointercancel', cancelHold);
  els.pinForm.addEventListener('submit', event => { event.preventDefault(); if (els.pinInput.value === state.pin) { closeModal(els.pinDialog); openDrawer(); } else { els.pinError.textContent = 'That PIN did not match.'; } });
  document.querySelector('#close-drawer').addEventListener('click', closeDrawer); els.backdrop.addEventListener('click', closeDrawer);
  document.querySelector('#preview-voice').addEventListener('click', () => speak(els.label.value.trim() || 'Voice preview'));
  els.form.addEventListener('submit', addCustomTile);
  document.querySelector('#save-settings').addEventListener('click', saveSettings);
  document.querySelector('#reset-board').addEventListener('click', () => { if (confirm('Reset all custom tiles and settings?')) { localStorage.removeItem(STORAGE_KEY); location.reload(); } });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeModal(els.maskDialog); closeModal(els.pinDialog); closeDrawer(); } });
}

function startHold(event) { event.currentTarget.setPointerCapture?.(event.pointerId); announce('Keep holding to open caregiver access.'); holdTimer = setTimeout(() => { els.pinInput.value = ''; els.pinError.textContent = ''; openModal(els.pinDialog); els.pinInput.focus(); }, 3000); }
function cancelHold() { clearTimeout(holdTimer); }
function openModal(modal) { modal.hidden = false; }
function closeModal(modal) { if (modal) modal.hidden = true; }
function openDrawer() { els.drawer.classList.add('open'); els.drawer.setAttribute('aria-hidden','false'); els.backdrop.hidden = false; setTimeout(() => els.label.focus(), 0); }
function closeDrawer() { els.drawer.classList.remove('open'); els.drawer.setAttribute('aria-hidden','true'); els.backdrop.hidden = true; }

async function addCustomTile(event) {
  event.preventDefault(); const category = els.category.value; const board = state.boards[category];
  if (board.tiles.length >= SLOT_COUNT) { els.formMessage.textContent = 'This board is full. Choose another board.'; return; }
  let image = '';
  if (els.image.files[0]) image = await fileToDataUrl(els.image.files[0]);
  board.tiles.push(tile(`custom-${Date.now()}`, els.label.value.trim(), els.icon.value, image)); saveState();
  els.formMessage.textContent = `Added to space ${board.tiles.length}. Existing tiles did not move.`; els.form.reset(); els.icon.value = '💬'; fillSelects(); if (currentBoard === category) renderBoard();
}
function fileToDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
function saveSettings() {
  const newPin = document.querySelector('#new-pin').value.trim();
  if (newPin && !/^\d{4,8}$/.test(newPin)) { els.formMessage.textContent = 'PIN must be 4 to 8 numbers.'; return; }
  state.rate = Number(els.rate.value); if (newPin) state.pin = newPin; saveState(); document.querySelector('#new-pin').value = ''; els.formMessage.textContent = 'Settings saved.';
}
