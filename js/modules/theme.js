/* Chế độ sáng/tối — lưu tùy chọn, tự theo hệ thống khi ở chế độ "auto". */
(function (global) {
  'use strict';

  var KEY = 'sitesafe.theme.v3';
  var MODES = ['auto', 'light', 'dark'];
  var LABEL = { auto: 'Tự động', light: 'Sáng', dark: 'Tối' };
  var ICON = { auto: 'bi-circle-half', light: 'bi-sun', dark: 'bi-moon-stars' };
  var META = { light: '#f3faf9', dark: '#12151b' };
  var doc = global.document;
  var mq = global.matchMedia ? global.matchMedia('(prefers-color-scheme: dark)') : null;

  function read() {
    try {
      var v = global.localStorage.getItem(KEY);
      return MODES.indexOf(v) > -1 ? v : 'auto';
    } catch (e) {
      return 'auto';
    }
  }

  function write(mode) {
    try { global.localStorage.setItem(KEY, mode); } catch (e) { /* trình duyệt chặn bộ nhớ — vẫn chạy được */ }
  }

  function resolve(mode) {
    var m = mode || read();
    return m === 'auto' ? (mq && mq.matches ? 'dark' : 'light') : m;
  }

  function syncMeta(effective) {
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = doc.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      doc.head.appendChild(meta);
    }
    meta.setAttribute('content', META[effective]);
  }

  function refresh() {
    var mode = read(), effective = resolve(mode);
    var buttons = doc.querySelectorAll('[data-ss-theme]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var icon = btn.querySelector('i');
      if (icon) icon.className = 'bi ' + ICON[mode];
      var label = btn.querySelector('.ss-theme-label');
      if (label) label.textContent = LABEL[mode];
      btn.setAttribute('title', 'Chế độ hiển thị: ' + LABEL[mode] + ' (đang ' + LABEL[effective].toLowerCase() + ') — bấm để đổi');
      btn.setAttribute('aria-label', 'Chế độ hiển thị: ' + LABEL[mode] + '. Bấm để chuyển sang ' + LABEL[MODES[(MODES.indexOf(mode) + 1) % MODES.length]] + '.');
    }
  }

  function apply() {
    var effective = resolve();
    var root = doc.documentElement;
    root.setAttribute('data-theme', effective);
    root.setAttribute('data-bs-theme', effective);
    syncMeta(effective);
    refresh();
  }

  function cycle() {
    var next = MODES[(MODES.indexOf(read()) + 1) % MODES.length];
    write(next);
    apply();
    return next;
  }

  function set(mode) {
    if (MODES.indexOf(mode) === -1) return;
    write(mode);
    apply();
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-ss-theme]') : null;
    if (btn) { e.preventDefault(); cycle(); }
  });

  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  }

  global.addEventListener('storage', function (e) {
    if (e.key === KEY) apply();
  });

  global.SiteSafeTheme = {
    MODES: MODES, LABEL: LABEL,
    get: read, resolved: resolve, set: set, cycle: cycle, refresh: refresh
  };

  apply();
})(window);
