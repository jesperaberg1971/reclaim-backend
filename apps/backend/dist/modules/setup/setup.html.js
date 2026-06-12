"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSetupHtml = buildSetupHtml;
function buildSetupHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — Thiết lập tài khoản</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --brand:#1a56db;--brand-lt:#eff6ff;--ok:#059669;--danger:#dc2626;
    --warn:#d97706;--bg:#f3f4f6;--card:#fff;--border:#e5e7eb;
    --text:#111827;--muted:#6b7280
  }
  body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;
       color:var(--text);background:var(--bg);min-height:100vh;
       display:flex;flex-direction:column;align-items:center;padding:32px 16px 64px}

  /* ── Progress bar ── */
  .progress{display:flex;gap:0;max-width:560px;width:100%;margin-bottom:32px}
  .step{flex:1;display:flex;flex-direction:column;align-items:center;position:relative}
  .step:not(:last-child)::after{content:'';position:absolute;top:14px;left:50%;
    width:100%;height:2px;background:var(--border);z-index:0}
  .step.done::after{background:var(--ok)}
  .step.active::after{background:var(--brand)}
  .step-dot{width:28px;height:28px;border-radius:50%;border:2px solid var(--border);
            background:var(--card);display:flex;align-items:center;justify-content:center;
            font-size:12px;font-weight:700;z-index:1;position:relative}
  .step.done .step-dot{background:var(--ok);border-color:var(--ok);color:#fff}
  .step.active .step-dot{background:var(--brand);border-color:var(--brand);color:#fff}
  .step-label{font-size:11px;color:var(--muted);margin-top:6px;text-align:center;font-weight:500}
  .step.active .step-label{color:var(--brand)}
  .step.done .step-label{color:var(--ok)}

  /* ── Card ── */
  .card{background:var(--card);border:1px solid var(--border);border-radius:12px;
        padding:32px;max-width:520px;width:100%}
  .card-tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
            color:var(--brand);margin-bottom:8px}
  .card-title{font-size:20px;font-weight:800;margin-bottom:6px}
  .card-sub{font-size:13px;color:var(--muted);margin-bottom:24px;line-height:1.6}

  /* ── Form ── */
  .field{margin-bottom:14px}
  .field label{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;
               color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px}
  .field label .tip{font-size:12px;color:var(--muted);cursor:help;
                    border-bottom:1px dotted currentColor;font-style:normal;
                    text-transform:none;letter-spacing:0;font-weight:400}
  .field input,.field select{width:100%;padding:9px 11px;border:1px solid var(--border);
    border-radius:6px;font-size:14px;font-family:inherit;transition:border-color .15s}
  .field input:focus,.field select:focus{outline:none;border-color:var(--brand);
    box-shadow:0 0 0 3px rgba(26,86,219,.1)}
  .field input.err{border-color:var(--danger)}
  .field-hint{font-size:11px;color:var(--muted);margin-top:4px}
  .field-err{font-size:11px;color:var(--danger);margin-top:4px;display:none}
  .field-err.show{display:block}

  /* ── Buttons ── */
  .btn{padding:10px 20px;border:none;border-radius:7px;font-size:14px;font-weight:600;
       cursor:pointer;transition:opacity .1s;font-family:inherit}
  .btn:hover{opacity:.88}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .btn-primary{background:var(--brand);color:#fff;width:100%;margin-top:8px}
  .btn-ok{background:var(--ok);color:#fff}
  .btn-ghost{background:#e5e7eb;color:var(--text)}
  .btn-row{display:flex;gap:8px;margin-top:16px}

  /* ── Success box ── */
  .success-box{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;
               padding:14px 16px;margin-bottom:20px;font-size:13px}
  .success-box .s-title{font-weight:700;color:#15803d;margin-bottom:4px}
  .success-box .kv{display:flex;gap:8px;margin-top:6px}
  .success-box .k{color:var(--muted);min-width:120px;font-size:12px}
  .success-box .v{font-weight:600;font-family:monospace;font-size:12px}

  /* ── Done card ── */
  .done-links{display:flex;flex-direction:column;gap:10px;margin-top:20px}
  .done-link{display:flex;align-items:center;gap:14px;padding:14px 16px;
             border:1px solid var(--border);border-radius:8px;text-decoration:none;color:var(--text)}
  .done-link:hover{background:var(--brand-lt);border-color:var(--brand)}
  .done-link .dl-icon{font-size:26px}
  .done-link .dl-title{font-weight:700;font-size:14px}
  .done-link .dl-sub{font-size:12px;color:var(--muted);margin-top:2px}
  .done-link .dl-arr{margin-left:auto;color:var(--brand);font-size:18px}

  /* ── Policy defaults table ── */
  .policy-table{width:100%;border-collapse:collapse;margin-top:16px;font-size:12px}
  .policy-table th{text-align:left;padding:6px 8px;background:#f9fafb;
                   border-bottom:1px solid var(--border);font-weight:600;color:var(--muted)}
  .policy-table td{padding:6px 8px;border-bottom:1px solid #f3f4f6}
  .policy-table tr:last-child td{border-bottom:none}

  /* ── Concept cards ── */
  .concept-section{margin-top:20px}
  .concept-section-label{font-size:11px;font-weight:700;text-transform:uppercase;
    letter-spacing:.5px;color:var(--muted);margin-bottom:10px}
  .concept-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .concept-box{border-radius:8px;padding:12px 14px;border:1px solid}
  .c-gate1{background:#dbeafe;border-color:#93c5fd}
  .c-gate2{background:#d1fae5;border-color:#6ee7b7}
  .c-gate3{background:#ede9fe;border-color:#c4b5fd}
  .c-trip{background:#fef3c7;border-color:#fcd34d;grid-column:1/-1}
  .concept-title{font-size:12px;font-weight:700;margin-bottom:4px}
  .concept-body{font-size:11px;line-height:1.6;color:#374151}

  /* ── Checklist (step 4) ── */
  .checklist{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
  .cl-item{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;
           border-radius:7px;border:1px solid var(--border);background:#fff}
  .cl-item.cl-done{background:#f0fdf4;border-color:#86efac}
  .cl-item.cl-next{background:#eff6ff;border-color:#93c5fd}
  .cl-check{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;
            justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px}
  .cl-check-done{background:var(--ok);color:#fff}
  .cl-check-next{background:var(--brand);color:#fff;animation:pulse .9s ease-in-out infinite}
  .cl-check-idle{background:var(--border);color:var(--muted)}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  .cl-label{font-size:13px;font-weight:600}
  .cl-sub{font-size:11px;color:var(--muted);margin-top:2px}

  /* ── Copy-to-clipboard ── */
  .copy-row{display:flex;align-items:center;gap:8px;background:#f3f4f6;
            border-radius:6px;padding:8px 10px;margin-top:8px;flex-wrap:wrap}
  .copy-url{font-size:12px;font-family:monospace;flex:1;word-break:break-all}
  .copy-btn{font-size:11px;font-weight:600;padding:4px 10px;border:1px solid var(--border);
            border-radius:5px;cursor:pointer;background:#fff;white-space:nowrap}
  .copy-btn:hover{background:var(--brand-lt);border-color:var(--brand);color:var(--brand)}
  .copy-ok{font-size:11px;color:var(--ok);display:none}

  /* ── Misc ── */
  .logo{font-size:22px;font-weight:800;color:var(--brand);margin-bottom:24px}
  .logo span{font-weight:300;color:var(--muted)}
  .spinner{display:inline-block;width:14px;height:14px;border:2px solid #bfdbfe;
           border-top-color:var(--brand);border-radius:50%;animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .err-msg{color:var(--danger);font-size:13px;margin-top:10px;padding:10px 12px;
           background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;display:none}
  .err-msg.show{display:block}
  details summary{cursor:pointer;color:var(--brand);font-size:12px;margin-top:16px}
  details[open] summary{margin-bottom:8px}
</style>
</head>
<body>

<div class="logo">Reclaim! <span>Setup</span></div>

<!-- Progress steps -->
<div class="progress" id="progress">
  <div class="step active" id="s1">
    <div class="step-dot">1</div>
    <div class="step-label">Đăng ký</div>
  </div>
  <div class="step" id="s2">
    <div class="step-dot">2</div>
    <div class="step-label">Đơn vị</div>
  </div>
  <div class="step" id="s3">
    <div class="step-dot">3</div>
    <div class="step-label">Nhân viên</div>
  </div>
  <div class="step" id="s4">
    <div class="step-dot">4</div>
    <div class="step-label">Hoàn tất</div>
  </div>
</div>

<!-- ── STEP 1: Register firm ────────────────────────────────────────────── -->
<div class="card" id="step-1">
  <div class="card-tag">Bước 1 / 4</div>
  <div class="card-title">Đăng ký công ty kế toán</div>
  <div class="card-sub">
    Tạo tài khoản <strong>đối tác kế toán</strong> (partner admin) cho công ty của bạn.
    Tài khoản này dùng để quản lý đơn vị khách hàng, duyệt biên lai và xuất dữ liệu kế toán.
  </div>

  <div class="field">
    <label>Tên công ty kế toán</label>
    <input id="p-name" placeholder="Ví dụ: Công ty TNHH Kế Toán ABC" autocomplete="organization">
    <div class="field-hint">Tên hiển thị trong hệ thống và trên các báo cáo xuất.</div>
    <div class="field-err" id="p-name-err"></div>
  </div>
  <div class="field">
    <label>Mã số thuế <abbr class="tip" title="Mã số thuế của công ty kế toán (10 hoặc 13 chữ số)">(?)</abbr></label>
    <input id="p-tax" placeholder="0123456789" maxlength="13" autocomplete="off">
    <div class="field-hint">10 chữ số (doanh nghiệp) hoặc 13 chữ số (chi nhánh).</div>
    <div class="field-err" id="p-tax-err"></div>
  </div>
  <div class="field">
    <label>Email quản trị viên</label>
    <input id="p-email" type="email" placeholder="admin@congtykitoanabc.vn" autocomplete="email">
    <div class="field-err" id="p-email-err"></div>
  </div>
  <div class="field">
    <label>Mật khẩu <abbr class="tip" title="Tối thiểu 8 ký tự">(?)</abbr></label>
    <input id="p-pass" type="password" placeholder="Tối thiểu 8 ký tự" autocomplete="new-password"
           onkeydown="if(event.key==='Enter')submitStep1()">
    <div class="field-err" id="p-pass-err"></div>
  </div>

  <details>
    <summary>Xem chính sách mặc định (có thể chỉnh sửa sau)</summary>
    <table class="policy-table">
      <thead><tr><th>Chính sách</th><th>Mặc định</th><th>Cơ sở</th></tr></thead>
      <tbody>
        <tr><td>Trần bữa ăn (Gate 1/2)</td><td>150.000 VND</td><td>Thông tư 11/2019</td></tr>
        <tr><td>Phụ cấp công tác/ngày (Gate 1)</td><td>300.000 VND</td><td>Thực tiễn phổ biến</td></tr>
        <tr><td>Phúc lợi tháng/nhân viên (Gate 2)</td><td>3.000.000 VND</td><td>Thực tiễn phổ biến</td></tr>
        <tr><td>Trần hoàn ứng thẻ cá nhân (Gate 3)</td><td>5.000.000 VND</td><td>Kiểm soát nội bộ</td></tr>
      </tbody>
    </table>
  </details>

  <!-- Key concepts -->
  <div class="concept-section">
    <div class="concept-section-label">⚙️ Cách Reclaim! phân loại chi phí</div>
    <div class="concept-grid">
      <div class="concept-box c-gate1">
        <div class="concept-title" style="color:#1d4ed8">Gate 1 — Công tác phí</div>
        <div class="concept-body">Biên lai phát sinh trong chuyến công tác đã được phê duyệt. Hệ thống tự động tra cứu <strong>Quyết định công tác</strong> theo ngày biên lai.</div>
      </div>
      <div class="concept-box c-gate2">
        <div class="concept-title" style="color:#065f46">Gate 2 — Phúc lợi</div>
        <div class="concept-body">Chi phí phúc lợi nhân viên hàng tháng (ăn uống, nghỉ dưỡng). Phần vượt hạn mức sẽ bị đánh dấu chịu thuế TNCN (PIT).</div>
      </div>
      <div class="concept-box c-gate3">
        <div class="concept-title" style="color:#5b21b6">Gate 3 — Hoàn ứng thẻ cá nhân</div>
        <div class="concept-body">Nhân viên dùng thẻ cá nhân thanh toán. Hệ thống sinh phiếu chi (<em>phiếu hoàn ứng</em>) tự động và liên kết số tài khoản.</div>
      </div>
      <div class="concept-box c-trip">
        <div class="concept-title" style="color:#92400e">📋 Quyết định công tác (Trip Decision)</div>
        <div class="concept-body">
          Văn bản phê duyệt chuyến công tác gồm ngày đi/về, địa điểm và mức phụ cấp/ngày.
          Cần tạo <strong>trước</strong> khi nhân viên nộp biên lai công tác — nếu không có, biên lai sẽ được xếp vào Gate 2 (phúc lợi) thay vì Gate 1.
          Bạn tạo Quyết định công tác từ giao diện kế toán sau khi hoàn tất thiết lập.
        </div>
      </div>
    </div>
  </div>

  <div id="p-err" class="err-msg"></div>
  <button class="btn btn-primary" id="p-btn" onclick="submitStep1()">Tạo tài khoản →</button>
</div>

<!-- ── STEP 2: Add client ────────────────────────────────────────────────── -->
<div class="card" id="step-2" style="display:none">
  <div class="card-tag">Bước 2 / 4</div>
  <div class="card-title">Thêm đơn vị khách hàng đầu tiên</div>
  <div class="card-sub">
    <strong>Đơn vị khách hàng</strong> là công ty mà nhân viên của họ nộp biên lai qua Reclaim!.
    Một công ty kế toán có thể quản lý nhiều đơn vị khách hàng.
  </div>

  <div id="step2-partner-info" class="success-box" style="margin-bottom:20px">
    <div class="s-title">✅ Tài khoản đối tác đã tạo thành công</div>
    <div class="kv"><span class="k">Công ty kế toán</span><span class="v" id="s2-firm">—</span></div>
    <div class="kv"><span class="k">Đăng nhập bằng</span><span class="v" id="s2-email">—</span></div>
  </div>

  <div class="field">
    <label>Tên đơn vị khách hàng</label>
    <input id="c-name" placeholder="Ví dụ: Công ty TNHH Sản Xuất XYZ"
           autocomplete="off" onkeydown="if(event.key==='Enter')submitStep2()">
    <div class="field-hint">Nhân viên sẽ thấy tên này khi nộp biên lai.</div>
    <div class="field-err" id="c-name-err"></div>
  </div>

  <details style="margin-top:16px">
    <summary>Tùy chọn: tạo tài khoản quản trị cho đơn vị này</summary>
    <div style="margin-top:12px;padding:12px 14px;background:#f9fafb;border:1px solid var(--border);border-radius:8px">
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.6">
        Tài khoản <strong>client_admin</strong> có thể duyệt yêu cầu của nhân viên trước khi kế toán xử lý.
        Để trống nếu chưa cần.
      </div>
      <div class="field">
        <label>Email quản trị đơn vị</label>
        <input id="ca-email" type="email" placeholder="admin@congtyxyz.vn" autocomplete="off">
      </div>
      <div class="field">
        <label>Mật khẩu quản trị đơn vị</label>
        <input id="ca-pass" type="password" placeholder="Tối thiểu 8 ký tự" autocomplete="new-password">
      </div>
    </div>
  </details>

  <div id="c-err" class="err-msg"></div>
  <div class="btn-row">
    <button class="btn btn-ghost" onclick="skipToStep3()">Bỏ qua bước này →</button>
    <button class="btn btn-primary" id="c-btn" onclick="submitStep2()" style="margin-top:0">Thêm đơn vị →</button>
  </div>
</div>

<!-- ── STEP 3: Add employee ──────────────────────────────────────────────── -->
<div class="card" id="step-3" style="display:none">
  <div class="card-tag">Bước 3 / 4</div>
  <div class="card-title">Thêm nhân viên đầu tiên</div>
  <div class="card-sub">
    Tạo tài khoản nhân viên để thử nộp biên lai. Nhân viên đăng nhập bằng email/mật khẩu này
    để tải ảnh biên lai lên qua trang hướng dẫn mobile.
  </div>

  <div id="step3-client-info" class="success-box" style="margin-bottom:20px">
    <div class="s-title">✅ Đơn vị đã thêm thành công</div>
    <div class="kv"><span class="k">Đơn vị</span><span class="v" id="s3-client">—</span></div>
    <div class="kv"><span class="k">Mã đơn vị</span><span class="v" id="s3-cid">—</span></div>
  </div>

  <div class="field">
    <label>Họ và tên nhân viên</label>
    <input id="e-name" placeholder="Ví dụ: Nguyễn Văn An" autocomplete="name">
    <div class="field-err" id="e-name-err"></div>
  </div>
  <div class="field">
    <label>Mã nhân viên nội bộ <abbr class="tip" title="Mã dùng trong hệ thống lương/HR, ví dụ NV001">(?)</abbr></label>
    <input id="e-code" placeholder="NV001" autocomplete="off">
    <div class="field-hint">Mã xuất hiện trên báo cáo kế toán và file ERP.</div>
    <div class="field-err" id="e-code-err"></div>
  </div>
  <div class="field">
    <label>Email đăng nhập nhân viên</label>
    <input id="e-email" type="email" placeholder="nhanvien@congtyxyz.vn" autocomplete="off">
    <div class="field-err" id="e-email-err"></div>
  </div>
  <div class="field">
    <label>Mật khẩu nhân viên <abbr class="tip" title="Tối thiểu 8 ký tự. Chia sẻ thông tin này với nhân viên.">(?)</abbr></label>
    <input id="e-pass" type="password" placeholder="Tối thiểu 8 ký tự" autocomplete="new-password">
    <div class="field-err" id="e-pass-err"></div>
  </div>

  <!-- Extra employee rows added by "Thêm nhân viên khác" -->
  <div id="extra-employees"></div>
  <button type="button" class="btn btn-ghost" style="font-size:12px;margin-top:4px;padding:6px 12px"
          onclick="addEmployeeRow()">+ Thêm nhân viên khác</button>

  <div id="e-err" class="err-msg"></div>
  <div id="e-bulk-results" style="display:none;margin-top:10px;font-size:12px"></div>
  <div class="btn-row">
    <button class="btn btn-ghost" onclick="showStep4()">Bỏ qua bước này →</button>
    <button class="btn btn-primary" id="e-btn" onclick="submitStep3()" style="margin-top:0">Thêm nhân viên →</button>
  </div>
</div>

<!-- ── STEP 4: Done ──────────────────────────────────────────────────────── -->
<div class="card" id="step-4" style="display:none">
  <div class="card-tag">Thiết lập hoàn tất 🎉</div>
  <div class="card-title">Reclaim! đã sẵn sàng</div>
  <div class="card-sub">
    Hệ thống đã được cấu hình. Làm theo checklist bên dưới để hoàn thành lần nộp biên lai đầu tiên.
  </div>

  <!-- Live onboarding checklist -->
  <div class="checklist" id="s4-checklist">
    <div class="cl-item cl-done">
      <div class="cl-check cl-check-done">✓</div>
      <div><div class="cl-label">Đăng ký công ty kế toán</div>
        <div class="cl-sub" id="s4-firm">—</div></div>
    </div>
    <div class="cl-item" id="cl-client">
      <div class="cl-check cl-check-idle" id="cl-client-chk">2</div>
      <div><div class="cl-label">Thêm đơn vị khách hàng</div>
        <div class="cl-sub" id="s4-client">—</div></div>
    </div>
    <div class="cl-item" id="cl-employee">
      <div class="cl-check cl-check-idle" id="cl-employee-chk">3</div>
      <div><div class="cl-label">Thêm nhân viên</div>
        <div class="cl-sub" id="s4-employee">—</div></div>
    </div>
    <div class="cl-item" id="cl-receipt">
      <div class="cl-check cl-check-idle" id="cl-receipt-chk">4</div>
      <div>
        <div class="cl-label">Nộp biên lai thử nghiệm đầu tiên</div>
        <div class="cl-sub" id="cl-receipt-sub">Đang chờ nhân viên tải biên lai lên…</div>
      </div>
    </div>
  </div>

  <!-- Employee credentials + shareable URL -->
  <div id="step4-emp-box" style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 16px;margin-bottom:16px;display:none">
    <div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:8px">👤 Thông tin đăng nhập nhân viên — chia sẻ với họ</div>
    <div class="kv"><span class="k">Họ tên</span><span class="v" id="s4-emp-name">—</span></div>
    <div class="kv"><span class="k">Email</span><span class="v" id="s4-emp-email">—</span></div>
    <div class="kv"><span class="k">Mật khẩu</span><span class="v" id="s4-emp-pass-hint" style="color:var(--muted);font-weight:400;font-style:italic">mật khẩu bạn vừa đặt ở Bước 3</span></div>
  </div>

  <div style="margin-bottom:16px">
    <div style="font-size:12px;font-weight:600;color:var(--muted);margin-bottom:4px">📱 Link trang nộp biên lai (gửi cho nhân viên):</div>
    <div class="copy-row">
      <span class="copy-url" id="s4-guide-url"></span>
      <button class="copy-btn" onclick="copyGuideUrl()">Sao chép</button>
      <span class="copy-ok" id="copy-ok">✓ Đã sao chép!</span>
    </div>
  </div>

  <div class="done-links">
    <a class="done-link" id="s4-guide-link" href="/api/mobile/guide" target="_blank">
      <span class="dl-icon">📱</span>
      <div>
        <div class="dl-title">Mở trang nộp biên lai</div>
        <div class="dl-sub">Đăng nhập bằng tài khoản nhân viên và tải ảnh biên lai lên</div>
      </div>
      <span class="dl-arr">→</span>
    </a>
    <a class="done-link" href="/api/admin/dashboard" target="_blank">
      <span class="dl-icon">🔍</span>
      <div>
        <div class="dl-title">Bảng duyệt biên lai (HITL Admin)</div>
        <div class="dl-sub">Xem và duyệt biên lai cần xem xét thủ công</div>
      </div>
      <span class="dl-arr">→</span>
    </a>
    <a class="done-link" href="/api/accounting/dashboard" target="_blank">
      <span class="dl-icon">📊</span>
      <div>
        <div class="dl-title">Bảng kế toán</div>
        <div class="dl-sub">Xem chi phí đã duyệt, lọc theo kỳ, xuất dữ liệu ERP/MISA</div>
      </div>
      <span class="dl-arr">→</span>
    </a>
    <a class="done-link" href="/api/policy/dashboard" target="_blank">
      <span class="dl-icon">⚙️</span>
      <div>
        <div class="dl-title">Chỉnh sửa chính sách</div>
        <div class="dl-sub">Điều chỉnh hạn mức phụ cấp, phúc lợi, hoàn ứng theo thực tế</div>
      </div>
      <span class="dl-arr">→</span>
    </a>
  </div>

  <!-- Invite link generator -->
  <div id="invite-section" style="margin-top:24px;padding:16px;background:#f9fafb;border:1px solid var(--border);border-radius:8px;display:none">
    <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">
      📨 Gửi link mời nhân viên tự đăng ký
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <input id="inv-email" type="email" placeholder="Email nhân viên" style="flex:1;min-width:200px;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px">
      <button class="btn btn-ghost" style="font-size:12px;padding:7px 14px" onclick="generateInvite()">Tạo link mời</button>
    </div>
    <div id="inv-result" style="margin-top:8px;display:none">
      <div class="copy-row">
        <span class="copy-url" id="inv-url" style="font-size:11px"></span>
        <button class="copy-btn" onclick="copyInviteUrl()">Sao chép</button>
        <span class="copy-ok" id="inv-copy-ok">✓</span>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">Link có hiệu lực trong 48 giờ. Nhân viên tự nhập tên, mã nhân viên và mật khẩu khi truy cập.</div>
    </div>
    <div id="inv-err" style="color:var(--danger);font-size:12px;margin-top:6px;display:none"></div>
  </div>
</div>

<script>
let token = null;
let partnerInfo = {};
let clientInfo  = {};
let employeeInfo = {};

// ── Step 1 ────────────────────────────────────────────────────────────────
async function submitStep1() {
  clearErrors('p');
  const name  = v('p-name');
  const tax   = v('p-tax');
  const email = v('p-email');
  const pass  = v('p-pass');

  let ok = true;
  if (!name)  { showErr('p-name-err', 'Vui lòng nhập tên công ty.'); ok=false; }
  if (!tax || !/^\d{10}(\d{3})?$/.test(tax)) {
    showErr('p-tax-err', 'Mã số thuế phải là 10 hoặc 13 chữ số.'); ok=false;
  }
  if (!email || !email.includes('@')) { showErr('p-email-err', 'Vui lòng nhập email hợp lệ.'); ok=false; }
  if (!pass || pass.length < 8)       { showErr('p-pass-err', 'Mật khẩu tối thiểu 8 ký tự.'); ok=false; }
  if (!ok) return;

  setBusy('p-btn', true);
  try {
    const res = await post('/api/setup/partner', {
      firm_name: name, tax_code: tax, admin_email: email, admin_password: pass,
    });
    token = res.accessToken;
    partnerInfo = { name, email, partner_id: res.partner_id };

    // Advance to step 2
    setStep(1, 'done');
    setStep(2, 'active');
    document.getElementById('s2-firm').textContent  = name;
    document.getElementById('s2-email').textContent = email;
    show('step-2'); hide('step-1');
    document.getElementById('c-name').focus();
  } catch(e) {
    showMsg('p-err', e.message);
  } finally { setBusy('p-btn', false); }
}

// ── Step 2 ────────────────────────────────────────────────────────────────
async function submitStep2() {
  clearErrors('c');
  const name    = v('c-name');
  const caEmail = v('ca-email');
  const caPass  = v('ca-pass');
  if (!name) { showErr('c-name-err', 'Vui lòng nhập tên đơn vị.'); return; }

  setBusy('c-btn', true);
  try {
    const res = await post('/api/setup/client', { name }, token);
    clientInfo = { id: res.id, name: res.name };

    // Optional: create client admin
    if (caEmail && caPass) {
      try {
        await post('/api/setup/client-admin', { client_id: res.id, email: caEmail, password: caPass }, token);
      } catch(e) {
        // Non-fatal — warn but continue
        showMsg('c-err', 'Đơn vị đã tạo nhưng tài khoản quản trị thất bại: ' + e.message);
      }
    }

    setStep(2, 'done');
    setStep(3, 'active');
    document.getElementById('s3-client').textContent = res.name;
    document.getElementById('s3-cid').textContent    = res.id;
    show('step-3'); hide('step-2');
    document.getElementById('e-name').focus();
  } catch(e) {
    showMsg('c-err', e.message);
  } finally { setBusy('c-btn', false); }
}

function skipToStep3() {
  setStep(2, 'done');
  setStep(3, 'active');
  document.getElementById('s3-client').textContent = '(bỏ qua)';
  document.getElementById('s3-cid').textContent    = '—';
  show('step-3'); hide('step-2');
}

// ── Step 3 ────────────────────────────────────────────────────────────────
let extraRowCount = 0;

function addEmployeeRow() {
  extraRowCount++;
  const i = extraRowCount;
  const wrap = document.createElement('div');
  wrap.id = 'extra-row-' + i;
  wrap.style.cssText = 'margin-top:12px;padding:12px 14px;background:#f9fafb;border:1px solid var(--border);border-radius:8px;position:relative';
  wrap.innerHTML =
    '<div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:8px">Nhân viên ' + (i+1) + '</div>' +
    '<button type="button" onclick="removeRow('+i+')" style="position:absolute;top:8px;right:10px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:14px">✕</button>' +
    '<div class="field"><label>Họ và tên</label><input id="xn'+i+'" placeholder="Nguyễn Văn B"></div>' +
    '<div class="field"><label>Mã nhân viên</label><input id="xc'+i+'" placeholder="NV002"></div>' +
    '<div class="field"><label>Email</label><input id="xe'+i+'" type="email" placeholder="nv2@congtyxyz.vn"></div>' +
    '<div class="field"><label>Mật khẩu</label><input id="xp'+i+'" type="password" placeholder="Tối thiểu 8 ký tự"></div>';
  document.getElementById('extra-employees').appendChild(wrap);
}

function removeRow(i) {
  const el = document.getElementById('extra-row-' + i);
  if (el) el.remove();
}

async function submitStep3() {
  clearErrors('e');
  const name  = v('e-name');
  const code  = v('e-code');
  const email = v('e-email');
  const pass  = v('e-pass');

  let ok = true;
  if (!name)   { showErr('e-name-err',  'Vui lòng nhập họ tên.'); ok=false; }
  if (!code)   { showErr('e-code-err',  'Vui lòng nhập mã nhân viên.'); ok=false; }
  if (!email || !email.includes('@')) { showErr('e-email-err', 'Vui lòng nhập email hợp lệ.'); ok=false; }
  if (!pass || pass.length < 8) { showErr('e-pass-err', 'Mật khẩu tối thiểu 8 ký tự.'); ok=false; }
  if (!clientInfo.id) {
    showMsg('e-err', 'Chưa có đơn vị khách hàng. Vui lòng quay lại Bước 2.'); ok=false;
  }
  if (!ok) return;

  // Collect all employee rows
  const employees = [{ client_id: clientInfo.id, full_name: name, employee_code: code, email, password: pass }];
  for (let i = 1; i <= extraRowCount; i++) {
    const xn = v('xn'+i), xc = v('xc'+i), xe = v('xe'+i), xp = v('xp'+i);
    if (xn || xc || xe || xp) {
      employees.push({ client_id: clientInfo.id, full_name: xn, employee_code: xc, email: xe, password: xp });
    }
  }

  setBusy('e-btn', true);
  const results = [];
  for (const emp of employees) {
    try {
      const res = await post('/api/setup/employee', emp, token);
      results.push({ ok: true, name: emp.full_name, id: res.employee_id });
    } catch(e) {
      results.push({ ok: false, name: emp.full_name, error: e.message });
    }
  }

  // Show per-employee results
  const bulkDiv = document.getElementById('e-bulk-results');
  bulkDiv.innerHTML = results.map(r =>
    r.ok
      ? '<div style="color:var(--ok)">✓ ' + r.name + '</div>'
      : '<div style="color:var(--danger)">✗ ' + r.name + ': ' + r.error + '</div>'
  ).join('');
  bulkDiv.style.display = '';

  const anySuccess = results.some(r => r.ok);
  if (anySuccess) {
    const first = results.find(r => r.ok);
    employeeInfo = { name: first.name, email, employee_id: first.id };
    setTimeout(showStep4, 1200);
  } else {
    showMsg('e-err', 'Tất cả nhân viên đều thất bại. Vui lòng kiểm tra thông tin.');
  }
  setBusy('e-btn', false);
}

let checklistHandle = null;

function showStep4() {
  setStep(3, 'done');
  setStep(4, 'active');

  // Firm is always done (we're logged in)
  document.getElementById('s4-firm').textContent = partnerInfo.name || '—';

  // Client
  if (clientInfo.name) {
    document.getElementById('s4-client').textContent = clientInfo.name;
    markClDone('cl-client', clientInfo.name);
  } else {
    document.getElementById('s4-client').textContent = '(bỏ qua)';
    markClNext('cl-client');
  }

  // Employee
  if (employeeInfo.name) {
    document.getElementById('s4-employee').textContent = employeeInfo.name;
    markClDone('cl-employee', employeeInfo.name);
    // Show credentials box
    document.getElementById('s4-emp-name').textContent  = employeeInfo.name;
    document.getElementById('s4-emp-email').textContent = employeeInfo.email || '—';
    document.getElementById('step4-emp-box').style.display = '';
    markClNext('cl-receipt'); // receipt is next
  } else {
    document.getElementById('s4-employee').textContent = '(bỏ qua)';
    markClNext('cl-employee');
  }

  const guideUrl = window.location.origin + '/api/mobile/guide';
  document.getElementById('s4-guide-url').textContent = guideUrl;
  document.getElementById('s4-guide-link').href        = guideUrl;

  if (token && clientInfo.id) {
    document.getElementById('invite-section').style.display = '';
  }

  show('step-4'); hide('step-3');

  // Start polling the checklist to detect first receipt
  if (token) {
    pollChecklist();
    checklistHandle = setInterval(pollChecklist, 5000);
  }
}

async function pollChecklist() {
  try {
    const cl = await get('/api/setup/checklist');
    if (cl.receipt_count > 0) {
      markClDone('cl-receipt', 'Biên lai đầu tiên đã nhận — kiểm tra bảng duyệt →');
      clearInterval(checklistHandle); checklistHandle = null;
    }
    // Also update client/employee from server in case they were skipped locally
    if (cl.client_count > 0 && !clientInfo.name) {
      const firstName = cl.clients?.[0]?.name || 'đã thêm';
      markClDone('cl-client', firstName);
    }
    if (cl.employee_count > 0 && !employeeInfo.name) {
      markClDone('cl-employee', cl.employee_count + ' nhân viên');
    }
  } catch {}
}

function markClDone(id, subtitle) {
  const el  = document.getElementById(id);
  const chk = document.getElementById(id + '-chk');
  if (!el || !chk) return;
  el.className = 'cl-item cl-done';
  chk.className = 'cl-check cl-check-done';
  chk.textContent = '✓';
  const sub = id === 'cl-client'   ? document.getElementById('s4-client')   :
              id === 'cl-employee' ? document.getElementById('s4-employee') :
              id === 'cl-receipt'  ? document.getElementById('cl-receipt-sub') : null;
  if (sub && subtitle) sub.textContent = subtitle;
}

function markClNext(id) {
  const el  = document.getElementById(id);
  const chk = document.getElementById(id + '-chk');
  if (!el || !chk) return;
  el.className = 'cl-item cl-next';
  chk.className = 'cl-check cl-check-next';
}

async function generateInvite() {
  const email = v('inv-email');
  const errEl = document.getElementById('inv-err');
  const resEl = document.getElementById('inv-result');
  errEl.style.display = 'none';
  resEl.style.display = 'none';
  if (!email || !email.includes('@')) { errEl.textContent = 'Vui lòng nhập email hợp lệ.'; errEl.style.display=''; return; }
  if (!clientInfo.id) { errEl.textContent = 'Chưa chọn đơn vị. Hoàn tất Bước 2 trước.'; errEl.style.display=''; return; }
  try {
    const res = await post('/api/setup/invite', { email, role: 'employee', client_id: clientInfo.id }, token);
    const fullUrl = window.location.origin + res.invite_url;
    document.getElementById('inv-url').textContent = fullUrl;
    resEl.style.display = '';
  } catch(e) {
    errEl.textContent = e.message;
    errEl.style.display = '';
  }
}

function copyInviteUrl() {
  const url = document.getElementById('inv-url').textContent;
  navigator.clipboard.writeText(url).then(() => {
    const ok = document.getElementById('inv-copy-ok');
    ok.style.display = '';
    setTimeout(() => { ok.style.display = 'none'; }, 2500);
  }).catch(() => {});
}

function copyGuideUrl() {
  const url = document.getElementById('s4-guide-url').textContent;
  navigator.clipboard.writeText(url).then(() => {
    const ok = document.getElementById('copy-ok');
    ok.style.display = '';
    setTimeout(() => { ok.style.display = 'none'; }, 2500);
  }).catch(() => {});
}

async function get(url) {
  const r = await fetch(url, {
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'HTTP ' + r.status);
  return d;
}

// ── Utils ─────────────────────────────────────────────────────────────────
async function post(url, body, authToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
  const r = await fetch(url, { method:'POST', headers, body: JSON.stringify(body) });
  const d = await r.json();
  if (!r.ok) {
    const msg = d.message || ('HTTP ' + r.status);
    throw new Error(Array.isArray(msg) ? msg.join('; ') : msg);
  }
  return d;
}

function v(id)    { return document.getElementById(id)?.value?.trim() || ''; }
function show(id) { document.getElementById(id).style.display = ''; }
function hide(id) { document.getElementById(id).style.display = 'none'; }

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  el.previousElementSibling?.previousElementSibling?.classList?.add('err');
}

function showMsg(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}

function clearErrors(prefix) {
  document.querySelectorAll('[id^="'+prefix+'-"][id$="-err"]').forEach(e => {
    e.classList.remove('show');
  });
  const msgEl = document.getElementById(prefix + '-err');
  if (msgEl) msgEl.classList.remove('show');
  document.querySelectorAll('.field input.err').forEach(e => e.classList.remove('err'));
}

function setBusy(btnId, busy) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = busy;
  if (busy) { btn._orig = btn.innerHTML; btn.innerHTML = '<span class="spinner"></span> Đang xử lý…'; }
  else        btn.innerHTML = btn._orig || btn.innerHTML;
}

function setStep(n, state) {
  const el = document.getElementById('s'+n);
  if (!el) return;
  el.classList.remove('active','done');
  if (state) el.classList.add(state);
}
</script>
</body>
</html>`;
}
//# sourceMappingURL=setup.html.js.map