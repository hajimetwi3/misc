'use strict';
(function () {
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const pad = n => String(n).padStart(2, '0');
  const dateEl = document.getElementById('datetime');
  const dateNumEl = dateEl.querySelector('.num');
  const timeEl = document.getElementById('time');
  const panel = document.getElementById('panel');
  const clockEl = document.getElementById('clock');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalEl = document.getElementById('modal');
  const modalClose = document.getElementById('modal-close');
  let timer = null;
  let panelTimer = null;
  let wakeLock = null;

  function render() {
    const d = new Date();
    const Y = d.getFullYear();
    const M = pad(d.getMonth() + 1);
    const D = pad(d.getDate());
    const h = pad(d.getHours());
    const m = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    dateNumEl.textContent = `${Y}/${M}/${D}`;
    dateEl.setAttribute('datetime', `${Y}-${M}-${D}T${h}:${m}:${s}`);
    if (dateEl.dataset.day !== String(d.getDay())) {
      dateEl.dataset.day = String(d.getDay());
      while (dateEl.childNodes.length > 1) dateEl.removeChild(dateEl.lastChild);
      const dayNode = document.createElement('span');
      dayNode.textContent = ` (${days[d.getDay()]})`;
      dateEl.appendChild(dayNode);
    }
    timeEl.textContent = settings.sec === 'on' ? `${h}:${m}:${s}` : `${h}:${m}`;
  }
  function tick() {
    render();
    const now = Date.now();
    let delay;
    if (settings.sec === 'on') {
      // 秒ON: 次の秒境界まで
      delay = 1000 - (now % 1000);
    } else {
      // 秒OFF: 次の分境界まで
      delay = 60000 - (now % 60000);
    }
    timer = setTimeout(tick, delay);
  }
  function start() { if (timer === null) tick(); }
  function stop()  { if (timer !== null) { clearTimeout(timer); timer = null; } }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); releaseWake(); }
    else { start(); if (settings.wake === 'on') requestWake(); }
  });

  // 設定管理
  const STORAGE_KEY = 'clock.settings.v1';
  const defaults = { theme: 'cyberpunk', font: 'seg7', size: 'm', wake: 'off', sec: 'off' };
  const allowed = {
    theme: ['auto','dark','cyberpunk','amber','red'],
    font:  ['mono','consolas','seg7'],
    size:  ['s','m','l','xl'],
    wake:  ['off','on'],
    sec:   ['on','off']
  };
  let settings = { ...defaults };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      for (const k of Object.keys(defaults)) {
        if (parsed && allowed[k].includes(parsed[k])) settings[k] = parsed[k];
      }
    } catch (_) {}
  }
  function saveSettings() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
  }
  function applySettings() {
    const root = document.documentElement;
    root.setAttribute('data-theme', settings.theme);
    root.setAttribute('data-font', settings.font);
    root.setAttribute('data-size', settings.size);
    root.setAttribute('data-sec', settings.sec);  // ← 追加
    panel.querySelectorAll('button[data-k]').forEach(b => {
      if (b.dataset.k === 'about') return;
      b.setAttribute('aria-pressed',
        settings[b.dataset.k] === b.dataset.v ? 'true' : 'false');
    });
    if (settings.wake === 'on') requestWake(); else releaseWake();
    // 設定変更時は即座に現在のタイマーをキャンセルして再起動
    // (秒→分の切り替え時、古いタイマーが走り続けるのを防ぐ)
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!document.hidden) tick();
  }

  async function requestWake() {
    if (!('wakeLock' in navigator)) return;
    if (wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (_) { wakeLock = null; }
  }
  function releaseWake() {
    if (wakeLock) { try { wakeLock.release(); } catch (_) {} wakeLock = null; }
  }

  panel.querySelectorAll('button[data-k]').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = b.dataset.k;
      if (k === 'about') { openModal(); return; }
      const v = b.dataset.v;
      if (allowed[k].includes(v)) {
        settings[k] = v;
        saveSettings();
        applySettings();
        showPanel();
      }
    });
  });

  function showPanel() {
    panel.classList.add('open');
    clearTimeout(panelTimer);
    panelTimer = setTimeout(() => panel.classList.remove('open'), 4000);
  }
  clockEl.addEventListener('click', showPanel);

  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !clockEl.contains(e.target) && panel.classList.contains('open')) {
      panel.classList.remove('open');
      clearTimeout(panelTimer);
    }
  });

  // モーダル制御
  function openModal() {
    modalBackdrop.classList.add('open');
    modalClose.focus();
  }
  function closeModal() {
    modalBackdrop.classList.remove('open');
  }
  modalClose.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
  modalBackdrop.addEventListener('click', () => closeModal());
  modalEl.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) closeModal();
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  loadSettings();
  applySettings();
  start();
})();
