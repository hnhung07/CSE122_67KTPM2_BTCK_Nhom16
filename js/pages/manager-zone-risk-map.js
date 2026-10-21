/* SCR-07 · Bản đồ rủi ro khu vực (SV3 – Đỗ Hồng Nhung)
   Điểm nhấn: sơ đồ tổng mặt bằng vẽ bằng SVG thuần từ toạ độ khu vực trong dữ liệu,
   tô nhiệt theo điểm rủi ro, chọn khu vực bằng chuột/bàn phím và đối chiếu được
   từng con số với danh sách nguy cơ. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var C = window.SiteSafeCharts;
  var AI = window.SiteSafeAI;

  var IMPACT = { 'Thấp': 1, 'Trung bình': 2, 'Cao': 4, 'Nghiêm trọng': 5 };
  var BANDS = [
    { level: 'Nghiêm trọng', label: 'Rủi ro rất cao', color: '#d94f5c' },
    { level: 'Cao', label: 'Rủi ro cao', color: '#ef7b3d' },
    { level: 'Trung bình', label: 'Rủi ro trung bình', color: '#e0a410' },
    { level: 'Thấp', label: 'Rủi ro thấp', color: '#2fa36b' },
    { level: 'An toàn', label: 'Chưa ghi nhận nguy cơ', color: '#1ba99c' }
  ];

  var s = { q: '', band: '', period: 30, heat: true, onlyOpen: false, onlyCritical: false, zone: '', cell: '', pin: '' };

  /* ---------- tính rủi ro theo cửa sổ thời gian ---------- */
  function sinceDate() {
    if (s.period >= 9999) return 0;
    return Date.now() - s.period * 864e5;
  }
  function inWindow(h) { return new Date(h.createdAt).getTime() >= sinceDate(); }

  function stats(zoneId) {
    var all = store.hazardsOfZone(zoneId);
    var listed = all.filter(inWindow);
    var open = listed.filter(store.isOpenHazard);
    var weight = open.reduce(function (t, h) { return t + (store.LEVEL_WEIGHT[h.level] || 1); }, 0);
    var overdue = store.where('actions', function (a) { return a.zoneId === zoneId && store.isOverdue(a); });
    var recent7 = open.filter(function (h) { return new Date(h.createdAt) > Date.now() - 7 * 864e5; }).length;
    var score = weight + overdue.length * 2 + recent7;
    var band = store.riskBand(score);
    return {
      zoneId: zoneId, hazards: listed, open: open, score: score, band: band,
      critical: open.filter(function (h) { return h.level === 'Nghiêm trọng'; }).length,
      overdue: overdue,
      byLevel: store.tally(open, 'level')
    };
  }

  function visibleZones() {
    return store.where('zones', function (z) {
      if (!z.active) return false;
      if (s.q && (z.name + ' ' + z.code + ' ' + (z.type || '')).toLowerCase().indexOf(s.q.toLowerCase()) === -1) return false;
      return true;
    }).map(function (z) {
      var st = stats(z.id);
      st.zone = z;
      return st;
    }).filter(function (st) {
      if (s.band && st.band.level !== s.band) return false;
      if (s.onlyOpen && !st.open.length) return false;
      if (s.onlyCritical && !st.critical) return false;
      return true;
    });
  }

  function cellHazards() {
    if (!s.cell) return [];
    var p = s.cell.split('-');
    return store.list('hazards').filter(function (h) {
      if (!inWindow(h) || !store.isOpenHazard(h)) return false;
      var z = store.zone(h.zoneId);
      return z && z.active && likelihoodOf(h) === +p[0] && (IMPACT[h.level] || 1) === +p[1];
    });
  }
  function likelihoodOf(h) {
    var n = store.where('hazards', function (x) {
      return x.zoneId === h.zoneId && inWindow(x) && store.isOpenHazard(x);
    }).length;
    return Math.max(1, Math.min(5, n));
  }

  /* ---------- KPI ---------- */
  function kpis() {
    var zs = store.where('zones', function (z) { return z.active; }).map(function (z) { return stats(z.id); });
    var acts = store.list('actions').filter(function (a) { return a.status !== 'Hoàn thành'; });
    var onTime = acts.filter(function (a) { return !store.isOverdue(a); }).length;
    var cards = [
      { v: zs.length, l: 'Khu vực hoạt động', i: 'map', c: 'var(--ss-teal-700)' },
      { v: zs.reduce(function (t, x) { return t + x.open.length; }, 0), l: 'Nguy cơ đang mở', i: 'exclamation-diamond', c: '#b0521b' },
      { v: zs.filter(function (x) { return x.band.level === 'Nghiêm trọng' || x.band.level === 'Cao'; }).length, l: 'Vùng rủi ro cao', i: 'fire', c: '#a82d3b' },
      { v: acts.length - onTime, l: 'Hành động quá hạn', i: 'alarm', c: '#a82d3b' },
      { v: (acts.length ? Math.round(onTime / acts.length * 100) : 100) + '%', l: 'Đúng hạn', i: 'stopwatch', c: '#1d7a4c' }
    ];
    document.getElementById('kpis').innerHTML = cards.map(function (c) {
      return '<div class="col-6 col-xl-2"><div class="card h-100"><div class="card-body ss-kpi">' +
        '<div class="d-flex justify-content-between align-items-start"><span class="ss-kpi-value" style="color:' + c.c + '">' + c.v + '</span>' +
        '<span class="ss-kpi-icon"><i class="bi bi-' + c.i + '"></i></span></div><div class="ss-kpi-label">' + c.l + '</div></div></div></div>';
    }).join('');
  }

  /* ---------- SVG mặt bằng ---------- */
  /* Chỉ bỏ tiền thừa ở đầu tên; cắt "Khu " giữa chuỗi sẽ thành "vực thử nghiệm" khó đọc. */
  function shortName(z) {
    var n = z.name.replace(/^Công trình\s+/, '');
    return n.length > 22 ? n.slice(0, 21) + '…' : n;
  }

  function drawMap() {
    var all = store.where('zones', function (z) { return z.active; });
    var shown = visibleZones();
    var byId = {};
    shown.forEach(function (st) { byId[st.zoneId] = st; });

    var body = all.map(function (z) {
      var st = byId[z.id];
      var m = z.map || { x: 0, y: 0, w: 100, h: 100 };
      var cx = m.x + m.w / 2, cy = m.y + m.h / 2;
      if (!st) {
        return '<g class="ss-zone" opacity=".22" data-zone="' + z.id + '" tabindex="0" role="button" aria-label="' + A.esc(z.name) + ' (bị lọc)">' +
          '<rect x="' + m.x + '" y="' + m.y + '" width="' + m.w + '" height="' + m.h + '" fill="#9fb4b1" stroke-dasharray="6 5"></rect>' +
          '<text class="ss-zone-name" x="' + cx + '" y="' + cy + '" text-anchor="middle">' + A.esc(shortName(z)) + '</text></g>';
      }
      var col = C.LEVEL_COLOR[st.band.level] || '#1ba99c';
      var op = s.heat ? Math.min(.92, .34 + st.score / 26) : .5;
      var sel = s.zone === z.id;
      return '<g class="ss-zone' + (sel ? ' is-active' : '') + '" data-zone="' + z.id + '" tabindex="0" role="button" ' +
        'aria-label="' + A.esc(z.name + ': ' + st.open.length + ' nguy cơ mở, điểm rủi ro ' + st.score + ', ' + st.band.label) + '">' +
        '<rect x="' + m.x + '" y="' + m.y + '" width="' + m.w + '" height="' + m.h + '" rx="10" fill="' + col + '" fill-opacity="' + op.toFixed(2) + '"></rect>' +
        (st.critical && s.heat ? '<circle class="ss-heat-pulse" cx="' + cx + '" cy="' + (m.y + 24) + '" r="9" fill="#fff" opacity=".85"></circle>' +
          '<text x="' + cx + '" y="' + (m.y + 28) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + col + '">' + st.critical + '</text>' : '') +
        '<text class="ss-zone-name" x="' + cx + '" y="' + (m.y + (st.critical && s.heat ? 50 : 34)) + '" text-anchor="middle">' + A.esc(shortName(z)) + '</text>' +
        '<text class="ss-zone-meta" x="' + cx + '" y="' + (m.y + (st.critical && s.heat ? 66 : 50)) + '" text-anchor="middle">' +
        st.open.length + ' mở · điểm ' + st.score + (st.overdue.length ? ' · ' + st.overdue.length + ' quá hạn' : '') + '</text>' +
        (sel ? '<text class="ss-zone-meta" x="' + cx + '" y="' + (m.y + m.h - 10) + '" text-anchor="middle">Đang xem chi tiết ▾</text>' : '') +
        '</g>';
    }).join('');

    document.getElementById('mapHost').innerHTML =
      '<svg viewBox="0 0 1000 620" role="img" aria-label="Sơ đồ tổng mặt bằng công trường, tô màu theo mức rủi ro từng khu vực">' +
      '<rect x="0" y="0" width="1000" height="620" fill="#f6fbfa"></rect>' +
      [100, 200, 300, 400, 500].map(function (y) { return '<line x1="20" x2="980" y1="' + y + '" y2="' + y + '" stroke="#dcece9" stroke-dasharray="4 8"/>'; }).join('') +
      [200, 400, 600, 800].map(function (x) { return '<line x1="' + x + '" x2="' + x + '" y1="20" y2="600" stroke="#dcece9" stroke-dasharray="4 8"/>'; }).join('') +
      '<text x="20" y="30" font-size="11" fill="#6a8f8a">Cổng chính · đường nội bộ</text>' +
      body + '</svg>';

    document.getElementById('mapLegend').innerHTML = BANDS.map(function (b) {
      var n = all.filter(function (z) { var st = stats(z.id); return st.band.level === b.level; }).length;
      return '<span class="d-inline-flex align-items-center gap-1"><span class="ss-swatch" style="background:' + b.color + '"></span>' +
        b.label + ' <strong>' + n + '</strong></span>';
    }).join('') +
      '<span class="d-inline-flex align-items-center gap-1"><span style="color:#d94f5c">●</span> số vòng tròn = nguy cơ Nghiêm trọng</span>';

    document.querySelectorAll('#mapHost [data-zone]').forEach(function (g) {
      g.addEventListener('click', function () { select(g.getAttribute('data-zone')); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(g.getAttribute('data-zone')); }
      });
    });

    var total = shown.reduce(function (t, x) { return t + x.open.length; }, 0);
    document.getElementById('mapHint').innerHTML = shown.length + ' khu vực khớp lọc · ' + total + ' nguy cơ đang mở';
  }

  function select(zoneId) {
    s.zone = s.zone === zoneId ? '' : zoneId;
    s.cell = '';
    drawMap(); renderPanel();
  }

  /* ---------- bảng chi tiết khu vực ---------- */
  function renderPanel() {
    var host = document.getElementById('zonePanel');
    if (!s.zone) {
      var top = ranked().slice(0, 4);
      host.innerHTML = '<div class="card"><div class="card-header"><i class="bi bi-hand-index-thumb me-1"></i>Chưa chọn khu vực</div>' +
        '<div class="card-body"><div class="ss-row-meta mb-2">Bấm vào sơ đồ (hoặc dùng phím Enter) để mở hồ sơ rủi ro của một khu vực. ' +
        'Bốn vùng rủi ro cao nhất hiện nay:</div>' +
        top.map(function (st) { return rankRow(st); }).join('') + '</div></div>';
      host.querySelectorAll('[data-pick]').forEach(function (b) {
        b.addEventListener('click', function () { select(b.getAttribute('data-pick')); });
      });
      return;
    }
    var z = store.zone(s.zone);
    var st = stats(z.id);
    var hazards = st.open.slice().sort(function (a, b) { return (store.LEVEL_WEIGHT[b.level] || 0) - (store.LEVEL_WEIGHT[a.level] || 0); });
    host.innerHTML = '<div class="card">' +
      '<div class="card-header d-flex justify-content-between align-items-center">' +
      '<span><i class="bi bi-geo-alt-fill me-1"></i>' + A.esc(z.name) + '</span>' +
      '<button class="btn btn-ghost btn-sm py-0" id="closeZone" aria-label="Đóng bảng chi tiết khu vực"><i class="bi bi-x-lg"></i></button></div>' +
      '<div class="card-body">' +
      '<div class="d-flex flex-wrap gap-2 align-items-center mb-2">' +
      '<span class="ss-badge" style="background:' + (C.LEVEL_COLOR[st.band.level]) + '20;color:' + C.LEVEL_COLOR[st.band.level] + ';border:1px solid ' + C.LEVEL_COLOR[st.band.level] + '55">' +
      A.esc(st.band.label) + '</span>' +
      A.levelBadge(st.band.level) +
      '<span class="ss-chip"><i class="bi bi-speedometer2"></i>điểm ' + st.score + '</span>' +
      '<span class="ss-chip"><i class="bi bi-clipboard2-pulse"></i>' + st.open.length + '/' + st.hazards.length + ' đang mở</span>' +
      (st.overdue.length ? '<span class="ss-chip" style="color:#a82d3b;border-color:#f5bfc6"><i class="bi bi-alarm"></i>' + st.overdue.length + ' quá hạn</span>' : '') +
      '</div>' +
      '<div class="row g-2 small mb-3"><div class="col-6"><span class="ss-row-meta d-block">Mã khu vực</span><strong>' + A.esc(z.code) + '</strong></div>' +
      '<div class="col-6"><span class="ss-row-meta d-block">Phụ trách</span><strong>' + A.esc(z.head || '—') + '</strong></div>' +
      '<div class="col-6"><span class="ss-row-meta d-block">Loại</span><strong>' + A.esc(z.type || '—') + '</strong></div>' +
      '<div class="col-6"><span class="ss-row-meta d-block">Cửa sổ dữ liệu</span><strong>' + (s.period >= 9999 ? 'toàn bộ' : s.period + ' ngày') + '</strong></div></div>' +
      '<div id="zoneDonut" class="mb-3"></div>' +
      '<div class="ss-section-title mb-2">Nguy cơ đang mở</div>' +
      (hazards.length ? hazards.slice(0, 6).map(function (h) {
        return '<a class="d-flex gap-2 align-items-start text-decoration-none border-top py-2" href="manager-corrective-actions.html?zone=' + z.id + '&hazard=' + h.id + '">' +
          '<span class="flex-grow-1 min-w-0"><span class="ss-row-code">' + A.esc(h.code) + '</span> ' + A.levelBadge(h.level) +
          '<div class="small fw-semibold">' + A.esc(h.title) + '</div>' +
          '<div class="ss-row-meta">' + A.esc(h.category) + ' · ' + A.statusBadge(h.status) + '</div></span>' +
          '<i class="bi bi-chevron-right text-muted-soft mt-3"></i></a>';
      }).join('') + (hazards.length > 6 ? '<div class="ss-row-meta pt-2">Còn ' + (hazards.length - 6) + ' báo cáo khác trong khu vực.</div>' : '')
        : '<div class="small text-muted-soft mb-2">Không còn nguy cơ mở nào trong cửa sổ đang chọn.</div>') +
      '<div class="d-flex flex-wrap gap-2 mt-3">' +
      '<a class="btn btn-primary btn-sm" href="manager-corrective-actions.html?zone=' + z.id + '"><i class="bi bi-tools me-1"></i>Hành động khắc phục khu vực</a>' +
      '<a class="btn btn-ghost btn-sm" href="manager-safety-report.html?zone=' + z.id + '"><i class="bi bi-file-earmark-bar-graph me-1"></i>Báo cáo khu vực</a>' +
      '</div></div></div>';

    document.getElementById('closeZone').addEventListener('click', function () { select(''); });
    C.donut(document.getElementById('zoneDonut'), Object.keys(st.byLevel).map(function (k) {
      return { label: k, value: st.byLevel[k] };
    }), { centerLabel: 'nguy cơ', aria: 'Cơ cấu mức độ nguy cơ đang mở tại ' + z.name });
  }

  function rankRow(st) {
    return '<button class="btn btn-ghost btn-sm text-start w-100 mb-1 d-flex justify-content-between align-items-center" data-pick="' + st.zoneId + '">' +
      '<span class="min-w-0 text-truncate">' + A.esc(st.zone.name) + '</span>' +
      '<span class="ss-badge" style="background:' + C.LEVEL_COLOR[st.band.level] + '20;color:' + C.LEVEL_COLOR[st.band.level] + '">' + st.score + '</span></button>';
  }

  function ranked() {
    return store.where('zones', function (z) { return z.active; }).map(function (z) {
      var st = stats(z.id); st.zone = z; return st;
    }).sort(function (a, b) { return b.score - a.score; });
  }

  function drawRanking() {
    C.bars(document.getElementById('chartZones'), ranked().slice(0, 8).map(function (st) {
      return { label: st.zone.name.replace('Công trình ', ''), value: st.score, color: C.LEVEL_COLOR[st.band.level] };
    }), { aria: 'Xếp hạng điểm rủi ro của các khu vực' });
  }

  /* ---------- ma trận + xếp hạng (bản có khu vực được chọn) ---------- */
  function drawMatrix() {
    var host = document.getElementById('matrix');
    var cells = {};
    store.where('hazards', function (h) {
      var z = store.zone(h.zoneId);
      return inWindow(h) && store.isOpenHazard(h) && z && z.active;
    }).forEach(function (h) {
      var key = likelihoodOf(h) + '-' + (IMPACT[h.level] || 1);
      cells[key] = (cells[key] || 0) + 1;
    });
    C.matrix(host, cells, {
      onCell: function (key) {
        s.cell = s.cell === key ? '' : key;
        drawMatrix();
        renderMatrixNote();
      }
    });
    // đánh dấu ô đang lọc
    host.querySelectorAll('[data-cell]').forEach(function (b) {
      if (b.getAttribute('data-cell') === s.cell) b.classList.add('is-sel');
    });
    renderMatrixNote();
  }

  function renderMatrixNote() {
    var old = document.getElementById('matrixNote');
    if (old) old.remove();
    var list = cellHazards();
    if (!s.cell) return;
    var p = s.cell.split('-');
    var box = document.createElement('div');
    box.id = 'matrixNote';
    box.className = 'mt-2';
    box.innerHTML = '<div class="ss-item"><div class="d-flex justify-content-between align-items-start gap-2">' +
      '<div class="min-w-0"><div class="fw-semibold small">' + list.length + ' nguy cơ ở ô khả năng ' + p[0] + ' × hậu quả ' + p[1] + '</div>' +
      '<div class="ss-row-meta">' + A.esc(list.slice(0, 3).map(function (h) { return h.code; }).join(', ')) + (list.length > 3 ? '…' : '') + '</div></div>' +
      '<button class="btn btn-ghost btn-sm py-0" id="cellClear" aria-label="Bỏ chọn ô ma trận"><i class="bi bi-x-lg"></i></button></div>' +
      (list.length ? '<div class="mt-2">' + list.slice(0, 5).map(function (h) {
        return '<div class="d-flex gap-2 align-items-center small border-top pt-1 mt-1">' + A.levelBadge(h.level) +
          '<span class="text-truncate">' + A.esc(h.title) + '</span>' +
          '<span class="ss-row-code ms-auto">' + A.esc(store.zoneName(h.zoneId).slice(0, 18)) + '</span></div>';
      }).join('') + '</div>' : '') + '</div>';
    document.getElementById('matrix').parentNode.appendChild(box);
    document.getElementById('cellClear').addEventListener('click', function () { s.cell = ''; drawMatrix(); });
  }

  /* ---------- AI-03 ---------- */
  function renderAi() {
    var host = document.getElementById('aiInsight');
    var r = AI.hotspot({ days: s.period >= 9999 ? 365 : s.period });
    if (r.status === 'no-data') {
      host.innerHTML = '<div class="small text-muted-soft"><i class="bi bi-cloud-slash me-1"></i>' + A.esc(r.message) + '</div>';
      return;
    }
    host.innerHTML =
      '<div class="d-flex flex-wrap gap-2 mb-2 align-items-center">' +
      '<span class="ss-chip"><i class="bi bi-fire"></i>' + A.esc(r.top.name) + '</span>' +
      '<span class="ss-ai-conf" style="flex:1 1 140px"><div class="ss-ai-bar"><span style="width:' + Math.round(r.confidence * 100) + '%"></span></div>' +
      '<strong class="small">' + Math.round(r.confidence * 100) + '%</strong></span></div>' +
      '<ul class="ss-ai-reason ps-3 mb-2">' + r.narrative.map(function (t) { return '<li>' + A.esc(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="ss-section-title mb-1">Xếp hạng điểm nóng</div>' +
      r.hotspots.map(function (h, i) {
        return '<div class="d-flex gap-2 align-items-center py-1 border-top">' +
          '<span class="ss-item-num">' + (i + 1) + '</span><span class="flex-grow-1 min-w-0">' +
          '<span class="small fw-semibold d-block text-truncate">' + A.esc(h.name) + '</span>' +
          '<span class="ss-row-meta">' + h.open + ' mở · ' + h.critical + ' nghiêm trọng · ' + h.overdue + ' quá hạn</span></span>' +
          '<button class="btn btn-ghost btn-sm py-0" data-hot="' + h.zoneId + '" aria-label="Xem khu vực ' + A.esc(h.name) + '"><i class="bi bi-geo-alt"></i></button></div>';
      }).join('') +
      '<div class="ss-section-title mt-3 mb-1">Gợi ý kiểm tra</div>' +
      '<ul class="ps-3 small mb-2">' + r.suggestions.map(function (t) { return '<li>' + A.esc(t) + '</li>'; }).join('') + '</ul>' +
      '<div class="ss-ai-actions">' +
      (s.pin ? '<span class="ss-badge ss-st-Đãxácnhận"><i class="bi bi-pin-angle-fill"></i>Đã ghi nhận ưu tiên: ' + A.esc(store.zoneName(s.pin)) + '</span>' :
        '<button class="btn btn-primary btn-sm" data-accept><i class="bi bi-check2 me-1"></i>Ghi nhận, đưa vào danh sách ưu tiên</button>') +
      '<button class="btn btn-ghost btn-sm" data-reject>Không phù hợp thực tế</button></div>' +
      '<div class="ss-ai-note mt-2">' + A.esc(r.disclaimer) + '</div>';

    host.querySelectorAll('[data-hot]').forEach(function (b) {
      b.addEventListener('click', function () { select(b.getAttribute('data-hot')); });
    });
    var acc = host.querySelector('[data-accept]');
    if (acc) acc.addEventListener('click', function () {
      s.pin = r.top.zoneId;
      var db = store.read();
      db.notifications.unshift({ id: 'N-' + Date.now(), at: new Date().toISOString(), role: 'manager', text: 'Đã ghi nhận ưu tiên kiểm tra ' + r.top.name + ' theo gợi ý AI-03 (mô phỏng).', kind: 'nhắc việc' });
      db.notifications = db.notifications.slice(0, 30);
      store.write(db);
      A.toast('Đã ghim ' + r.top.name + ' làm khu vực ưu tiên và ghi vào mục thông báo.', 'success');
      renderAi();
    });
    host.querySelectorAll('[data-reject]').forEach(function (b) {
      b.addEventListener('click', function () {
        A.confirm({
          title: 'Từ chối gợi ý điểm nóng?',
          body: 'Bộ luật xếp hạng dựa trên trọng số mức độ và số hành động quá hạn. Hãy tự đánh giá nếu hiện trường khác.',
          detail: 'Gợi ý sẽ được ẩn khỏi bảng điều khiển này cho tới khi bạn đổi bộ lọc.',
          okText: 'Ẩn gợi ý'
        }, function () {
          host.innerHTML = '<div class="small text-muted-soft"><i class="bi bi-person-check me-1"></i>Bạn đã từ chối đề xuất và sẽ tự xếp hạng theo kiểm tra thực tế. ' +
            '<button class="btn btn-ghost btn-sm py-0" id="undoAi">Xem lại gợi ý</button></div>';
          document.getElementById('undoAi').addEventListener('click', renderAi);
        });
      });
    });
  }

  /* ---------- bộ lọc ---------- */
  function initFilters() {
    document.getElementById('fBand').innerHTML = '<option value="">Mọi mức rủi ro</option>' +
      BANDS.map(function (b) { return '<option value="' + b.level + '">' + b.label + '</option>'; }).join('');
    var q = A.qs('zone');
    if (q && store.zone(q)) { s.zone = q; }
  }

  function wire() {
    document.getElementById('q').addEventListener('input', A.debounce(function (e) { s.q = e.target.value; drawMap(); }, 200));
    document.getElementById('fBand').addEventListener('change', function (e) { s.band = e.target.value; drawMap(); });
    document.getElementById('fPeriod').addEventListener('change', function (e) {
      s.period = +e.target.value; kpis(); drawMap(); drawMatrix(); drawRanking(); renderAi(); renderPanel();
      A.toast('Đã tính lại toàn bộ số liệu theo cửa sổ ' + (s.period >= 9999 ? 'toàn bộ' : s.period + ' ngày') + '.', 'info');
    });
    document.getElementById('heatOn').addEventListener('change', function (e) { s.heat = e.target.checked; drawMap(); });
    document.getElementById('onlyOpen').addEventListener('change', function (e) { s.onlyOpen = e.target.checked; drawMap(); });
    document.getElementById('onlyCritical').addEventListener('change', function (e) { s.onlyCritical = e.target.checked; drawMap(); });
    document.getElementById('resetView').addEventListener('click', function () {
      s.q = ''; s.band = ''; s.onlyOpen = false; s.onlyCritical = false; s.zone = ''; s.cell = '';
      document.getElementById('q').value = '';
      document.getElementById('fBand').value = '';
      document.getElementById('onlyOpen').checked = false;
      document.getElementById('onlyCritical').checked = false;
      drawMap(); drawMatrix(); drawRanking(); renderPanel();
    });
  }

  function renderAll() {
    kpis(); drawMap(); drawMatrix(); drawRanking(); renderPanel(); renderAi();
  }

  initFilters();
  wire();
  renderAll();
  if (s.zone) {
    A.toast('Bảng đang thu hẹp theo khu vực ' + store.zoneName(s.zone) + ' từ liên kết bên ngoài.', 'info');
  }
})();
