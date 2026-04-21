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

  // PiPウィンドウでは設定パネル・モーダルは存在しない
  // メインウィンドウかどうかで処理を分岐する
  const isMainWindow = !!(panel && modalBackdrop && modalEl && modalClose);

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
  const defaults = { theme: 'green', font: 'seg7', size: 'm', wake: 'off', sec: 'off', fx: 'on', date: 'on', bg: 'solid' };
  const allowed = {
    theme: ['auto','dark','green','amber','red','pink','cyber'],
    font:  ['mono','consolas','seg7'],
    size:  ['s','m','l','xl','max'],
    wake:  ['off','on'],
    sec:   ['on','off'],
    fx:    ['off','on','max'],
    date:  ['on','off'],
    bg:    ['solid','ghost1','ghost2','ghost3']
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
    root.setAttribute('data-fx', settings.fx);
    root.setAttribute('data-date', settings.date);
    root.setAttribute('data-bg', settings.bg);
    if (isMainWindow) {
      panel.querySelectorAll('button[data-k]').forEach(b => {
        if (b.dataset.k === 'about') return;
        b.setAttribute('aria-pressed',
          settings[b.dataset.k] === b.dataset.v ? 'true' : 'false');
      });
    }
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

  // ==== メインウィンドウ限定の初期化 ====
  // (PiPウィンドウではこれらの要素が存在しないためスキップ)
  if (isMainWindow) {
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

    // 時計のシングルクリック/ダブルクリック判定
    let clickTimer = null;
    const DOUBLE_CLICK_DELAY = 300; // ms

    clockEl.addEventListener('click', (e) => {
      if (clickTimer !== null) {
        // 2回目のクリック: ダブルクリックとして処理
        clearTimeout(clickTimer);
        clickTimer = null;
        toggleFullscreen();  // 即時呼び出し(ユーザー操作文脈を維持)
      } else {
        // 1回目のクリック: 遅延実行
        clickTimer = setTimeout(() => {
          clickTimer = null;
          showPanel();
        }, DOUBLE_CLICK_DELAY);
      }
    });

    document.addEventListener('click', (e) => {
      if (!panel.contains(e.target) && !clockEl.contains(e.target) && panel.classList.contains('open')) {
        panel.classList.remove('open');
        clearTimeout(panelTimer);
      }
    });

    // モーダル関連リスナー
    modalClose.addEventListener('click', (e) => { e.stopPropagation(); closeModal(); });
    modalBackdrop.addEventListener('click', () => closeModal());
    modalEl.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop.classList.contains('open')) closeModal();
    });
  }

  function showPanel() {
    if (!panel) return;
    panel.classList.add('open');
    clearTimeout(panelTimer);
    panelTimer = setTimeout(() => panel.classList.remove('open'), 4000);
  }

  // 全画面関数
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      const el = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el).catch(() => {});
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document).catch(() => {});
    }
  }

  // モーダル制御
  function openModal() {
    if (!modalBackdrop || !modalClose) return;
    modalBackdrop.classList.add('open');
    modalClose.focus();
  }
  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('open');
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  loadSettings();
  applySettings();
  start();
})();
