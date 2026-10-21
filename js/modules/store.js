/* Tầng dữ liệu mô phỏng: nạp seed -> lưu LocalStorage, đọc/ghi theo bản ghi. */
(function (global) {
  'use strict';

  var DB_KEY = 'sitesafe.db.v3';
  var SESSION_KEY = 'sitesafe.session.v3';
  var DRAFT_KEY = 'sitesafe.draft.v3';
  var seed = global.SITESAFE_SEED;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  /* Seed khai báo mật khẩu demo dạng rõ để người đọc repo biết tài khoản nào dùng gì;
     ngay khi nạp vào LocalStorage, mật khẩu được băm theo tên đăng nhập và xóa bản rõ. */
  function fresh() {
    var db = clone(seed);
    db.users.forEach(function (u) {
      if (u.password !== undefined) {
        u.passwordHash = hashPassword(u.username, u.password);
        delete u.password;
      }
      if (u.mustChange === undefined) u.mustChange = false;
    });
    return db;
  }

  function read() {
    var db;
    try {
      db = JSON.parse(localStorage.getItem(DB_KEY) || 'null');
    } catch (e) {
      db = null;
    }
    if (!db || db.version !== seed.version) {
      db = fresh();
      write(db);
    }
    return db;
  }

  function write(db) {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (e) {
      // Ảnh minh chứng có thể làm đầy vùng lưu: bỏ ảnh cũ nhất rồi thử lại một lần.
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        (db.hazards || []).forEach(function (h) { h.evidence = []; });
        try { localStorage.setItem(DB_KEY, JSON.stringify(db)); } catch (e2) { /* bỏ qua */ }
      }
    }
    return db;
  }

  function reset() {
    var db = fresh();
    write(db);
    return db;
  }

  /* ---- truy cập tập hợp ---- */
  function list(name) { return read()[name] || []; }
  function find(name, id) {
    var rows = list(name);
    for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return null;
  }
  function indexWhere(name, fn) {
    var rows = list(name), out = [];
    for (var i = 0; i < rows.length; i++) if (fn(rows[i], i)) out.push(rows[i]);
    return out;
  }
  function insert(name, record) {
    var db = read();
    db[name].unshift(record);
    write(db);
    return record;
  }
  function update(name, id, patch) {
    var db = read();
    var row = null;
    for (var i = 0; i < db[name].length; i++) if (db[name][i].id === id) { row = db[name][i]; break; }
    if (!row) return null;
    Object.keys(patch).forEach(function (k) { row[k] = patch[k]; });
    write(db);
    return row;
  }

  /* ---- phiên làm việc (mô phỏng đăng nhập theo vai trò) ---- */
  function session() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch (e) { return null; }
  }
  function login(userId) {
    var u = find('users', userId);
    if (!u) return null;
    var now = new Date().toISOString();
    var s = { userId: u.id, role: u.role, name: u.name, unit: u.unit, username: u.username, at: now };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    update('users', u.id, { lastLogin: now });
    return s;
  }
  function logout() { localStorage.removeItem(SESSION_KEY); }
  function sessionUser() {
    var s = session();
    return s ? find('users', s.userId) : null;
  }

  /* ---- quy tắc tài khoản & đăng nhập (mô phỏng ở trình duyệt, không có máy chủ) ----
     Tên đăng nhập: 6–20 ký tự, viết thường không dấu, bắt đầu bằng chữ cái,
     chỉ dùng a-z 0-9 . _ -, không kết thúc bằng ký tự đặc biệt, không có 2 ký tự
     đặc biệt liền nhau, và không trùng với tài khoản đang tồn tại.
     Mật khẩu: 8–24 ký tự, đủ 4 nhóm (hoa, thường, số, ký tự đặc biệt),
     không chứa tên đăng nhập, không thuộc danh sách dễ đoán. */
  var AUTH_KEY = 'sitesafe.auth.v3';
  var USER_RE = /^[a-z][a-z0-9._-]{4,18}[a-z0-9]$/;
  var SPECIAL_RE = /[!@#$%^&*_\-.]/;
  var PWD_BANNED = ['password', '12345678', 'sitesafe', 'sitesafe@2026', 'matkhau', 'admin123', 'qwertyuiop', '123456789'];
  var MAX_FAILS = 5;
  var LOCK_SECONDS = 30;

  function hashPassword(username, pwd) {
    var s = 'ss1·' + String(username || '') + '·' + String(pwd || '');
    var h = 0x811c9dc5 >>> 0;
    var out = '';
    for (var round = 0; round < 4; round++) {
      for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i) + round * 31;
        h = Math.imul(h, 0x01000193) >>> 0;
      }
      out += ('0000000' + h.toString(16)).slice(-8);
    }
    return out;
  }

  function usernameErrors(raw, ignoreId) {
    var name = String(raw || '').trim();
    var out = [];
    if (!name) out.push('Nhập tên đăng nhập.');
    else if (name.length < 6 || name.length > 20) out.push('Tên đăng nhập phải có 6–20 ký tự (hiện có ' + name.length + ').');
    else if (/[A-Z]/.test(name)) out.push('Bỏ chữ in hoa: tên đăng nhập viết thường toàn bộ.');
    else if (!/^[a-z]/.test(name)) out.push('Tên đăng nhập bắt đầu bằng chữ cái viết thường.');
    else if (/[^\x00-\x7F]/.test(name)) out.push('Bỏ dấu tiếng Việt: chỉ dùng a–z, 0–9 và . _ -.');
    else if (!USER_RE.test(name)) out.push('Chỉ dùng chữ thường a–z, số và dấu . _ -; không kết thúc bằng ký tự đặc biệt.');
    else if (/[._\-]{2}/.test(name)) out.push('Không đặt hai ký tự đặc biệt cạnh nhau.');
    else {
      var taken = indexWhere('users', function (u) {
        return String(u.username || '').toLowerCase() === name.toLowerCase() && u.id !== ignoreId;
      });
      if (taken.length) out.push('Tên đăng nhập này đã có tài khoản dùng.');
    }
    return out;
  }

  function passwordErrors(pwd, username) {
    var p = String(pwd || '');
    var out = [];
    var missing = [];
    if (!/[A-Z]/.test(p)) missing.push('chữ hoa');
    if (!/[a-z]/.test(p)) missing.push('chữ thường');
    if (!/[0-9]/.test(p)) missing.push('chữ số');
    if (!SPECIAL_RE.test(p)) missing.push('ký tự đặc biệt (!@#$%^&*_-.)');
    if (!p) out.push('Nhập mật khẩu.');
    else if (p.length < 8 || p.length > 24) out.push('Mật khẩu phải có 8–24 ký tự (hiện có ' + p.length + ').');
    if (p && missing.length) out.push('Mật khẩu cần đủ 4 nhóm, còn thiếu: ' + missing.join(', ') + '.');
    if (p && username && p.toLowerCase().indexOf(String(username).toLowerCase()) !== -1) out.push('Mật khẩu không được chứa tên đăng nhập.');
    if (p && PWD_BANNED.indexOf(p.toLowerCase()) !== -1) out.push('Mật khẩu này quá dễ đoán, hãy chọn mật khẩu khác.');
    if (p && /(.)\1{2,}/.test(p)) out.push('Không lặp cùng một ký tự ba lần liên tiếp.');
    return out;
  }

  function authState() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || '{}'); } catch (e) { return {}; }
  }
  function setAuthState(state) {
    try { localStorage.setItem(AUTH_KEY, JSON.stringify(state)); } catch (e) { /* bỏ qua */ }
  }
  function entry(name) { return String(name || '').trim().toLowerCase(); }
  function lockInfo(username) {
    var st = authState()[entry(username)] || { fails: 0, until: 0 };
    var left = Math.ceil((st.until - Date.now()) / 1000);
    return { fails: st.fails || 0, lockedFor: left > 0 ? left : 0 };
  }
  function findByUsername(username) {
    var key = entry(username);
    var found = null;
    list('users').forEach(function (u) { if (String(u.username || '').toLowerCase() === key) found = u; });
    return found;
  }

  function authenticate(rawName, pwd) {
    var name = entry(rawName);
    var state = authState();
    var lock = lockInfo(name);
    if (lock.lockedFor) return { ok: false, reason: 'lock', lockedFor: lock.lockedFor };
    if (!name || !pwd) return { ok: false, reason: 'empty' };
    var u = findByUsername(name);
    var hash = u ? hashPassword(name, pwd) : null;
    if (!u || hash !== u.passwordHash) {
      var cur = state[name] || { fails: 0, until: 0 };
      cur.fails += 1;
      if (cur.fails >= MAX_FAILS) {
        cur.until = Date.now() + LOCK_SECONDS * 1000;
        cur.fails = 0;
        state[name] = cur;
        setAuthState(state);
        return { ok: false, reason: 'lock', lockedFor: LOCK_SECONDS, attemptsLeft: 0 };
      }
      state[name] = cur;
      setAuthState(state);
      return { ok: false, reason: 'bad', attemptsLeft: MAX_FAILS - cur.fails };
    }
    if (!u.active) return { ok: false, reason: 'inactive' };
    delete state[name];
    setAuthState(state);
    return { ok: true, user: u };
  }

  function changePassword(userId, oldPwd, newPwd) {
    var u = find('users', userId);
    if (!u) return { ok: false, errors: ['Không tìm thấy tài khoản.'] };
    var errors = [];
    if (hashPassword(String(u.username || '').toLowerCase(), String(oldPwd || '')) !== u.passwordHash) {
      errors.push('Mật khẩu hiện tại không đúng.');
    }
    passwordErrors(newPwd, u.username).forEach(function (e) { errors.push(e); });
    if (!errors.length && hashPassword(String(u.username || '').toLowerCase(), newPwd) === u.passwordHash) {
      errors.push('Mật khẩu mới phải khác mật khẩu hiện tại.');
    }
    if (errors.length) return { ok: false, errors: errors };
    update('users', u.id, { passwordHash: hashPassword(String(u.username || '').toLowerCase(), newPwd), mustChange: false });
    return { ok: true };
  }

  /* Quản trị viên đặt mật khẩu khởi tạo / mật khẩu tạm; người dùng buộc phải đổi ở lần đăng nhập đầu. */
  function setPassword(userId, tempPwd) {
    var u = find('users', userId);
    if (!u) return { ok: false, errors: ['Không tìm thấy tài khoản.'] };
    var errors = passwordErrors(tempPwd, u.username);
    if (errors.length) return { ok: false, errors: errors };
    update('users', u.id, { passwordHash: hashPassword(String(u.username || '').toLowerCase(), tempPwd), mustChange: true });
    return { ok: true };
  }

  /* ---- nháp biểu mẫu (tự động lưu khi đang soạn) ---- */
  function saveDraft(key, data) {
    var all = {};
    try { all = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch (e) { all = {}; }
    all[key] = data;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(all)); } catch (e) { /* bỏ qua */ }
  }
  function loadDraft(key) {
    var all = {};
    try { all = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch (e) { return null; }
    return all[key] || null;
  }
  function clearDraft(key) {
    var all = {};
    try { all = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}'); } catch (e) { return; }
    delete all[key];
    localStorage.setItem(DRAFT_KEY, JSON.stringify(all));
  }

  /* ---- tra cứu nhanh ---- */
  function zone(id) { return find('zones', id); }
  function zoneName(id) { var z = zone(id); return z ? z.name : 'Khu vực không xác định'; }
  function user(id) { return find('users', id); }
  function userName(id) { var u = user(id); return u ? u.name : '—'; }
  function template(id) { return find('templates', id); }
  function hazard(id) { return find('hazards', id); }

  function nextHazardCode() {
    var max = 0;
    list('hazards').forEach(function (h) {
      var m = /HZ-2026-(\d+)/.exec(h.code);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'HZ-2026-' + ('00' + (max + 1)).slice(-3);
  }
  function nextActionCode() {
    var max = 0;
    list('actions').forEach(function (a) {
      var m = /KA-2026-(\d+)/.exec(a.code);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'KA-2026-' + ('00' + (max + 1)).slice(-3);
  }
  function nextInspectionCode() {
    var max = 0;
    list('inspections').forEach(function (i) {
      var m = /KT-2026-(\d+)/.exec(i.code);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 'KT-2026-' + ('00' + (max + 1)).slice(-3);
  }

  /* ---- nghiệp vụ suy dẫn ---- */
  var LEVEL_WEIGHT = { 'Thấp': 1, 'Trung bình': 2, 'Cao': 3, 'Nghiêm trọng': 5 };
  var CLOSED = ['Đã đóng', 'Bị từ chối'];

  function isOpenHazard(h) { return CLOSED.indexOf(h.status) === -1; }
  function hazardsOfZone(zoneId) {
    return indexWhere('hazards', function (h) { return h.zoneId === zoneId; });
  }
  function openHazardsOfZone(zoneId) {
    return hazardsOfZone(zoneId).filter(isOpenHazard);
  }
  function isOverdue(action) {
    if (action.status === 'Hoàn thành') return false;
    var due = new Date(action.dueDate + 'T23:59:59');
    return due < new Date();
  }
  function actionsOfHazard(hazardId) {
    return indexWhere('actions', function (a) { return a.hazardId === hazardId; });
  }

  // Điểm rủi ro khu vực: nguy cơ đang mở (theo mức độ) + hành động quá hạn + xu hướng gần đây.
  function riskScore(zoneId) {
    var open = openHazardsOfZone(zoneId);
    var score = open.reduce(function (s, h) { return s + (LEVEL_WEIGHT[h.level] || 1); }, 0);
    var overdue = indexWhere('actions', function (a) {
      return a.zoneId === zoneId && isOverdue(a);
    }).length;
    score += overdue * 2;
    var recent = open.filter(function (h) {
      return new Date(h.createdAt) > new Date(Date.now() - 7 * 864e5);
    }).length;
    score += recent;
    return score;
  }
  function riskBand(score) {
    if (score >= 14) return { key: 'nghiem-trong', label: 'Rủi ro rất cao', level: 'Nghiêm trọng' };
    if (score >= 8) return { key: 'cao', label: 'Rủi ro cao', level: 'Cao' };
    if (score >= 4) return { key: 'trung-binh', label: 'Rủi ro trung bình', level: 'Trung bình' };
    if (score > 0) return { key: 'thap', label: 'Rủi ro thấp', level: 'Thấp' };
    return { key: 'an-toan', label: 'Chưa ghi nhận nguy cơ', level: 'An toàn' };
  }
  function zoneRisk(zoneId) {
    var score = riskScore(zoneId);
    var band = riskBand(score);
    var open = openHazardsOfZone(zoneId);
    return {
      zoneId: zoneId, score: score, band: band,
      open: open.length,
      critical: open.filter(function (h) { return h.level === 'Nghiêm trọng'; }).length,
      overdue: indexWhere('actions', function (a) { return a.zoneId === zoneId && isOverdue(a); }).length
    };
  }
  function zoneRisks() {
    return list('zones').filter(function (z) { return z.active; }).map(function (z) { return zoneRisk(z.id); });
  }

  /* ---- thống kê dùng chung cho dashboard/báo cáo ---- */
  function tally(rows, key) {
    var out = {};
    rows.forEach(function (r) {
      var v = typeof key === 'function' ? key(r) : r[key];
      out[v] = (out[v] || 0) + 1;
    });
    return out;
  }
  function summary() {
    var hazards = list('hazards');
    var open = hazards.filter(isOpenHazard);
    var actions = list('actions');
    return {
      hazards: hazards.length,
      open: open.length,
      awaitingReview: hazards.filter(function (h) { return h.status === 'Chờ xem xét' || h.status === 'Mới tạo'; }).length,
      needInfo: hazards.filter(function (h) { return h.status === 'Cần bổ sung thông tin'; }).length,
      inProgress: hazards.filter(function (h) { return h.status === 'Đang khắc phục'; }).length,
      closed: hazards.filter(function (h) { return h.status === 'Đã đóng'; }).length,
      criticalOpen: open.filter(function (h) { return h.level === 'Nghiêm trọng'; }).length,
      byStatus: tally(hazards, 'status'),
      byLevel: tally(hazards, 'level'),
      byCategory: tally(open, 'category'),
      actions: actions.length,
      actionsOverdue: actions.filter(isOverdue).length,
      actionsDone: actions.filter(function (a) { return a.status === 'Hoàn thành'; }).length,
      inspections: list('inspections').length,
      inspectionsOpen: list('inspections').filter(function (i) { return ['Bản nháp', 'Đang thực hiện', 'Đã gửi'].indexOf(i.status) !== -1; }).length,
      zonesActive: list('zones').filter(function (z) { return z.active; }).length,
      usersActive: list('users').filter(function (u) { return u.active; }).length
    };
  }

  /* ---- lịch sử xử lý hazard ---- */
  function addHistory(hazardId, entry) {
    var db = read();
    var h = null;
    for (var i = 0; i < db.hazards.length; i++) if (db.hazards[i].id === hazardId) { h = db.hazards[i]; break; }
    if (!h) return null;
    h.history = h.history || [];
    h.history.push({ at: entry.at || new Date().toISOString(), actor: entry.actor, action: entry.action, note: entry.note || '' });
    h.updatedAt = h.history[h.history.length - 1].at;
    write(db);
    return h;
  }

  global.SiteSafeStore = {
    KEY: DB_KEY,
    read: read, write: write, reset: reset,
    list: list, find: find, insert: insert, update: update, where: indexWhere,
    session: session, login: login, logout: logout, sessionUser: sessionUser,
    saveDraft: saveDraft, loadDraft: loadDraft, clearDraft: clearDraft,
    zone: zone, zoneName: zoneName, user: user, userName: userName, template: template, hazard: hazard,
    nextHazardCode: nextHazardCode, nextActionCode: nextActionCode, nextInspectionCode: nextInspectionCode,
    isOpenHazard: isOpenHazard, hazardsOfZone: hazardsOfZone, openHazardsOfZone: openHazardsOfZone,
    isOverdue: isOverdue, actionsOfHazard: actionsOfHazard, riskScore: riskScore, riskBand: riskBand,
    zoneRisk: zoneRisk, zoneRisks: zoneRisks, tally: tally, summary: summary, addHistory: addHistory,
    LEVEL_WEIGHT: LEVEL_WEIGHT,
    authenticate: authenticate, changePassword: changePassword, setPassword: setPassword,
    usernameErrors: usernameErrors, passwordErrors: passwordErrors, hashPassword: hashPassword,
    findByUsername: findByUsername, lockInfo: lockInfo,
    MAX_FAILS: MAX_FAILS, LOCK_SECONDS: LOCK_SECONDS,
    AUTH_RULES: {
      username: ['6–20 ký tự, viết thường không dấu, bắt đầu bằng chữ cái', 'Chỉ dùng a–z, 0–9 và . _ -; không kết thúc bằng ký tự đặc biệt', 'Không đặt hai ký tự đặc biệt cạnh nhau và không trùng tài khoản đã có'],
      password: ['8–24 ký tự', 'Đủ 4 nhóm: chữ hoa, chữ thường, chữ số, ký tự đặc biệt (!@#$%^&*_-.)', 'Không chứa tên đăng nhập, không lặp một ký tự ba lần liền, không thuộc danh sách dễ đoán']
    }
  };
})(window);
