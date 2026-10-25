/* Ba trải nghiệm AI mô phỏng của SiteSafe.

   QUAN TRỌNG: toàn bộ là bộ luật (rule-based) viết bằng JavaScript trên dữ liệu
   JSON mẫu, KHÔNG phải mô hình AI thật và KHÔNG gọi API trí tuệ nhân tạo nào.
   Kết quả chỉ dùng để tham khảo; người dùng có quyền sửa/chấp nhận/từ chối. */
(function (global) {
  'use strict';

  var DISCLAIMER = 'Đề xuất tạo bởi bộ luật JavaScript trên dữ liệu mẫu — không phải kết quả từ mô hình AI hay API thật.';

  /* ============ AI-01: Hazard Classifier ============ */
  var CAT_RULES = [
    {
      category: 'Ngã trên cao', weight: 3,
      keys: ['lan can', 'gối chắn', 'mép sàn', 'không có lan can', 'dây an toàn', 'điểm neo', 'sàn thao tác', 'giáo', 'hố', 'thang máy', 'chống rơi', 'ngã'],
      levelUp: ['trên cao', '> 2 m', 'core +', 'cốt +', 'không cài', 'thiếu lan can', 'không nắp'], base: 'Cao'
    },
    {
      category: 'Cấu trúc tạm & giàn giáo', weight: 3,
      keys: ['giàn giáo', 'giằng', 'chân giáo', 'cốp pha', 'kê', 'lún', 'đế giáo', 'liên kết', 'sụp đổ', 'đổ sập'],
      levelUp: ['lún', 'thiếu giằng', 'gạch vụn', 'đang tăng tải', 'rung'], base: 'Cao'
    },
    {
      category: 'Vật rơi / va đập', weight: 3,
      keys: ['rơi', 'buộc', 'va đập', 'nắp', 'vật liệu rơi', 'rơi tự do', 'dưới tải', 'trúng người'],
      levelUp: ['xuống', 'đang có người', 'suýt', 'trúng'], base: 'Cao'
    },
    {
      category: 'Điện & thiết bị điện', weight: 3,
      keys: ['điện', 'cáp', 'tủ điện', 'aptomat', '380', 'nguồn điện', 'đoàn mạch', 'chập', 'elcb', 'tiếp đất'],
      levelUp: ['380', 'nước', 'mở cửa', 'ngấm', 'lộ thiên', 'người qua lại'], base: 'Cao'
    },
    {
      category: 'Máy móc & vận thăng', weight: 3,
      keys: ['cần cẩu', 'cẩu', 'móc cẩu', 'vận thăng', 'cáp cẩu', 'máy hàn', 'máy cắt', 'thiết bị nâng', 'chốt'],
      levelUp: ['gãy', 'tuột', 'quá tải', 'không kiểm định', 'chốt hãm'], base: 'Cao'
    },
    {
      category: 'Hóa chất & vật liệu dễ cháy', weight: 3,
      keys: ['hóa chất', 'sơn', 'dung môi', 'xăng', 'dầu', 'msds', 'tràn', 'dung dịch', 'chất dễ cháy'],
      levelUp: ['gần nguồn nhiệt', 'mở nắp', 'hàn', 'thông thoáng', 'kín'], base: 'Nghiêm trọng'
    },
    {
      category: 'Cháy nổ & PCCC', weight: 3,
      keys: ['cháy', 'chữa cháy', 'pccc', 'bình co2', 'thoát hiểm', 'lối thoát', 'nổ'],
      levelUp: ['bị chặn', 'hết hạn', 'không có bình', 'lối thoát'], base: 'Cao'
    },
    {
      category: 'Bụi & tiếng ồn', weight: 2,
      keys: ['bụi', 'xi măng', 'tiếng ồn', 'db', 'mài', 'cắt', 'khẩu trang', 'chụp chống ồn'],
      levelUp: ['liên tục', 'không đeo'], base: 'Trung bình'
    },
    {
      category: 'Giao thông nội bộ', weight: 2,
      keys: ['xe', 'lối đi', 'cổng', 'chạy nhanh', 'đường nội bộ', 'cán', 'ngã tư', 'lùi'],
      levelUp: ['đi bộ', 'nhiều người', '25 km'], base: 'Cao'
    },
    {
      category: 'Tư thế & mang vác', weight: 2,
      keys: ['khiêng', 'mang vác', 'tư thế', 'cột sống', 'nặng', 'xe đẩy'],
      levelUp: [], base: 'Thấp'
    },
    {
      category: 'Thời tiết & môi trường', weight: 2,
      keys: ['mưa', 'nắng', 'gió', 'sét', 'bão', 'tránh nóng', 'nhiệt độ', 'ca trưa'],
      levelUp: ['gió vượt', 'dông', 'sét'], base: 'Trung bình'
    },
    {
      category: 'Môi trường làm việc', weight: 1,
      keys: ['chiếu sáng', 'thiếu đèn', 'tối', 'nhà vệ sinh', 'nước uống', 'thông gió'],
      levelUp: ['ban đêm'], base: 'Trung bình'
    }
  ];

  var CRITICAL_KEYS = ['nghiêm trọng', 'sụp đổ', 'đổ sập', 'cháy nổ', 'suýt trúng', 'trúng người', 'chết', 'tai nạn', 'nhiều người', 'đang làm việc'];
  var LOW_KEYS = ['vệ sinh', 'nhắc nhở', 'nghiêm túc', 'quản lý nội vụ', 'sạch sẽ', 'nước uống'];

  function norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
  }

  function hits(text, keys) {
    var found = [];
    keys.forEach(function (k) {
      var nk = norm(k);
      if (nk && text.indexOf(nk) !== -1) found.push(k);
    });
    return found;
  }

  function classify(input) {
    input = input || {};
    var raw = (input.title || '') + ' ' + (input.description || '');
    var text = norm(raw);
    var words = text.split(' ').length;

    var scored = CAT_RULES.map(function (rule) {
      var hitKeys = hits(text, rule.keys);
      var hitUp = hits(text, rule.levelUp);
      var score = hitKeys.length * rule.weight + hitUp.length * 1.5;
      return { category: rule.category, score: score, keys: hitKeys, up: hitUp, base: rule.base, rule: rule };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; });

    var reasons = [];
    var alternatives = [];
    var category = null, confidence = 0;

    if (!scored.length) {
      category = 'Chưa xác định';
      confidence = 0.2;
      reasons.push('Mô tả chưa có từ khóa đặc trưng. Hãy ghi rõ "nguy cơ gì – ở đâu – khi nào" để bộ luật phân loại tốt hơn.');
    } else {
      var top = scored[0];
      var totalScore = scored.reduce(function (s, r) { return s + r.score; }, 0);
      category = top.category;
      confidence = Math.min(0.95, 0.42 + (top.score / (totalScore + top.score)) * 0.45 + Math.min(words, 40) / 140);
      reasons.push('Từ khóa nhận diện: ' + top.keys.slice(0, 5).map(function (k) { return '“' + k + '”'; }).join(', ') + '.');
      if (top.up.length) reasons.push('Yếu tố làm nặng thêm: ' + top.up.map(function (k) { return '“' + k + '”'; }).join(', ') + '.');
      alternatives = scored.slice(1, 3).map(function (r) {
        return { category: r.category, confidence: +(r.score / (totalScore || 1)).toFixed(2), keys: r.keys.slice(0, 3) };
      });
      if (alternatives.length) {
        reasons.push('Nhóm thứ yếu có thể xem xét: ' + alternatives.map(function (a) { return a.category + ' (' + Math.round(a.confidence * 100) + '%)'; }).join(', ') + '.');
      }
    }

    /* mức độ: nền theo nhóm nguy cơ, hiệu chỉnh theo từ khóa và bối cảnh khu vực */
    var levels = ['Thấp', 'Trung bình', 'Cao', 'Nghiêm trọng'];
    var idx = levels.indexOf(scored.length ? scored[0].base : 'Trung bình');
    if (idx < 0) idx = 2;
    var crit = hits(text, CRITICAL_KEYS);
    var low = hits(text, LOW_KEYS);
    if (crit.length) idx = Math.min(3, idx + 1);
    if (low.length && !crit.length) idx = Math.max(0, idx - 1);
    if (words > 260) idx = Math.min(3, idx + 1);

    var zoneContext = null;
    if (input.zoneId && global.SiteSafeStore) {
      zoneContext = global.SiteSafeStore.zoneRisk(input.zoneId);
      if (zoneContext.open >= 4) { idx = Math.min(3, idx + 1); reasons.push('Khu vực này đang có ' + zoneContext.open + ' nguy cơ mở → cộng dồn rủi ro.'); }
      if (zoneContext.overdue > 0) reasons.push('Có ' + zoneContext.overdue + ' hành động khắc phục quá hạn chưa đóng.');
    }

    var level = levels[idx];
    /* mức ưu tiên */
    var priority = level === 'Nghiêm trọng' ? 'Khẩn cấp' : level === 'Cao' ? 'Cao' : level === 'Trung bình' ? 'Vừa' : 'Thấp';
    if (zoneContext && zoneContext.overdue > 0 && priority === 'Vừa') priority = 'Cao';
    if (/đang|ngay lúc này|chưa dừng/.test(text) && level === 'Nghiêm trọng') priority = 'Khẩn cấp';

    var needHuman = confidence < 0.62 || category === 'Chưa xác định';
    if (needHuman) reasons.push('Độ tin cậy thấp — cán bộ an toàn nên tự đánh giá, không dựa vào đề xuất này.');

    var measures = {
      'Ngã trên cao': ['Lắp lan can tạm + gối chắn, hoặc căng dây cứu sinh cho khu vực chưa che chắn', 'Dừng việc tại mép sàn chưa che chắn', 'Nhắc lại quy định treo dây an toàn đầu ca'],
      'Cấu trúc tạm & giàn giáo': ['Cấm chất tải vùng giáo chưa ổn định', 'Thay đế, bổ sung giằng chéo và nghiệm thu lại'],
      'Vật rơi / va đập': ['Quây bán kính rơi vật', 'Buộc/thùng chứa kín khi nâng', 'Bố trí người cảnh giới'],
      'Điện & thiết bị điện': ['Cô lập nguồn, treo biển cấm đóng điện', 'Máng treo cáp, kiểm tra tiếp đất và chống rò'],
      'Máy móc & vận thăng': ['Dừng thiết bị khỏi niêm yết vận hành', 'Kiểm định, thay phụ tùng đúng chủng loại'],
      'Hóa chất & vật liệu dễ cháy': ['Di dời khỏi nguồn nhiệt, thông gió', 'Niêm yết MSDS và chuẩn bị vật liệu hấp thụ'],
      'Cháy nổ & PCCC': ['Dọn lối thoát, bố trí bình chữa cháy đạt chuẩn', 'Kiểm tra hạn kiểm định và hướng dẫn sử dụng'],
      'Bụi & tiếng ồn': ['Chụp hút/cách âm', 'Cấp khẩu trang bụi mịn và chụp chống ồn'],
      'Giao thông nội bộ': ['Giới hạn tốc độ + người chỉ huy tại cổng', 'Tách làn người đi bộ, biển báo phản quang'],
      'Tư thế & mang vác': ['Thêm xe đẩy/bán kính quay', 'Hướng dẫn khiêng 2 người, đổi tải'],
      'Thời tiết & môi trường': ['Gián đoạn việc khi gió/mưa vượt ngưỡng', 'Bố trí điểm tránh nóng và nước uống'],
      'Môi trường làm việc': ['Bổ sung chiếu sáng tại chỗ thiếu', 'Đo lại độ sáng trước khi cho làm ca đêm'],
      'Chưa xác định': ['Ghi nhận hiện trường và chụp ảnh trước khi phân loại']
    };

    return {
      engine: 'Hazard Classifier (mô phỏng bằng bộ luật JavaScript)',
      disclaimer: DISCLAIMER,
      category: category,
      level: level,
      priority: priority,
      confidence: +confidence.toFixed(2),
      reasons: reasons,
      alternatives: alternatives,
      suggestedActions: measures[category] || measures['Chưa xác định'],
      needHumanReview: needHuman,
      zoneContext: zoneContext
    };
  }

  /* ============ AI-02: Checklist Generator ============ */
  var CHECK_LIBRARY = {
    'Giàn giáo / cốp pha': [
      ['Nền đặt giáo đặc chắc, có đế và không kê vật vụn', 'Cấu trúc tạm'],
      ['Giằng chéo, liên kết đầy đủ theo thiết kế', 'Cấu trúc tạm'],
      ['Sàn thao tác lót kín, chống trượt, lan can + gối chắn', 'Ngã trên cao'],
      ['Điểm neo dây an toàn được lắp và thử trước khi sử dụng', 'Ngã trên cao'],
      ['Biển báo tải trọng và cấm tự ý thay đổi kết cấu', 'Cấu trúc tạm']
    ],
    'Điện thi công': [
      ['Tủ điện khóa, tiếp đất, chống dòng rò còn hoạt động', 'Điện & thiết bị điện'],
      ['Cáp treo cao hoặc đi trong máng, tránh làn xe', 'Điện & thiết bị điện'],
      ['Thiết bị đóng cắt có nhãn, không nối chắp vá', 'Điện & thiết bị điện'],
      ['Chiếu sáng khu vực làm việc đủ mức tối thiểu', 'Môi trường làm việc']
    ],
    'Cẩu / nâng hạ': [
      ['Kiểm định còn hiệu lực, hồ sơ kỹ thuật trên cab', 'Máy móc & vận thăng'],
      ['Chốt an toàn móc, dây cài không biến dạng', 'Máy móc & vận thăng'],
      ['Quây vùng bán kính nâng, bố trí cảnh giới', 'Vật rơi / va đập'],
      ['Đo tốc độ gió, dừng cẩu khi vượt ngưỡng', 'Thời tiết & môi trường']
    ],
    'Kho & vật liệu': [
      ['MSDS dán tại kệ, phân loại chất dễ cháy', 'Hóa chất & vật liệu dễ cháy'],
      ['Lối thoát và bình chữa cháy không bị che chắn', 'Cháy nổ & PCCC'],
      ['Kệ ổn định, vật nặng để dưới, có máng chống tràn', 'Hóa chất & vật liệu dễ cháy']
    ],
    'Kiểm tra chung': [
      ['BHLĐ đầy đủ: mũ, giày, phản quang, dây an toàn', 'Bảo hộ cá nhân'],
      ['Họp đầu ca 5 phút nêu nguy cơ chính của ngày', 'Quản lý an toàn'],
      ['Lối đi, mép sàn gọn gàng và che chắn', 'Ngã trên cao'],
      ['Theo dõi dự báo thời tiết trong ca', 'Thời tiết & môi trường']
    ],
    'Thi công thân': [
      ['Mép sàn tầng đang thi công có lan can tạm', 'Ngã trên cao'],
      ['Vật tư không tập trung quá tải gần mép sàn', 'Vật rơi / va đập'],
      ['Giàn giáo thao tác được nghiệm thu theo tầng', 'Cấu trúc tạm']
    ],
    'Hầm/móng': [
      ['Hố, vách đào có chống chắn và nắp đậy ban đêm', 'Ngã trên cao'],
      ['Thoát nước, thông gió và đo khí trước khi xuống', 'Hóa chất & vật liệu dễ cháy'],
      ['Chiếu sáng sự cố hoạt động tốt', 'Môi trường làm việc']
    ]
  };

  function generateChecklist(input) {
    input = input || {};
    var workType = input.workType || 'Kiểm tra chung';
    var bank = CHECK_LIBRARY[workType] || CHECK_LIBRARY['Kiểm tra chung'];
    var items = bank.map(function (row) { return { text: row[0], category: row[1] }; });

    var extras = [];
    var cond = (input.conditions || []).join(' ').toLowerCase();
    if (/mưa|nước|ngập|lún/.test(cond)) extras.push({ text: 'Rãnh thoát nước tạm hoạt động, không ngập đáy công tác', category: 'Thời tiết & môi trường' });
    if (/đêm|ban đêm|thiếu sáng/.test(cond)) extras.push({ text: 'Đèn chiếu sáng sự cố và đèn cá nhân cho tổ làm ca đêm', category: 'Môi trường làm việc' });
    if (/gió|bão|nắng gắt|nóng/.test(cond)) extras.push({ text: 'Có điểm trú ẩn và lịch giãn ca khi thời tiết cực đoan', category: 'Thời tiết & môi trường' });
    if (/hàn|cắt|nhiệt/.test(cond)) extras.push({ text: 'Giấy phép lửa cho hàn/cắt, bình chữa cháy và người canh lửa', category: 'Cháy nổ & PCCC' });
    if (/đông người|nhiều tổ|chồng lấn/.test(cond)) extras.push({ text: 'Phân vùng thi công theo tổ, tránh chồng lấn công việc', category: 'Quản lý an toàn' });

    var zoneRisk = null;
    if (input.zoneId && global.SiteSafeStore) {
      zoneRisk = global.SiteSafeStore.zoneRisk(input.zoneId);
      if (zoneRisk.open >= 3) {
        extras.push({ text: 'Kiểm tra lại các nguy cơ đang mở của khu vực trước khi cho làm việc', category: 'Quản lý an toàn' });
      }
    }
    var merged = items.concat(extras);
    var seen = {};
    merged = merged.filter(function (it) {
      var k = norm(it.text);
      if (seen[k]) return false;
      seen[k] = 1;
      return true;
    });

    return {
      engine: 'Checklist Generator (mô phỏng bằng bộ luật JavaScript)',
      disclaimer: DISCLAIMER,
      workType: workType,
      items: merged.map(function (it, i) { return { id: 'g' + (i + 1), text: it.text, category: it.category }; }),
      confidence: +(Math.min(0.9, 0.55 + merged.length * 0.03)).toFixed(2),
      reasons: [
        'Chọn ' + items.length + ' mục từ thư viện chuẩn cho loại công việc “' + workType + '”.',
        extras.length ? 'Bổ sung ' + extras.length + ' mục theo điều kiện công trường bạn nhập.' : 'Không có điều kiện đặc biệt nên chỉ dùng bộ mục chuẩn.',
        zoneRisk ? 'Khu vực đang có ' + zoneRisk.open + ' nguy cơ mở (điểm rủi ro ' + zoneRisk.score + ').' : 'Chưa gắn khu vực cụ thể.'
      ],
      needHumanReview: true
    };
  }

  /* ============ AI-03: Risk Hotspot Insight ============ */
  function hotspotInsight(opts) {
    opts = opts || {};
    var store = global.SiteSafeStore;
    var days = opts.days || 30;
    var from = Date.now() - days * 864e5;
    var hazards = store ? store.list('hazards').filter(function (h) { return new Date(h.createdAt).getTime() >= from; }) : (opts.hazards || []);
    var zonesList = store ? store.list('zones').filter(function (z) { return z.active; }) : (opts.zones || []);

    if (!hazards.length) {
      return {
        engine: 'Risk Hotspot Insight (mô phỏng bằng bộ luật JavaScript)',
        disclaimer: DISCLAIMER, status: 'no-data',
        message: 'Trong ' + days + ' ngày qua chưa có báo cáo nguy cơ nào nên chưa thể xếp hạng điểm nóng. Hãy chọn khoảng thời gian dài hơn hoặc tạo báo cáo mẫu.',
        hotspots: [], points: []
      };
    }

    var byZone = {};
    hazards.forEach(function (h) {
      byZone[h.zoneId] = byZone[h.zoneId] || { open: 0, total: 0, critical: 0, weight: 0, last: null, codes: [] };
      var b = byZone[h.zoneId];
      b.total++;
      if (store.isOpenHazard(h)) {
        b.open++;
        b.weight += store.LEVEL_WEIGHT[h.level] || 1;
        if (h.level === 'Nghiêm trọng') b.critical++;
        b.codes.push(h.code);
      }
      if (!b.last || new Date(h.createdAt) > new Date(b.last)) b.last = h.createdAt;
    });

    var ranked = Object.keys(byZone).map(function (zid) {
      var b = byZone[zid];
      var zone = store.zone(zid);
      var overdue = store.where('actions', function (a) { return a.zoneId === zid && store.isOverdue(a); }).length;
      var score = b.weight + b.critical * 3 + overdue * 2;
      return {
        zoneId: zid, name: zone ? zone.name : zid, score: score,
        open: b.open, critical: b.critical, overdue: overdue, codes: b.codes, last: b.last,
        band: store.riskBand(score)
      };
    }).sort(function (a, b) { return b.score - a.score; });

    var top = ranked[0];
    var totalOpen = ranked.reduce(function (s, r) { return s + r.open; }, 0);
    var share = totalOpen ? Math.round((top.open / totalOpen) * 100) : 0;
    var points = [];
    points.push('Điểm nóng lớn nhất là “' + top.name + '” với ' + top.open + '/' + totalOpen + ' nguy cơ đang mở (' + share + '%) và điểm rủi ro ' + top.score + '.');
    if (top.critical) points.push('Trong đó có ' + top.critical + ' nguy cơ mức Nghiêm trọng — nên ưu tiên kiểm tra trong 24 giờ tới.');
    if (top.overdue) points.push('Có ' + top.overdue + ' hành động khắc phục quá hạn tại khu vực này, cần đôn đốc người phụ trách.');
    if (ranked[1]) points.push('Xếp thứ hai là “' + ranked[1].name + '” (điểm ' + ranked[1].score + ', ' + ranked[1].open + ' nguy cơ mở).');
    var byCat = store.tally(hazards.filter(store.isOpenHazard), 'category');
    var topCat = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; })[0];
    if (topCat) points.push('Nhóm nguy cơ lặp lại nhiều nhất: ' + topCat + ' (' + byCat[topCat] + ' báo cáo).');

    return {
      engine: 'Risk Hotspot Insight (mô phỏng bằng bộ luật JavaScript)',
      disclaimer: DISCLAIMER,
      status: 'ok',
      days: days,
      hotspots: ranked.slice(0, 5),
      top: top,
      narrative: points,
      suggestions: buildSuggestions(top, byCat),
      confidence: +(Math.min(0.92, 0.5 + ranked.length * 0.06 + hazards.length * 0.01)).toFixed(2)
    };
  }

  function buildSuggestions(top, byCat) {
    var out = [];
    if (top) {
      out.push('Mở một đợt kiểm tra chuyên đề tại ' + top.name + ' trong 48 giờ tới.');
      if (top.overdue) out.push('Họp nhanh với người phụ trách ' + top.overdue + ' hành động quá hạn trước ca sáng.');
    }
    Object.keys(byCat || {}).slice(0, 2).forEach(function (c) {
      out.push('Đưa nhóm “' + c + '” vào nội dung họp đầu ca tuần này.');
    });
    out.push('Đối chiếu số liệu với danh sách nguy cơ bên dưới; đề xuất không thay thế đánh giá an toàn thực tế.');
    return out;
  }

  global.SiteSafeAI = {
    DISCLAIMER: DISCLAIMER,
    classify: classify,
    generateChecklist: generateChecklist,
    hotspot: hotspotInsight,
    CAT_RULES: CAT_RULES,
    CHECK_LIBRARY: CHECK_LIBRARY
  };
})(window);
