/* SCR-01 · Checklist an toàn (SV1 – Lê Thị Mai Ngọc)
   Chọn checklist được giao, đánh giá từng mục, lưu tự động và gửi kết quả. */
(function () {
  'use strict';
  var store = window.SiteSafeStore;
  var A = window.SiteSafeApp;
  var CHOICES = [
    { v: 'Đạt', icon: 'check2-circle', cls: 'ss-lv-Thấp' },
    { v: 'Không đạt', icon: 'x-octagon', cls: 'ss-lv-Nghiêmtrọng' },
    { v: 'Cần theo dõi', icon: 'eye', cls: 'ss-lv-Trungbình' }
  ];
  var current = null;
  var filter = 'all';

  function me() { return store.session(); }
  function myRuns() { return store.where('runs', function (r) { return r.assigneeId === me().userId; }); }
  function isOpen(r) { return ['Bản nháp', 'Đang thực hiện'].indexOf(r.status) !== -1; }
  function answered(r) { return Object.keys(r.results || {}).length; }

  function renderList() {
    var runs = myRuns().filter(function (r) {
      if (filter === 'open') return isOpen(r);
      if (filter === 'done') return !isOpen(r);
      return true;
    });
    var host = document.getElementById('runList');
    document.getElementById('runCount').textContent = myRuns().length;
    if (!runs.length) {
      host.innerHTML = A.empty('inbox', 'Không có checklist nào', filter === 'open' ? 'Toàn bộ checklist được giao đã gửi. Chuyển bộ lọc “Tất cả” để xem lại.' : 'Cán bộ an toàn chưa giao checklist nào cho tài khoản của bạn.');
      return;
    }
    host.innerHTML = runs.map(function (r) {
      var tpl = store.template(r.templateId);
      var total = tpl ? tpl.items.length : 0;
      var done = answered(r);
      var bad = Object.keys(r.results || {}).filter(function (k) { return r.results[k].result === 'Không đạt'; }).length;
      var on = current && current.id === r.id;
      return '<button type="button" class="ss-tile w-100 text-start mb-2' + (on ? ' is-active' : '') + '" data-run="' + r.id + '"' +
        (on ? ' style="border-color:var(--ss-teal-500);box-shadow:0 0 0 3px var(--ss-teal-100)"' : '') + '>' +
        '<div class="d-flex justify-content-between align-items-start gap-2">' +
        '<div><div class="ss-row-code">' + A.esc(r.code) + '</div><div class="ss-row-title small">' + A.esc(tpl ? tpl.name : 'Mẫu không xác định') + '</div></div>' +
        A.statusBadge(r.status) + '</div>' +
        '<div class="ss-row-meta mt-1"><i class="bi bi-geo-alt me-1"></i>' + A.esc(store.zoneName(r.zoneId)) + ' · ' + A.date(r.date) + '</div>' +
        '<div class="progress mt-2" style="height:6px"><div class="progress-bar" style="width:' + (total ? Math.round(done / total * 100) : 0) + '%"></div></div>' +
        '<div class="d-flex justify-content-between ss-row-meta mt-1"><span>' + done + '/' + total + ' mục</span>' +
        (bad ? '<span class="text-danger fw-semibold"><i class="bi bi-exclamation-octagon me-1"></i>' + bad + ' không đạt</span>' : '<span class="text-success">' + (done && !bad ? 'không có mục bất thường' : '') + '</span>') +
        '</div></button>';
    }).join('');
  }

  function selectRun(id) {
    current = store.find('runs', id);
    var host = document.getElementById('detail');
    host.innerHTML = '<div class="card"><div class="card-body">' + A.skeleton(4) + '</div></div>';
    setTimeout(renderDetail, 260);
    renderList();
  }

  function renderDetail() {
    var host = document.getElementById('detail');
    if (!current) {
      host.innerHTML = '<div class="card"><div class="card-body">' +
        A.empty('hand-index-thumb', 'Chưa chọn checklist nào', 'Bấm vào một thẻ ở cột bên trái để mở danh sách kiểm tra.') + '</div></div>';
      return;
    }
    var tpl = store.template(current.templateId);
    if (!tpl) {
      host.innerHTML = '<div class="card"><div class="card-body">' +
        A.empty('exclamation-triangle', 'Mẫu checklist không tồn tại', 'Mẫu ' + current.templateId + ' đã bị xoá khỏi cấu hình. Hãy báo quản trị viên tạo lại đợt kiểm tra.') + '</div></div>';
      return;
    }
    var locked = !isOpen(current);
    var items = tpl.items;
    var done = items.filter(function (i) { return (current.results || {})[i.id] && current.results[i.id].result; }).length;
    var bad = items.filter(function (i) { return ((current.results || {})[i.id] || {}).result === 'Không đạt'; }).length;
    var pct = Math.round(done / items.length * 100);

    host.innerHTML =
      '<div class="card mb-3"><div class="card-body">' +
      '<div class="d-flex flex-wrap justify-content-between gap-2 align-items-start">' +
      '<div><div class="ss-row-code">' + A.esc(current.code) + '</div>' +
      '<h2 class="h5 mb-1">' + A.esc(tpl.name) + '</h2>' +
      '<div class="ss-row-meta"><i class="bi bi-geo-alt me-1"></i>' + A.esc(store.zoneName(current.zoneId)) +
      ' · <i class="bi bi-calendar3 me-1"></i>' + A.date(current.date) + ' · người giao: ' + A.esc(tpl.updatedBy) + '</div></div>' +
      '<div class="text-end">' + A.statusBadge(current.status) +
      '<div class="ss-row-meta mt-1">' + done + '/' + items.length + ' mục đã đánh giá</div></div></div>' +
      '<div class="progress mt-3" style="height:10px" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Tiến độ hoàn thành checklist">' +
      '<div class="progress-bar" style="width:' + pct + '%"></div></div>' +
      (locked ? '<div class="alert mt-3 mb-0 py-2 small" style="background:#f0f1f3;border:1px solid #dcdfe4"><i class="bi bi-lock me-1"></i>Checklist đã gửi nên bị khóa chỉnh sửa. Trạng thái hiện tại: <strong>' + A.esc(current.status) + '</strong>.</div>' : '') +
      '</div></div>' +

      '<div class="card mb-3"><div class="card-header d-flex justify-content-between align-items-center">' +
      '<span><i class="bi bi-list-check me-1"></i>Nội dung kiểm tra</span>' +
      (bad ? '<span class="ss-badge ss-lv-Nghiêmtrọng"><i class="bi bi-exclamation-octagon me-1"></i>' + bad + ' mục không đạt</span>' : '<span class="ss-row-meta">Chọn kết quả cho từng mục</span>') +
      '</div><div class="card-body" id="items">' +
      items.map(function (it, idx) {
        var res = (current.results || {})[it.id] || {};
        var state = res.result === 'Không đạt' ? 'is-bad' : res.result === 'Đạt' ? 'is-ok' : '';
        return '<div class="ss-item ' + state + '" data-item="' + it.id + '">' +
          '<div class="d-flex gap-2 align-items-start">' +
          '<span class="ss-item-num">' + (idx + 1) + '</span>' +
          '<div class="flex-grow-1"><div class="fw-semibold">' + A.esc(it.text) + '</div>' +
          '<div class="ss-row-meta mb-2"><i class="bi bi-tag me-1"></i>' + A.esc(it.category) + '</div>' +
          '<div class="d-flex flex-wrap gap-2" role="radiogroup" aria-label="Kết quả mục ' + (idx + 1) + '">' +
          CHOICES.map(function (c) {
            return '<label class="ss-badge ' + c.cls + '" style="cursor:pointer;opacity:' + (res.result === c.v ? 1 : .55) + '">' +
              '<input class="form-check-input me-1" type="radio" name="res-' + it.id + '" value="' + c.v + '"' +
              (res.result === c.v ? ' checked' : '') + (locked ? ' disabled' : '') + '>' +
              '<i class="bi bi-' + c.icon + '"></i> ' + c.v + '</label>';
          }).join('') + '</div>' +
          '<input class="form-control form-control-sm mt-2" data-note="' + it.id + '" placeholder="Ghi chú / vị trí cụ thể (không bắt buộc)"' +
          ' value="' + A.esc(res.note || '') + '"' + (locked ? ' disabled' : '') + ' aria-label="Ghi chú cho mục ' + (idx + 1) + '">' +
          (res.result === 'Không đạt' && !locked ?
            '<div class="mt-2"><button type="button" class="btn btn-soft btn-sm" data-report="' + it.id + '">' +
            '<i class="bi bi-megaphone me-1"></i>Báo nguy cơ từ mục này</button></div>' : '') +
          '</div></div></div>';
      }).join('') +
      (current.notes ? '<div class="alert mt-3 py-2 small mb-0" style="background:var(--ss-teal-50);border:1px solid var(--ss-teal-100)"><strong>Ghi chú của đợt kiểm tra:</strong> ' + A.esc(current.notes) + '</div>' : '') +
      '</div></div>' +

      '<div class="card"><div class="card-body d-flex flex-wrap gap-2 align-items-center">' +
      (locked ? '' :
        '<button class="btn btn-primary" id="btnSend"><i class="bi bi-send me-1"></i>Gửi kết quả kiểm tra</button>' +
        '<button class="btn btn-ghost" id="btnSave"><i class="bi bi-save me-1"></i>Lưu và làm tiếp</button>') +
      '<input class="form-control" style="max-width:340px" id="runNotes" placeholder="Ghi chú chung cho cán bộ an toàn" value="' + A.esc(current.notes || '') + '"' + (locked ? ' disabled' : '') + '>' +
      '<span class="small text-muted-soft ms-auto" id="saveState"></span>' +
      '</div></div>';

    wireDetail();
  }

  function wireDetail() {
    var items = document.getElementById('items');
    if (!items) return;

    items.addEventListener('change', function (e) {
      if (e.target.matches('input[type=radio]')) {
        var box = e.target.closest('[data-item]');
        var id = box.getAttribute('data-item');
        saveResult(id, { result: e.target.value });
        box.classList.toggle('is-bad', e.target.value === 'Không đạt');
        box.classList.toggle('is-ok', e.target.value === 'Đạt');
        box.querySelectorAll('label.ss-badge').forEach(function (l) {
          l.style.opacity = l.querySelector('input').checked ? 1 : .55;
        });
        if (e.target.value === 'Không đạt' && !box.querySelector('[data-report]')) renderDetail();
        renderList();
        updateProgress();
      }
      if (e.target.matches('[data-note]')) {
        saveResult(e.target.getAttribute('data-note'), { note: e.target.value });
      }
    });

    items.addEventListener('input', function (e) {
      if (e.target.matches('[data-note]')) debouncedNote(e.target.getAttribute('data-note'), e.target.value);
    });

    items.addEventListener('click', function (e) {
      var b = e.target.closest('[data-report]');
      if (!b) return;
      prefillHazard(b.getAttribute('data-report'));
    });

    var notes = document.getElementById('runNotes');
    if (notes) notes.addEventListener('input', A.debounce(function () {
      store.update('runs', current.id, { notes: notes.value });
      current = store.find('runs', current.id);
      flash('Đã lưu ghi chú');
    }, 700));

    var save = document.getElementById('btnSave');
    if (save) save.addEventListener('click', function () {
      store.update('runs', current.id, { status: 'Đang thực hiện', notes: (document.getElementById('runNotes') || {}).value || current.notes });
      current = store.find('runs', current.id);
      renderList();
      A.toast('Đã lưu tiến độ, bạn có thể quay lại làm tiếp.', 'success', 'Đã lưu');
    });

    var send = document.getElementById('btnSend');
    if (send) send.addEventListener('click', sendResults);
  }

  function updateProgress() {
    var tpl = store.template(current.templateId);
    var items = tpl.items;
    var done = items.filter(function (i) { return ((current.results || {})[i.id] || {}).result; }).length;
    var bar = document.querySelector('.progress-bar');
    if (bar) bar.style.width = Math.round(done / items.length * 100) + '%';
  }

  var debouncedNote = A.debounce(function (id, value) { saveResult(id, { note: value }); }, 700);

  function saveResult(itemId, patch) {
    var db = store.read();
    var run = db.runs.filter(function (r) { return r.id === current.id; })[0];
    run.results = run.results || {};
    run.results[itemId] = Object.assign({}, run.results[itemId], patch);
    if (run.status === 'Bản nháp') run.status = 'Đang thực hiện';
    store.write(db);
    current = store.find('runs', current.id);
    flash('Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN'));
  }

  function flash(msg) {
    var el = document.getElementById('saveState');
    if (el) el.innerHTML = '<i class="bi bi-check2 me-1"></i>' + A.esc(msg);
  }

  function sendResults() {
    var tpl = store.template(current.templateId);
    var missing = tpl.items.filter(function (i) { return !((current.results || {})[i.id] || {}).result; });
    if (missing.length) {
      A.toast('Còn ' + missing.length + '/' + tpl.items.length + ' mục chưa có kết quả: “' + missing[0].text.slice(0, 40) + '…”', 'error', 'Chưa thể gửi');
      var box = document.querySelector('[data-item="' + missing[0].id + '"]');
      if (box) {
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        box.style.outline = '2px solid var(--ss-lv-nt)';
        setTimeout(function () { box.style.outline = ''; }, 2200);
      }
      return;
    }
    var bad = tpl.items.filter(function (i) { return current.results[i.id].result === 'Không đạt'; });
    A.confirm({
      title: 'Gửi kết quả kiểm tra?',
      body: 'Checklist ' + current.code + ' sẽ chuyển sang trạng thái “Đã gửi” và không chỉnh sửa được nữa.',
      detail: bad.length ? 'Có ' + bad.length + ' mục Không đạt – cán bộ an toàn sẽ nhận được cảnh báo kèm danh sách này.' : 'Tất cả mục đều đạt.',
      okText: 'Gửi ngay'
    }, function () {
      store.update('runs', current.id, { status: 'Đã gửi', notes: (document.getElementById('runNotes') || {}).value || current.notes });
      store.insert('notifications', {
        id: 'N-' + Date.now(), at: new Date().toISOString(), role: 'safety',
        kind: bad.length ? 'cảnh báo' : 'thông tin',
        text: 'Checklist ' + current.code + ' (' + store.zoneName(current.zoneId) + ') đã gửi' + (bad.length ? ' với ' + bad.length + ' mục Không đạt' : '')
      });
      current = store.find('runs', current.id);
      renderDetail();
      renderList();
      A.toast('Đã gửi kết quả tới cán bộ an toàn.', 'success', 'Thành công');
      if (bad.length) offerHazardFromBad(bad[0], bad.length);
    });
  }

  function offerHazardFromBad(item, count) {
    A.confirm({
      title: 'Báo nguy cơ cho mục không đạt?',
      body: 'Mục “' + item.text + '” được đánh giá Không đạt. Bạn có thể tạo ngay một báo cáo nguy cơ với nội dung điền sẵn.',
      detail: count > 1 ? 'Còn ' + (count - 1) + ' mục khác cũng không đạt; mỗi mục cần một báo cáo riêng nếu mức độ khác nhau.' : '',
      okText: 'Điền nội dung', cancelText: 'Để sau'
    }, function () { prefillHazard(item.id, true); });
  }

  function prefillHazard(itemId, afterSend) {
    var tpl = store.template(current.templateId);
    var item = tpl.items.filter(function (i) { return i.id === itemId; })[0];
    var res = (current.results || {})[itemId] || {};
    store.saveDraft('hazard-prefill', {
      title: item.text.slice(0, 88),
      description: 'Phát hiện khi thực hiện checklist ' + current.code + ' (' + store.zoneName(current.zoneId) + ', ngày ' + A.date(current.date) + '). ' +
        'Mục kiểm tra: “' + item.text + '” → Không đạt. ' + (res.note ? 'Ghi chú hiện trường: ' + res.note + '. ' : '') +
        'Mô tả thêm của người báo: ',
      zoneId: current.zoneId,
      workType: tpl.workType,
      level: 'Cao',
      source: 'Tạo từ checklist ' + current.code
    });
    if (afterSend) location.href = 'worker-hazard-create.html';
    else {
      A.confirm({
        title: 'Chuyển sang màn hình báo nguy cơ?',
        body: 'Nội dung mục Không đạt sẽ được điền sẵn; bạn chỉ cần bổ sung mô tả và ảnh minh chứng.',
        okText: 'Đi tới', cancelText: 'Ở lại'
      }, function () { location.href = 'worker-hazard-create.html'; });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('runFilter').addEventListener('click', function (e) {
      var b = e.target.closest('[data-filter]');
      if (!b) return;
      filter = b.getAttribute('data-filter');
      this.querySelectorAll('.nav-link').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      renderList();
    });

    document.getElementById('runList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-run]');
      if (b) selectRun(b.getAttribute('data-run'));
    });

    renderList();
    var next = myRuns().filter(isOpen)[0];
    if (next) selectRun(next.id);
    else renderDetail();
  });
})();
