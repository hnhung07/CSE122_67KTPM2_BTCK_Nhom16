/* SCR-09 · Báo cáo an toàn (SV3 – Đỗ Hồng Nhung)
   Tổng hợp nguy cơ, hành động khắc phục và đợt kiểm tra theo khoảng thời gian /
   khu vực / trạng thái; in báo cáo và xuất CSV đúng tập dữ liệu đang lọc.
   Nguồn số liệu: bộ dữ liệu mẫu mô phỏng trong LocalStorage (không có máy chủ). */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var C = window.SiteSafeCharts;

  var ST = store.read().statuses;
  var LEVELS = ST.level;
  var HAZ_STATUS = ST.hazard;
  var PRIORITIES = ST.priority;
  var PROJECT = store.read().project.name;
  var DAY = 864e5;

  var f = { preset: '30', from: '', to: '', gran: 'day', zone: '', status: '' };
  var win = null;
  var scope = { hz: [], acts: [], insp: [], buckets: [], zones: [] };
  var cellMap = {};

  /* ---------- tiện ích ngày ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dmy(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function startDay(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

  // 'YYYY-MM-DD' (không có giờ) được hiểu là ngày địa phương để tránh lệch 1 ngày theo múi giờ.
  function dayOf(v) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v == null ? '' : v));
    if (m) return startDay(new Date(+m[1], +m[2] - 1, +m[3]));
    var d = new Date(v);
    return isNaN(d.getTime()) ? null : startDay(d);
  }

  function dataSpan() {
    var min = null, max = null, today = startDay(new Date());
    store.list('hazards').forEach(function (h) {
      var d = dayOf(h.createdAt);
      if (!d) return;
      if (!min || d < min) min = d;
      if (!max || d > max) max = d;
    });
    return { min: min || today, max: max || today };
  }

  function buildWindow() {
    var span = dataSpan();
    var today = startDay(new Date());
    var from, to = today;
    if (f.preset === 'custom') {
      from = dayOf(f.from) || span.min;
      to = dayOf(f.to) || today;
    } else if (f.preset === '0') {
      from = span.min < today ? span.min : today;
      to = span.max > today ? span.max : today;
    } else {
      var n = parseInt(f.preset, 10) || 30;
      from = startDay(new Date(Date.now() - (n - 1) * DAY));
    }
    if (!from || from > to) return null;
    return { from: from, to: to, days: Math.round((to.getTime() - from.getTime()) / DAY) + 1 };
  }

  function gran() { return win && f.gran === 'day' && win.days > 60 ? 'week' : f.gran; }

  function inWindow(v) {
    var d = dayOf(v);
    return !!d && !!win && d >= win.from && d <= win.to;
  }

  /* ---------- tập dữ liệu của kỳ ---------- */
  function hazScope() {
    if (!win) return [];
    return store.where('hazards', function (h) {
      if (!inWindow(h.createdAt)) return false;
      if (f.zone && h.zoneId !== f.zone) return false;
      if (f.status && h.status !== f.status) return false;
      return true;
    }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  }

  // Hành động của chính các báo cáo khớp bộ lọc (nên khi lọc trạng thái, bảng hành động cũng thu hẹp theo).
  function actScope(hz) {
    var ids = {};
    hz.forEach(function (h) { ids[h.id] = 1; });
    return store.list('actions').filter(function (a) {
      return ids[a.hazardId] === 1 && (!f.zone || a.zoneId === f.zone);
    });
  }

  function inspScope() {
    if (!win) return [];
    return store.where('inspections', function (i) {
      if (!inWindow(i.date)) return false;
      if (f.zone && i.zoneId !== f.zone) return false;
      return true;
    });
  }

  function makeBuckets() {
    if (!win) return [];
    var step = gran() === 'week' ? 7 * DAY : DAY;
    var out = [];
    var t = win.from.getTime();
    while (t <= win.to.getTime()) {
      var s = startDay(new Date(t));
      var e = startDay(new Date(Math.min(t + step - DAY, win.to.getTime())));
      out.push({ from: s, to: e, label: dmy(s), count: 0 });
      t += step;
    }
    return out;
  }

  function fillBuckets() {
    scope.buckets.forEach(function (b) {
      b.count = scope.hz.filter(function (h) {
        var d = dayOf(h.createdAt);
        return !!d && d >= b.from && d <= b.to;
      }).length;
    });
  }

  // Điểm rủi ro khu vực trong kỳ: trọng số mức độ của ca đang mở + 2 × số hành động quá hạn + số ca mới 7 ngày.
  function zoneRows(hz, acts) {
    var zones = store.list('zones').filter(function (z) { return z.active; });
    if (f.zone) zones = zones.filter(function (z) { return z.id === f.zone; });
    var recentAfter = new Date(Date.now() - 7 * DAY);
    var rows = zones.map(function (z) {
      var open = hz.filter(function (h) { return h.zoneId === z.id && store.isOpenHazard(h); });
      var weight = open.reduce(function (s, h) { return s + (store.LEVEL_WEIGHT[h.level] || 1); }, 0);
      var late = acts.filter(function (a) { return a.zoneId === z.id && store.isOverdue(a); }).length;
      var recent = open.filter(function (h) { return new Date(h.createdAt) > recentAfter; }).length;
      return {
        zone: z, openCount: open.length, weight: weight, late: late, recent: recent,
        score: weight + late * 2 + recent
      };
    });
    return rows.filter(function (r) { return r.score > 0 || r.openCount > 0; })
      .sort(function (a, b) {
        return b.score - a.score || b.openCount - a.openCount || a.zone.name.localeCompare(b.zone.name);
      });
  }

  /* ---------- khung hiển thị ---------- */
  function set(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
  function kpiCard(c) {
    return '<div class="col-6 col-lg-3"><div class="card h-100"><div class="card-body ss-kpi">' +
      '<div class="d-flex justify-content-between align-items-start">' +
      '<span class="ss-kpi-value" style="color:' + c.c + '">' + c.v + '</span>' +
      '<span class="ss-kpi-icon"><i class="bi bi-' + c.i + '"></i></span></div>' +
      '<div class="ss-kpi-label">' + c.l + '</div>' +
      (c.spark ? '<div class="ss-kpi-spark d-flex align-items-center gap-2">' + c.spark +
        '<span>ca mới theo từng mốc</span></div>' : '') +
      '</div></div></div>';
  }

  function reportHead() {
    var line = PROJECT + ' · ';
    line += win ? 'kỳ báo cáo ' + dmy(win.from) + ' → ' + dmy(win.to) + ' (' + win.days + ' ngày)'
      : 'kỳ báo cáo chưa hợp lệ';
    setText('repHead', line + ' · lập lúc ' + A.datetime(new Date()));
  }

  function windowLabel() {
    if (!win) {
      setText('windowLabel', 'Kỳ không hợp lệ: ngày bắt đầu lớn hơn ngày kết thúc');
      return;
    }
    var zoneTxt = f.zone ? store.zoneName(f.zone) : 'toàn công trường (' + store.list('zones').filter(function (z) { return z.active; }).length + ' khu vực)';
    var stTxt = f.status ? f.status : 'mọi trạng thái';
    set('windowLabel', '<strong>' + dmy(win.from) + ' → ' + dmy(win.to) + '</strong> · ' + win.days +
      ' ngày · thang biểu đồ: ' + (gran() === 'week' ? 'theo tuần' : 'theo ngày') +
      '<br><i class="bi bi-geo-alt me-1"></i>' + A.esc(zoneTxt) +
      ' · <i class="bi bi-flag me-1"></i>' + A.esc(stTxt) +
      (gran() !== f.gran ? ' <span class="ss-badge ss-overdue">(kỳ &gt; 60 ngày nên chuyển sang tuần)</span>' : ''));
  }

  function kpis() {
    var hz = scope.hz, acts = scope.acts, insp = scope.insp;
    var open = hz.filter(function (h) { return store.isOpenHazard(h); });
    var critical = hz.filter(function (h) { return h.level === 'Nghiêm trọng'; });
    var closed = hz.filter(function (h) { return h.status === 'Đã đóng'; });
    var rejected = hz.filter(function (h) { return h.status === 'Bị từ chối'; });
    var late = acts.filter(function (a) { return store.isOverdue(a); });
    var findings = insp.reduce(function (s, i) { return s + (+i.findingsCount || 0); }, 0);
    var cards = [
      { v: hz.length, l: 'Tổng báo cáo trong kỳ', i: 'file-earmark-text', c: 'var(--ss-teal-800)',
        spark: C.sparkline(scope.buckets.map(function (b) { return b.count; }), C.SERIES[0]) },
      { v: open.length, l: 'Đang mở (chưa đóng/từ chối)', i: 'exclamation-diamond', c: '#2b5da8' },
      { v: critical.length, l: 'Mức Nghiêm trọng', i: 'fire', c: '#a82d3b' },
      { v: closed.length, l: 'Đã đóng', i: 'patch-check', c: '#1d7a4c' },
      { v: (hz.length ? Math.round(closed.length / hz.length * 100) : 0) + '%', l: 'Tỷ lệ đóng', i: 'percent', c: '#1d7a4c' },
      { v: late.length, l: 'Hành động quá hạn', i: 'alarm', c: '#a82d3b' },
      { v: insp.length, l: 'Đợt kiểm tra trong kỳ', i: 'calendar2-check', c: 'var(--ss-teal-700)' },
      { v: (insp.length ? (findings / insp.length).toFixed(1) : '0.0'), l: 'Mục ghi nhận / đợt', i: 'list-ol', c: '#b0521b' }
    ];
    set('kpis', cards.map(kpiCard).join(''));
    setText('matchCount', hz.length + '/' + store.list('hazards').length + ' báo cáo · ' +
      acts.length + ' hành động · ' + insp.length + ' đợt kiểm tra' +
      (rejected.length ? ' · ' + rejected.length + ' bị từ chối' : ''));
  }

  function noDataMsg() {
    if (scope.hz.length) { set('noData', ''); return; }
    set('noData', A.empty('clipboard2-x', 'Không có báo cáo nào khớp bộ lọc',
      'Trong ' + (win ? dmy(win.from) + ' → ' + dmy(win.to) : 'khoảng ngày đã chọn') +
      ' không có nguy cơ nào với khu vực/trạng thái hiện tại. Thử mở rộng kỳ hoặc bỏ bớt bộ lọc.',
      '<button class="btn btn-primary btn-sm mt-1" data-broaden type="button">' +
      '<i class="bi bi-calendar3 me-1"></i>Mở kỳ ra Toàn bộ</button>' +
      '<button class="btn btn-ghost btn-sm mt-1" data-clear-filters type="button">' +
      '<i class="bi bi-arrow-counterclockwise me-1"></i>Đặt lại bộ lọc</button>'));
  }

  /* ---------- biểu đồ ---------- */
  function trend() {
    var pts = scope.buckets.map(function (b) { return { label: b.label, value: b.count }; });
    C.area(document.getElementById('chartTrend'), pts, {
      aria: 'Biểu đồ số ca nguy cơ mới theo ' + (gran() === 'week' ? 'tuần' : 'ngày')
    });
    setText('trendNote', scope.buckets.length + ' mốc ' + (gran() === 'week' ? 'tuần' : 'ngày') +
      ' · tổng ' + scope.hz.length + ' ca');
  }

  function levelDonut() {
    var items = LEVELS.map(function (lv) {
      return { label: lv, value: scope.hz.filter(function (h) { return h.level === lv; }).length };
    }).filter(function (x) { return x.value > 0; });
    C.donut(document.getElementById('chartLevel'), items, { centerLabel: 'báo cáo', aria: 'Phân bố mức độ trong kỳ' });
  }

  function statusDonut() {
    var items = HAZ_STATUS.map(function (st) {
      return { label: st, value: scope.hz.filter(function (h) { return h.status === st; }).length };
    }).filter(function (x) { return x.value > 0; });
    C.donut(document.getElementById('chartStatus'), items, { centerLabel: 'báo cáo', aria: 'Phân bố trạng thái trong kỳ' });
  }

  function zoneBars() {
    var rows = scope.zones;
    C.bars(document.getElementById('chartZone'),
      rows.slice(0, 5).map(function (r) {
        return {
          label: r.zone.name.replace('Công trình ', ''),
          value: r.score,
          color: C.LEVEL_COLOR[store.riskBand(r.score).level] || C.SERIES[0]
        };
      }), { aria: 'Điểm rủi ro theo khu vực trong kỳ' });
    setText('zoneCount', rows.length ? 'Top ' + Math.min(5, rows.length) + '/' + rows.length + ' khu vực' : 'Chưa có khu vực nào');
    set('zoneBreak', rows.length ? rows.slice(0, 5).map(function (r) {
      return '<div class="ss-row-meta pt-1 mt-1" style="border-top:1px solid var(--ss-line)"><strong>' +
        A.esc(r.zone.name) + '</strong> = ' + r.score + ' <span class="text-muted-soft">(' +
        r.weight + ' trọng số mức độ + 2×' + r.late + ' quá hạn + ' + r.recent + ' ca mới 7 ngày' +
        ' · ' + r.openCount + ' đang mở)</span></div>';
    }).join('') : '<div class="small text-muted-soft mt-2 mb-0">' +
      'Không khu vực nào có nguy cơ đang mở hoặc hành động quá hạn trong kỳ &amp; bộ lọc đang chọn.</div>');
  }

  function likelihoodOf(h, acts) {
    var idx = PRIORITIES.indexOf(h.priority);
    var lk = (idx < 0 ? 2 : idx + 1);
    var hasAction = acts.some(function (a) { return a.hazardId === h.id; });
    if (!hasAction) lk += 1;
    return Math.min(5, Math.max(1, lk));
  }

  function matrix() {
    var host = document.getElementById('chartMatrix');
    cellMap = {};
    if (!scope.hz.length) {
      host.innerHTML = A.empty('grid-3x3', 'Ma trận trống',
        'Trong kỳ đã lọc chưa có báo cáo nguy cơ nào để định vị trên ma trận.');
      set('matrixFoot', '');
      return;
    }
    var cells = {};
    scope.hz.forEach(function (h) {
      var lk = likelihoodOf(h, scope.acts);
      var im = Math.min(5, Math.max(1, store.LEVEL_WEIGHT[h.level] || 1));
      var key = lk + '-' + im;
      cells[key] = (cells[key] || 0) + 1;
      cellMap[key] = cellMap[key] || [];
      cellMap[key].push(h.code);
    });
    C.matrix(host, cells, {
      aria: 'Ma trận rủi ro 5x5: ưu tiên theo khả năng, mức độ theo hậu quả',
      onCell: function (key) {
        var codes = cellMap[key] || [];
        var p = String(key).split('-');
        A.toast(codes.length + ' báo cáo: ' + codes.join(', '), 'info',
          'Ô khả năng ' + p[0] + ' × hậu quả ' + p[1]);
      }
    });
    set('matrixFoot', '<strong>' + scope.hz.length + '</strong> ca đã định vị · ' +
      Object.keys(cells).length + ' ô có dữ liệu · bấm vào ô để xem mã báo cáo.');
  }

  /* ---------- bảng 1: nhóm nguy cơ lặp lại ---------- */
  function cats() {
    var host = document.getElementById('catTable');
    if (!scope.hz.length) {
      host.innerHTML = '<div class="card-body">' + A.empty('collection', 'Chưa có nhóm nguy cơ nào',
        'Bảng này liệt kê nhóm nguy cơ lặp lại nhiều nhất trong kỳ; hiện bộ lọc chưa trả về báo cáo nào.') + '</div>';
      setText('catCount', '0 nhóm');
      return;
    }
    var byCat = store.tally(scope.hz, 'category');
    var rows = Object.keys(byCat).map(function (cat) {
      var items = scope.hz.filter(function (h) { return h.category === cat; });
      var worst = items.reduce(function (m, h) {
        return (store.LEVEL_WEIGHT[h.level] || 0) > (store.LEVEL_WEIGHT[m] || 0) ? h.level : m;
      }, items[0].level);
      var byZone = store.tally(items, 'zoneId');
      var topZone = null, topN = 0;
      Object.keys(byZone).forEach(function (zid) {
        if (byZone[zid] > topN) { topN = byZone[zid]; topZone = zid; }
      });
      return {
        cat: cat, n: items.length,
        open: items.filter(function (h) { return store.isOpenHazard(h); }).length,
        critical: items.filter(function (h) { return h.level === 'Nghiêm trọng'; }).length,
        worst: worst, zone: topZone ? store.zoneName(topZone) : '—', zoneN: topN
      };
    }).sort(function (a, b) {
      return b.n - a.n || b.critical - a.critical || a.cat.localeCompare(b.cat);
    });
    setText('catCount', rows.length + ' nhóm · ca nhiều nhất ' + rows[0].n);
    host.innerHTML = '<div class="table-responsive"><table class="table table-hover align-middle mb-0">' +
      '<thead><tr><th scope="col" class="ss-section-title">#</th>' +
      '<th scope="col">Nhóm nguy cơ</th><th scope="col" class="text-center">Số ca trong kỳ</th>' +
      '<th scope="col" class="text-center">Đang mở</th><th scope="col">Mức nặng nhất</th>' +
      '<th scope="col">Khu vực nhiều nhất</th></tr></thead><tbody>' +
      rows.map(function (r, i) {
        return '<tr><td class="ss-row-meta">' + (i + 1) + '</td>' +
          '<td class="ss-row-title">' + A.esc(r.cat) + '</td>' +
          '<td class="text-center"><span class="badge rounded-pill" style="background:var(--ss-teal-100);color:var(--ss-teal-800)">' + r.n + '</span></td>' +
          '<td class="text-center small">' + r.open + '</td>' +
          '<td>' + A.levelBadge(r.worst) + '</td>' +
          '<td class="small">' + A.esc(r.zone) + ' <span class="text-muted-soft">(' + r.zoneN + ' ca)</span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------- bảng 2: hành động khắc phục ---------- */
  function actions() {
    var host = document.getElementById('actTable');
    var acts = scope.acts.slice().sort(function (a, b) {
      var la = store.isOverdue(a) ? -A.daysTo(a.dueDate) : 0;
      var lb = store.isOverdue(b) ? -A.daysTo(b.dueDate) : 0;
      return lb - la || String(a.dueDate).localeCompare(String(b.dueDate));
    });
    if (!acts.length) {
      host.innerHTML = '<div class="card-body">' + A.empty('tools', 'Không có hành động khắc phục nào',
        scope.hz.length
          ? 'Các báo cáo khớp bộ lọc trong kỳ chưa được giao hành động khắc phục. Cán bộ an toàn giao hành động ở màn hình Chi tiết nguy cơ.'
          : 'Bảng chỉ liệt kê hành động của các báo cáo khớp bộ lọc hiện tại.') +
        '<div class="text-center mt-2"><a class="btn btn-soft btn-sm" href="manager-corrective-actions.html">' +
        '<i class="bi bi-tools me-1"></i>Mở bảng hành động khắc phục</a></div></div>';
      setText('actCount', '0 hành động');
      return;
    }
    var late = acts.filter(function (a) { return store.isOverdue(a); }).length;
    setText('actCount', acts.length + ' hành động · ' + late + ' quá hạn');
    host.innerHTML = '<div class="table-responsive"><table class="table table-hover align-middle mb-0">' +
      '<thead><tr><th scope="col">Mã hành động</th><th scope="col">Việc cần làm</th>' +
      '<th scope="col">Người phụ trách</th><th scope="col">Hạn xử lý</th>' +
      '<th scope="col" class="text-center">Số ngày trễ</th><th scope="col">Trạng thái</th>' +
      '<th scope="col" class="text-end">Thao tác</th></tr></thead><tbody>' +
      acts.map(function (a) {
        var isLate = store.isOverdue(a);
        var d = -A.daysTo(a.dueDate);
        var hz = store.hazard(a.hazardId);
        var lateCell = a.status === 'Hoàn thành' ? '<span class="small text-muted-soft">—</span>'
          : isLate ? '<span class="ss-badge ss-overdue">' + d + ' ngày</span>'
            : '<span class="small text-muted-soft">còn ' + A.daysTo(a.dueDate) + ' ngày</span>';
        return '<tr><td class="ss-row-code">' + A.esc(a.code) + '</td>' +
          '<td><div class="ss-row-title">' + A.esc(a.title) + '</div>' +
          '<div class="ss-row-meta">' + (hz ? '<span class="ss-row-code">' + A.esc(hz.code) + '</span> · ' : '') +
          A.esc(store.zoneName(a.zoneId)) + ' · tiến độ ' + (a.progress || 0) + '%</div></td>' +
          '<td class="small">' + A.esc(store.userName(a.ownerId)) + '</td>' +
          '<td class="small">' + A.date(a.dueDate) + '</td>' +
          '<td class="text-center">' + lateCell + '</td>' +
          '<td>' + A.statusBadge(a.status) + '</td>' +
          '<td class="text-end"><a class="btn btn-ghost btn-sm" href="manager-corrective-actions.html?focus=' +
          encodeURIComponent(a.id) + '" title="Mở hành động ' + A.esc(a.code) + ' ở bảng khắc phục">' +
          '<i class="bi bi-box-arrow-up-right"></i></a></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------- in + CSV ---------- */
  function csvCell(v) {
    var s = String(v == null ? '' : v);
    if (/["\n,;]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function exportCsv() {
    if (!scope.hz.length) {
      A.toast('Bộ lọc hiện không trả về báo cáo nào để xuất. Mở kỳ hoặc bỏ bớt điều kiện lọc.', 'warn', 'Chưa có dữ liệu để xuất');
      return;
    }
    var cols = ['Mã', 'Tiêu đề', 'Khu vực', 'Nhóm nguy cơ', 'Mức độ', 'Ưu tiên', 'Trạng thái',
      'Người báo', 'Người xem xét', 'Ngày tạo', 'Ngày cập nhật', 'Hành động', 'Hành động quá hạn'];
    var lines = [cols.join(',')];
    scope.hz.slice().sort(function (a, b) { return String(a.code).localeCompare(String(b.code)); }).forEach(function (h) {
      var acts = store.actionsOfHazard(h.id);
      var late = acts.filter(function (a) { return store.isOverdue(a); }).length;
      lines.push([
        h.code, h.title, store.zoneName(h.zoneId), h.category, h.level, h.priority, h.status,
        store.userName(h.reporterId), h.reviewerId ? store.userName(h.reviewerId) : 'Chưa phân công',
        A.datetime(h.createdAt), A.datetime(h.updatedAt), acts.length, late
      ].map(csvCell).join(','));
    });
    var csv = '\uFEFF' + lines.join('\r\n');
    var name = 'baocao-' + iso(new Date()) + '.csv';
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    A.toast('Đã xuất ' + scope.hz.length + ' báo cáo trong kỳ ' + (win ? dmy(win.from) + ' → ' + dmy(win.to) : '—') +
      ' ra ' + name + '.', 'success', 'Xuất CSV');
  }

  /* ---------- điều khiển ---------- */
  function syncPeriod() {
    var bs = document.querySelectorAll('#periodGroup button[data-days]');
    Array.prototype.forEach.call(bs, function (b) {
      var on = b.getAttribute('data-days') === f.preset;
      b.className = 'btn btn-sm ' + (on ? 'btn-primary' : 'btn-ghost');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function applyPreset(days) {
    f.preset = days;
    if (days !== 'custom') {
      f.from = '';
      f.to = '';
      document.getElementById('fFrom').value = '';
      document.getElementById('fTo').value = '';
      f.gran = (days === '90' || days === '0') ? 'week' : 'day';
      document.getElementById('fGran').value = f.gran;
    } else {
      f.from = document.getElementById('fFrom').value;
      f.to = document.getElementById('fTo').value;
    }
  }

  function readDates() {
    f.from = document.getElementById('fFrom').value;
    f.to = document.getElementById('fTo').value;
    f.preset = 'custom';
  }

  function clearZoneFilter(showToast) {
    f.zone = '';
    document.getElementById('fZone').value = '';
    document.getElementById('deepLinkAlert').classList.add('d-none');
    try {
      if (history && history.replaceState) history.replaceState(null, '', location.pathname);
    } catch (e) { /* file:// không cho phép sửa lịch sử */ }
    if (showToast) A.toast('Đã bỏ lọc theo khu vực, báo cáo tính lại cho toàn công trường.', 'info');
  }

  function resetFilters() {
    document.getElementById('fStatus').value = '';
    document.getElementById('fGran').value = 'day';
    f.status = '';
    f.gran = 'day';
    clearZoneFilter(false);
    applyPreset('30');
    syncPeriod();
    render();
    A.toast('Đã đặt lại bộ lọc về 30 ngày gần nhất, toàn công trường, mọi trạng thái.', 'info', 'Bộ lọc đã reset');
  }

  /* ---------- deep link ?zone=Z-01 ---------- */
  function setupDeepLink() {
    var zq = A.qs('zone');
    var host = document.getElementById('deepLinkAlert');
    if (!zq) { host.classList.add('d-none'); return; }
    var z = store.zone(zq);
    if (!z) {
      host.classList.add('d-none');
      A.toast('Tham số ?zone=' + zq + ' không khớp khu vực nào trong dữ liệu mẫu nên báo cáo giữ phạm vi toàn công trường.',
        'warn', 'Liên kết không hợp lệ');
      return;
    }
    f.zone = z.id;
    document.getElementById('fZone').value = z.id;
    set('deepLinkZone', A.esc(z.name));
    host.classList.remove('d-none');
  }

  /* ---------- vẽ toàn màn hình ---------- */
  function render() {
    win = buildWindow();
    var badEl = document.getElementById('badRange');
    if (!win) {
      scope.hz = [];
      scope.acts = [];
      scope.insp = [];
      scope.buckets = [];
      scope.zones = [];
      badEl.classList.remove('d-none');
    } else {
      badEl.classList.add('d-none');
      scope.hz = hazScope();
      scope.acts = actScope(scope.hz);
      scope.insp = inspScope();
      scope.buckets = makeBuckets();
      fillBuckets();
      scope.zones = zoneRows(scope.hz, scope.acts);
    }
    reportHead();
    windowLabel();
    kpis();
    noDataMsg();
    trend();
    levelDonut();
    statusDonut();
    zoneBars();
    matrix();
    cats();
    actions();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var zones = store.list('zones').filter(function (z) { return z.active; });
    set('fZone', '<option value="">Mọi khu vực (' + zones.length + ')</option>' + zones.map(function (z) {
      return '<option value="' + A.esc(z.id) + '">' + A.esc(z.name) + '</option>';
    }).join(''));
    set('fStatus', '<option value="">Mọi trạng thái</option>' + HAZ_STATUS.map(function (s) {
      return '<option value="' + A.esc(s) + '">' + A.esc(s) + '</option>';
    }).join(''));

    document.getElementById('periodGroup').addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('button[data-days]') : null;
      if (!b) return;
      applyPreset(b.getAttribute('data-days'));
      syncPeriod();
      render();
    });
    ['fFrom', 'fTo'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        readDates();
        syncPeriod();
        render();
      });
    });
    document.getElementById('fGran').addEventListener('change', function (e) { f.gran = e.target.value; render(); });
    document.getElementById('fZone').addEventListener('change', function (e) {
      f.zone = e.target.value;
      if (!f.zone) document.getElementById('deepLinkAlert').classList.add('d-none');
      else set('deepLinkZone', A.esc(store.zoneName(f.zone)));
      render();
    });
    document.getElementById('fStatus').addEventListener('change', function (e) { f.status = e.target.value; render(); });
    document.getElementById('btnReset').addEventListener('click', resetFilters);
    document.getElementById('deepLinkClear').addEventListener('click', function () { clearZoneFilter(true); render(); });
    document.getElementById('btnPrint').addEventListener('click', function () { window.print(); });
    document.getElementById('btnCsv').addEventListener('click', exportCsv);

    // nút trong trạng thái rỗng
    document.getElementById('noData').addEventListener('click', function (e) {
      var broaden = e.target.closest ? e.target.closest('[data-broaden]') : null;
      var reset = e.target.closest ? e.target.closest('[data-clear-filters]') : null;
      if (broaden) { applyPreset('0'); syncPeriod(); render(); }
      else if (reset) { resetFilters(); }
    });

    setupDeepLink();
    syncPeriod();
    render();
  });
})();
