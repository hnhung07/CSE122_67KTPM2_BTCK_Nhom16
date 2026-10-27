/* Vẽ biểu đồ bằng SVG thuần (không thư viện ngoài) để chạy cả khi offline. */
(function (global) {
  'use strict';

  var LEVEL_COLOR = {
    'Thấp': '#2fa36b',
    'Trung bình': '#e0a410',
    'Cao': '#ef7b3d',
    'Nghiêm trọng': '#d94f5c',
    'An toàn': '#1ba99c'
  };
  var SERIES = ['#1ba99c', '#7c5cad', '#e07a9a', '#e0a410', '#2fa36b', '#158b81', '#ef7b3d', '#5a3fa0'];
  var gradSeq = 0;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function colorOf(label, i) { return LEVEL_COLOR[label] || SERIES[i % SERIES.length]; }

  function donut(host, items, opts) {
    opts = opts || {};
    var total = items.reduce(function (s, it) { return s + it.value; }, 0);
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', opts.aria || ('Biểu đồ tròn, tổng ' + total));
    if (!total) {
      host.innerHTML = '<div class="ss-empty py-4"><i class="bi bi-pie-chart"></i><p class="small mb-0">Chưa có dữ liệu để vẽ biểu đồ.</p></div>';
      return;
    }
    var r = 54, c = 2 * Math.PI * r, off = 0, segs = '';
    items.forEach(function (it, i) {
      var len = (it.value / total) * c;
      segs += '<circle r="' + r + '" cx="70" cy="70" fill="none" stroke="' + (it.color || colorOf(it.label, i)) + '" stroke-width="20" ' +
        'stroke-dasharray="' + len + ' ' + (c - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 70 70)">' +
        '<title>' + esc(it.label) + ': ' + it.value + '</title></circle>';
      off += len;
    });
    var legend = items.map(function (it, i) {
      return '<div class="d-flex align-items-center gap-2 small"><span class="ss-swatch" style="background:' + (it.color || colorOf(it.label, i)) + '"></span>' +
        '<span class="text-muted-soft">' + esc(it.label) + '</span><strong class="ms-auto">' + it.value + '</strong></div>';
    }).join('');
    host.innerHTML = '<div class="d-flex flex-wrap align-items-center gap-3">' +
      '<svg viewBox="0 0 140 140" style="width:140px;height:140px;flex:0 0 140px">' + segs +
      '<text x="70" y="66" text-anchor="middle" font-size="22" font-weight="700" fill="#10333a">' + total + '</text>' +
      '<text x="70" y="84" text-anchor="middle" font-size="10" fill="#4b6a72">' + esc(opts.centerLabel || 'Bản ghi') + '</text></svg>' +
      '<div class="flex-grow-1" style="min-width:150px">' + legend + '</div></div>';
  }

  // biểu đồ cột ngang: items=[{label,value,color}]
  function bars(host, items, opts) {
    opts = opts || {};
    var max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', opts.aria || 'Biểu đồ cột');
    if (!items.length) {
      host.innerHTML = '<div class="ss-empty py-4"><i class="bi bi-bar-chart"></i><p class="small mb-0">Không có dữ liệu trong bộ lọc đang chọn.</p></div>';
      return;
    }
    host.innerHTML = '<div style="display:grid;gap:9px">' + items.map(function (it, i) {
      var w = Math.round((it.value / max) * 100);
      return '<div><div class="d-flex justify-content-between small mb-1"><span>' + esc(it.label) + '</span><strong>' + it.value + '</strong></div>' +
        '<div class="progress" style="height:10px"><div class="progress-bar" style="width:' + w + '%;background:' + (it.color || colorOf(it.label, i)) + '"></div></div></div>';
    }).join('') + '</div>';
  }

  // biểu đồ miền theo ngày: points=[{label,value}]
  function area(host, points, opts) {
    opts = opts || {};
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', opts.aria || 'Biểu đồ theo thời gian');
    if (!points || points.length < 2) {
      host.innerHTML = '<div class="ss-empty py-4"><i class="bi bi-graph-up"></i><p class="small mb-0">Cần ít nhất 2 mốc thời gian để vẽ biểu đồ.</p></div>';
      return;
    }
    var w = 460, h = 150, pad = 18;
    var max = Math.max.apply(null, points.map(function (p) { return p.value; }).concat([1]));
    var step = (w - pad * 2) / (points.length - 1);
    var xy = points.map(function (p, i) { return [pad + i * step, h - pad - (p.value / max) * (h - pad * 2)]; });
    var line = xy.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var areaPath = line + ' L' + xy[xy.length - 1][0].toFixed(1) + ' ' + (h - pad) + ' L' + xy[0][0].toFixed(1) + ' ' + (h - pad) + ' Z';
    var gid = 'ssag' + (++gradSeq);
    host.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + h + '" class="w-100" preserveAspectRatio="none" style="min-height:130px">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1ba99c" stop-opacity=".35"/>' +
      '<stop offset="100%" stop-color="#1ba99c" stop-opacity=".02"/></linearGradient></defs>' +
      [0.25, 0.5, 0.75].map(function (g) { return '<line x1="' + pad + '" x2="' + (w - pad) + '" y1="' + (h * g) + '" y2="' + (h * g) + '" stroke="#d9e8e6" stroke-dasharray="3 4"/>'; }).join('') +
      '<path d="' + areaPath + '" fill="url(#' + gid + ')"/><path d="' + line + '" fill="none" stroke="#158b81" stroke-width="2.5" stroke-linejoin="round"/>' +
      xy.map(function (p, i) {
        return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="#fff" stroke="#158b81" stroke-width="2">' +
          '<title>' + esc(points[i].label) + ': ' + points[i].value + '</title></circle>';
      }).join('') + '</svg>' +
      '<div class="d-flex justify-content-between small text-muted-soft mt-1"><span>' + esc(points[0].label) + '</span><span>' + esc(points[points.length - 1].label) + '</span></div>';
  }

  // ma trận rủi ro 5x5: counts={'{likelihood}-{impact}': n}
  function matrix(host, cells, opts) {
    opts = opts || {};
    host.setAttribute('role', 'img');
    host.setAttribute('aria-label', opts.aria || 'Ma trận rủi ro 5x5 theo khả năng xảy ra và mức hậu quả');
    var html = '';
    for (var impact = 5; impact >= 1; impact--) {
      for (var lk = 1; lk <= 5; lk++) {
        var key = lk + '-' + impact;
        var n = (cells || {})[key] || 0;
        var score = lk * impact;
        var bg = score >= 15 ? '#d94f5c' : score >= 9 ? '#ef7b3d' : score >= 5 ? '#e0a410' : '#2fa36b';
        var clickable = opts.onCell && n > 0;
        html += '<button type="button" class="cell' + (n ? '' : ' empty') + '" style="background:' + (n ? bg : '#edf3f2') + ';color:' + (n ? '#fff' : '#93a8a5') + '"' +
          (clickable ? ' data-cell="' + key + '" aria-label="Khả năng ' + lk + ', hậu quả ' + impact + ': ' + n + ' nguy cơ"' : ' disabled aria-label="Ô trống"') + '>' +
          (n || '') + '</button>';
      }
    }
    host.innerHTML = '<div class="d-flex gap-2"><div class="d-flex align-items-center small text-muted-soft" style="writing-mode:vertical-rl;transform:rotate(180deg)">Mức hậu quả →</div>' +
      '<div class="flex-grow-1"><div class="ss-matrix">' + html + '</div>' +
      '<div class="small text-muted-soft mt-1 text-center">Khả năng xảy ra →</div></div></div>';
    if (opts.onCell) {
      host.querySelectorAll('[data-cell]').forEach(function (b) {
        b.addEventListener('click', function () { opts.onCell(b.getAttribute('data-cell')); });
      });
    }
  }

  function sparkline(points, color) {
    if (!points.length) return '';
    var max = Math.max.apply(null, points.concat([1]));
    var step = 42 / Math.max(1, points.length - 1);
    var d = points.map(function (v, i) { return (i ? 'L' : 'M') + (i * step).toFixed(1) + ' ' + (16 - (v / max) * 14).toFixed(1); }).join(' ');
    return '<svg width="46" height="18" viewBox="0 0 46 18" aria-hidden="true"><path d="' + d + '" fill="none" stroke="' + (color || '#1ba99c') + '" stroke-width="2"/></svg>';
  }

  global.SiteSafeCharts = {
    LEVEL_COLOR: LEVEL_COLOR, SERIES: SERIES, donut: donut, bars: bars, area: area, matrix: matrix, sparkline: sparkline
  };
})(window);
