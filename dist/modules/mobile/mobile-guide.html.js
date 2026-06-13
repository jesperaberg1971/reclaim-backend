"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMobileGuideHtml = buildMobileGuideHtml;
function buildMobileGuideHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — Nộp biên lai</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --brand:#1a56db;--brand-lt:#eff6ff;--ok:#059669;--ok-lt:#f0fdf4;
    --danger:#dc2626;--warn:#d97706;--warn-lt:#fffbeb;
    --bg:#f3f4f6;--card:#fff;--border:#e5e7eb;--text:#111827;--muted:#6b7280
  }
  body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;
       color:var(--text);background:var(--bg);min-height:100vh;
       display:flex;flex-direction:column;align-items:center;padding:24px 16px 64px}

  /* ── Header ── */
  .hdr{display:flex;align-items:center;gap:10px;margin-bottom:28px;max-width:520px;width:100%}
  .logo{font-size:18px;font-weight:800;color:var(--brand)}
  .hdr-sub{font-size:13px;color:var(--muted)}
  .hdr-right{margin-left:auto}
  .user-chip{display:flex;align-items:center;gap:7px;background:var(--brand-lt);
             border-radius:20px;padding:4px 12px 4px 6px;font-size:12px;display:none}
  .user-chip .uc-avatar{width:24px;height:24px;border-radius:50%;background:var(--brand);
                        color:#fff;display:flex;align-items:center;justify-content:center;
                        font-weight:700;font-size:11px}

  /* ── Cards ── */
  .card{background:var(--card);border:1px solid var(--border);border-radius:12px;
        padding:28px;max-width:520px;width:100%;margin-bottom:16px}
  .card-title{font-size:16px;font-weight:700;margin-bottom:4px}
  .card-sub{font-size:13px;color:var(--muted);margin-bottom:20px;line-height:1.6}

  /* ── How it works ── */
  .steps-row{display:flex;gap:0;margin-bottom:4px}
  .hw-step{flex:1;padding:12px 10px;text-align:center;position:relative}
  .hw-step:not(:last-child)::after{content:'→';position:absolute;right:-8px;top:50%;
    transform:translateY(-50%);color:var(--muted);font-size:14px}
  .hw-icon{font-size:24px;margin-bottom:6px}
  .hw-label{font-size:11px;font-weight:600;color:var(--text)}
  .hw-hint{font-size:10px;color:var(--muted);margin-top:2px;line-height:1.4}

  /* ── Form ── */
  .field{margin-bottom:12px}
  .field label{display:block;font-size:11px;font-weight:600;color:var(--muted);
               text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px}
  .field input{width:100%;padding:9px 11px;border:1px solid var(--border);
               border-radius:6px;font-size:14px;font-family:inherit}
  .field input:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 3px rgba(26,86,219,.1)}
  .err-msg{color:var(--danger);font-size:12px;margin-top:8px;min-height:18px}
  .btn{padding:10px 20px;border:none;border-radius:7px;font-size:14px;font-weight:600;
       cursor:pointer;font-family:inherit;transition:opacity .1s}
  .btn:hover{opacity:.88}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .btn-primary{background:var(--brand);color:#fff;width:100%;margin-top:4px}
  .btn-ghost{background:#e5e7eb;color:var(--text);font-size:13px;padding:7px 14px}

  /* ── Drop zone ── */
  .drop-zone{border:2px dashed var(--border);border-radius:10px;padding:40px 20px;
             text-align:center;cursor:pointer;transition:all .2s;margin-bottom:16px}
  .drop-zone:hover,.drop-zone.over{border-color:var(--brand);background:var(--brand-lt)}
  .drop-zone .dz-icon{font-size:36px;margin-bottom:10px}
  .drop-zone .dz-title{font-weight:600;margin-bottom:4px}
  .drop-zone .dz-hint{font-size:12px;color:var(--muted)}
  .drop-zone input[type=file]{display:none}

  /* ── Preview thumbnail ── */
  .preview-wrap{margin-bottom:16px;display:none}
  .preview-img{max-width:100%;max-height:220px;border-radius:8px;border:1px solid var(--border);
               display:block;margin:0 auto}
  .preview-name{font-size:12px;color:var(--muted);text-align:center;margin-top:6px}
  .preview-change{font-size:12px;color:var(--brand);text-align:center;cursor:pointer;
                  margin-top:4px;text-decoration:underline}

  /* ── Status display ── */
  .status-card{display:none;padding:20px;border-radius:10px;margin-top:4px;border:1px solid}
  .status-wait{background:var(--brand-lt);border-color:#93c5fd}
  .status-review{background:var(--warn-lt);border-color:#fcd34d}
  .status-done{background:var(--ok-lt);border-color:#86efac}
  .status-error{background:#fef2f2;border-color:#fca5a5}

  .st-icon{font-size:28px;margin-bottom:8px}
  .st-title{font-weight:700;font-size:15px;margin-bottom:6px}
  .st-msg{font-size:13px;color:#374151;line-height:1.6;margin-bottom:10px}
  .st-action{font-size:13px;font-weight:600;padding:8px 12px;border-radius:6px;display:inline-block}
  .st-action-wait{background:#dbeafe;color:var(--brand)}
  .st-action-review{background:#fef3c7;color:#92400e}
  .st-action-done{background:#d1fae5;color:#065f46}
  .st-action-error{background:#fee2e2;color:#7f1d1d}

  .progress-ring{display:flex;align-items:center;gap:10px;margin-top:12px}
  .ring-dot{width:8px;height:8px;border-radius:50%;background:var(--border);flex-shrink:0}
  .ring-dot.done{background:var(--ok)}
  .ring-dot.active{background:var(--brand);animation:pulse .8s ease-in-out infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  .ring-label{font-size:11px;color:var(--muted)}

  .reason-list{margin-top:10px}
  .reason-item{background:#fff;border:1px solid var(--border);border-radius:6px;
               padding:10px 12px;margin-bottom:8px}
  .ri-title{font-weight:600;font-size:12px;margin-bottom:3px}
  .ri-detail{font-size:12px;color:var(--muted)}
  .ri-action{font-size:11px;color:var(--brand);font-weight:600;margin-top:4px}

  /* ── Ocr result ── */
  .ocr-box{background:#f9fafb;border:1px solid var(--border);border-radius:8px;
           padding:14px;margin-top:12px;display:none}
  .ocr-row{display:flex;gap:8px;font-size:13px;margin-bottom:6px}
  .ocr-row:last-child{margin-bottom:0}
  .ocr-k{color:var(--muted);min-width:100px;font-size:12px}
  .ocr-v{font-weight:600}
  .conf-bar{height:4px;background:#e5e7eb;border-radius:2px;margin-top:4px;width:100%}
  .conf-fill{height:100%;border-radius:2px;transition:width .3s}

  /* ── New receipt btn ── */
  .new-btn-wrap{margin-top:16px;text-align:center;display:none}

  /* ── Tips card ── */
  .tips-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
  .tip-item{display:flex;align-items:flex-start;gap:8px;font-size:12px;padding:8px 10px;
            background:#f9fafb;border:1px solid var(--border);border-radius:7px}
  .tip-icon{font-size:16px;flex-shrink:0;margin-top:1px}
  .tip-text{color:#374151;line-height:1.4}
  .tip-bad{background:#fef2f2;border-color:#fca5a5}
  .tip-bad .tip-text{color:#7f1d1d}

  /* ── Trip decision callout ── */
  .trip-callout{background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;
                padding:12px 14px;margin-bottom:14px;font-size:13px;line-height:1.6}
  .trip-callout strong{color:#92400e}
  .trip-callout summary{cursor:pointer;color:#92400e;font-weight:600;font-size:13px;list-style:none}
  .trip-callout summary::after{content:' ▸';font-size:11px}
  .trip-callout[open] summary::after{content:' ▾'}
  .trip-callout[open] .trip-body{margin-top:8px}
  .trip-body{color:#78350f;font-size:12px;line-height:1.6}

  /* ── Spinner ── */
  .spinner{display:inline-block;width:14px;height:14px;border:2px solid #bfdbfe;
           border-top-color:var(--brand);border-radius:50%;animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>

<div class="hdr" style="max-width:520px;width:100%">
  <div>
    <div class="logo">Reclaim!</div>
    <div class="hdr-sub">Nộp biên lai chi phí</div>
  </div>
  <div class="hdr-right">
    <div class="user-chip" id="user-chip">
      <div class="uc-avatar" id="uc-init"></div>
      <span id="uc-email"></span>
      <button class="btn-ghost" style="margin-left:4px;padding:2px 8px;font-size:11px"
              onclick="doLogout()">Đăng xuất</button>
    </div>
  </div>
</div>

<!-- How it works -->
<div class="card">
  <div class="card-title">Quy trình xử lý biên lai</div>
  <div class="card-sub">Sau khi tải lên, biên lai đi qua 3 bước tự động:</div>
  <div class="steps-row">
    <div class="hw-step">
      <div class="hw-icon">📷</div>
      <div class="hw-label">Tải lên</div>
      <div class="hw-hint">Ảnh JPEG, PNG, PDF — tối đa 20 MB</div>
    </div>
    <div class="hw-step">
      <div class="hw-icon">🔍</div>
      <div class="hw-label">OCR &amp; phân loại</div>
      <div class="hw-hint">Trích xuất vendor, số tiền, ngày — thường &lt; 10 giây</div>
    </div>
    <div class="hw-step">
      <div class="hw-icon">⚖️</div>
      <div class="hw-label">3-Gate routing</div>
      <div class="hw-hint">Phân loại: công tác phí / phúc lợi / hoàn ứng thẻ</div>
    </div>
    <div class="hw-step">
      <div class="hw-icon">✅</div>
      <div class="hw-label">Duyệt &amp; xuất</div>
      <div class="hw-hint">Xuất ERP (MISA/SAP) khi kế toán duyệt</div>
    </div>
  </div>

  <!-- Gate legend -->
  <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px;display:flex;flex-direction:column;gap:6px">
    <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:2px">Hệ thống sẽ tự động xếp biên lai vào một trong 3 loại:</div>
    <div style="display:flex;align-items:center;gap:8px;font-size:12px">
      <span style="background:#dbeafe;color:#1d4ed8;border-radius:4px;padding:2px 8px;font-weight:700;flex-shrink:0">G1</span>
      <span><strong>Công tác phí</strong> — biên lai trong chuyến công tác đã duyệt (cần Quyết định công tác)</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;font-size:12px">
      <span style="background:#d1fae5;color:#065f46;border-radius:4px;padding:2px 8px;font-weight:700;flex-shrink:0">G2</span>
      <span><strong>Phúc lợi</strong> — chi phí ăn uống, nghỉ dưỡng trong hạn mức hàng tháng</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;font-size:12px">
      <span style="background:#ede9fe;color:#5b21b6;border-radius:4px;padding:2px 8px;font-weight:700;flex-shrink:0">G3</span>
      <span><strong>Hoàn ứng</strong> — bạn dùng thẻ cá nhân, hệ thống tạo phiếu chi hoàn tiền</span>
    </div>
  </div>
</div>

<!-- LOGIN (hidden when logged in) -->
<div class="card" id="login-card">
  <div class="card-title">Đăng nhập</div>
  <div class="card-sub">Đăng nhập bằng tài khoản nhân viên để nộp biên lai.</div>

  <div class="field">
    <label>Email</label>
    <input id="l-email" type="email" placeholder="nhanvien@congty.vn" autocomplete="username">
  </div>
  <div class="field">
    <label>Mật khẩu</label>
    <input id="l-pass" type="password" placeholder="••••••••" autocomplete="current-password"
           onkeydown="if(event.key==='Enter')doLogin()">
  </div>
  <div id="l-err" class="err-msg"></div>
  <button class="btn btn-primary" id="l-btn" onclick="doLogin()">Đăng nhập</button>
</div>

<!-- UPLOAD (shown after login) -->
<div class="card" id="upload-card" style="display:none">
  <div class="card-title">Tải lên biên lai</div>
  <div class="card-sub" id="upload-sub">
    Hỗ trợ JPEG, PNG, PDF (tối đa 20 MB). Chụp rõ ràng, đủ ánh sáng, biên lai phẳng.
  </div>

  <!-- Trip Decision callout -->
  <details class="trip-callout">
    <summary>📋 Biên lai công tác? Đọc trước khi nộp</summary>
    <div class="trip-body">
      <p>Nếu biên lai phát sinh trong <strong>chuyến công tác</strong> (có phụ cấp công tác/ngày), kế toán cần tạo <strong>Quyết định công tác</strong> bao phủ ngày biên lai <em>trước khi bạn nộp</em>.</p>
      <p style="margin-top:6px">Nếu chưa có Quyết định công tác, biên lai sẽ tự động được xếp vào <strong>Gate 2 (phúc lợi)</strong> thay vì Gate 1 (công tác phí). Liên hệ kế toán nếu cần điều chỉnh.</p>
    </div>
  </details>

  <!-- Photo tips -->
  <div style="margin-bottom:14px">
    <div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">MẸO CHỤP ẢNH</div>
    <div class="tips-grid">
      <div class="tip-item">
        <span class="tip-icon">☀️</span>
        <span class="tip-text">Đủ ánh sáng, không bóng đổ che số tiền</span>
      </div>
      <div class="tip-item">
        <span class="tip-icon">📐</span>
        <span class="tip-text">Đặt biên lai phẳng, chụp thẳng từ trên xuống</span>
      </div>
      <div class="tip-item">
        <span class="tip-icon">🔎</span>
        <span class="tip-text">Chữ số tiền và ngày phải đọc rõ ràng</span>
      </div>
      <div class="tip-item tip-bad">
        <span class="tip-icon">❌</span>
        <span class="tip-text">Tránh ảnh mờ, bị cắt góc hoặc nhăn nếp</span>
      </div>
    </div>
  </div>

  <div class="drop-zone" id="drop-zone"
       onclick="document.getElementById('file-input').click()"
       ondragover="onDragOver(event)" ondragleave="onDragLeave(event)" ondrop="onDrop(event)">
    <input type="file" id="file-input" accept="image/jpeg,image/png,image/tiff,image/bmp,image/webp,application/pdf"
           onchange="onFileSelect(event)">
    <div class="dz-icon">📎</div>
    <div class="dz-title">Kéo thả biên lai vào đây</div>
    <div class="dz-hint">hoặc nhấp để chọn từ thiết bị</div>
  </div>

  <div class="preview-wrap" id="preview-wrap">
    <img class="preview-img" id="preview-img" src="" alt="preview">
    <div class="preview-name" id="preview-name"></div>
    <div class="preview-change" onclick="document.getElementById('file-input').click()">
      Chọn file khác
    </div>
  </div>

  <button class="btn btn-primary" id="upload-btn" onclick="doUpload()" disabled>
    Nộp biên lai →
  </button>

  <!-- Status display -->
  <div class="status-card" id="status-card">
    <div class="st-icon" id="st-icon">⏳</div>
    <div class="st-title" id="st-title">Đang xử lý…</div>
    <div class="st-msg" id="st-msg"></div>
    <div class="st-action" id="st-action"></div>

    <div class="progress-ring" id="prog-ring">
      <div class="ring-dot" id="pd-upload"></div>
      <div class="ring-label">Tải lên</div>
      <div class="ring-dot" id="pd-ocr"></div>
      <div class="ring-label">OCR</div>
      <div class="ring-dot" id="pd-gate"></div>
      <div class="ring-label">Phân loại</div>
      <div class="ring-dot" id="pd-review"></div>
      <div class="ring-label">Kết quả</div>
    </div>

    <!-- Failure reason cards (shown on needs_review / failed) -->
    <div class="reason-list" id="reason-list"></div>

    <!-- Extracted OCR data (shown on complete/approved) -->
    <div class="ocr-box" id="ocr-box">
      <div class="ocr-row">
        <span class="ocr-k">Vendor</span>
        <span class="ocr-v" id="ocr-vendor">—</span>
      </div>
      <div class="ocr-row">
        <span class="ocr-k">Số tiền</span>
        <span class="ocr-v" id="ocr-amount">—</span>
      </div>
      <div class="ocr-row">
        <span class="ocr-k">Ngày</span>
        <span class="ocr-v" id="ocr-date">—</span>
      </div>
      <div class="ocr-row" style="flex-direction:column">
        <div style="display:flex;gap:8px">
          <span class="ocr-k">Độ tin cậy</span>
          <span class="ocr-v" id="ocr-conf">—</span>
        </div>
        <div class="conf-bar"><div class="conf-fill" id="ocr-conf-bar" style="width:0"></div></div>
      </div>
    </div>
  </div>

  <div class="new-btn-wrap" id="new-btn-wrap">
    <button class="btn btn-ghost" onclick="resetUpload()">+ Nộp biên lai mới</button>
  </div>
</div>

<script>
let token             = sessionStorage.getItem('rcl_emp_token');
let selectedFile      = null;
let expenseId         = null;
let pollHandle        = null;
let currentStatus     = null;
let resolvedEmployeeId = null; // fetched from /api/mobile/me after login

// ── Boot ──────────────────────────────────────────────────────────────────
window.onload = () => token ? showUploadScreen() : null;

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearPoll(); }
  else if (expenseId && currentStatus && !['approved','rejected','erp_exported','failed','needs_review'].includes(currentStatus)) {
    startPolling();
  }
});

function showUploadScreen() {
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('uc-email').textContent = p.email || p.sub?.slice(0,8)+'…';
    document.getElementById('uc-init').textContent = (p.email?.[0] || '?').toUpperCase();
    document.getElementById('user-chip').style.display = 'flex';
  } catch {}
  document.getElementById('login-card').style.display  = 'none';
  document.getElementById('upload-card').style.display = '';
  fetchEmployeeProfile();
}

async function fetchEmployeeProfile() {
  try {
    const r = await fetch('/api/mobile/me', { headers: { Authorization: 'Bearer ' + token } });
    if (r.ok) {
      const d = await r.json();
      resolvedEmployeeId = d.employeeId || null;
    }
  } catch {}
}

// ── Login ─────────────────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  const err   = document.getElementById('l-err');
  const btn   = document.getElementById('l-btn');

  if (!email || !pass) { err.textContent = 'Vui lòng nhập email và mật khẩu.'; return; }
  err.textContent = '';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang đăng nhập…';

  try {
    const r = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password: pass }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'Đăng nhập thất bại');
    if (d.accessToken) {
      const payload = JSON.parse(atob(d.accessToken.split('.')[1]));
      if (payload.role !== 'employee') {
        throw new Error('Trang này dành cho tài khoản nhân viên (employee). Vui lòng dùng đúng tài khoản.');
      }
    }
    token = d.accessToken;
    sessionStorage.setItem('rcl_emp_token', token);
    showUploadScreen();
  } catch(e) {
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Đăng nhập';
  }
}

function doLogout() {
  sessionStorage.removeItem('rcl_emp_token');
  token = null; selectedFile = null; expenseId = null; resolvedEmployeeId = null;
  clearPoll();
  document.getElementById('login-card').style.display  = '';
  document.getElementById('upload-card').style.display = 'none';
  document.getElementById('user-chip').style.display   = 'none';
  resetUpload();
}

// ── File selection ─────────────────────────────────────────────────────────
function onFileSelect(e) {
  const f = e.target.files?.[0];
  if (f) setFile(f);
}
function onDragOver(e)  { e.preventDefault(); document.getElementById('drop-zone').classList.add('over'); }
function onDragLeave()  { document.getElementById('drop-zone').classList.remove('over'); }
function onDrop(e) {
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('over');
  const f = e.dataTransfer.files?.[0];
  if (f) setFile(f);
}

function setFile(f) {
  selectedFile = f;
  const MAX = 20*1024*1024;
  const ALLOWED = ['image/jpeg','image/png','image/tiff','image/bmp','image/webp','application/pdf'];
  const uploadBtn = document.getElementById('upload-btn');

  if (!ALLOWED.includes(f.type)) {
    showUploadError('Định dạng "'+f.type+'" chưa được hỗ trợ. Vui lòng dùng JPEG, PNG, hoặc PDF.');
    uploadBtn.disabled = true;
    return;
  }
  if (f.size > MAX) {
    showUploadError('File quá lớn (' + (f.size/1024/1024).toFixed(1) + ' MB). Tối đa 20 MB.');
    uploadBtn.disabled = true;
    return;
  }

  // Preview
  const wrap = document.getElementById('preview-wrap');
  const img  = document.getElementById('preview-img');
  wrap.style.display = '';
  document.getElementById('preview-name').textContent = f.name + ' (' + (f.size/1024).toFixed(0) + ' KB)';
  if (f.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; img.style.display = ''; };
    reader.readAsDataURL(f);
  } else {
    img.style.display = 'none';
  }

  document.getElementById('drop-zone').style.display = 'none';
  document.getElementById('status-card').style.display = 'none';
  document.getElementById('new-btn-wrap').style.display = 'none';
  uploadBtn.disabled = false;
  clearUploadError();
}

function showUploadError(msg) {
  const sub = document.getElementById('upload-sub');
  sub.innerHTML = '<span style="color:var(--danger)">⛔ '+esc(msg)+'</span>';
}
function clearUploadError() {
  document.getElementById('upload-sub').textContent =
    'Chụp ảnh rõ ràng, đặt biên lai phẳng, đủ ánh sáng. Hỗ trợ JPEG, PNG, PDF (tối đa 20 MB).';
}

// ── Upload ─────────────────────────────────────────────────────────────────
async function doUpload() {
  if (!selectedFile) return;
  const btn = document.getElementById('upload-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang tải lên…';

  showStatus('wait', '⏳', 'Đang tải lên biên lai…', 'Vui lòng đợi trong giây lát.', 'wait');
  setRing('upload', 'active');

  const form = new FormData();
  form.append('image', selectedFile);
  if (resolvedEmployeeId) form.append('employeeId', resolvedEmployeeId);
  const idempotencyKey = (crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2));
  form.append('idempotency_key', idempotencyKey);

  try {
    const r = await fetch('/api/mobile/upload-receipt', {
      method:'POST',
      headers: { Authorization: 'Bearer '+token },
      body: form,
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'Tải lên thất bại (HTTP '+r.status+')');

    expenseId = d.expenseId;
    if (d.receipt_image_url || d.receipt_image_signed_url) {
      document.getElementById('preview-img').src = d.receipt_image_signed_url || d.receipt_image_url;
    }
    setRing('upload', 'done'); setRing('ocr', 'active');
    showStatus('wait', '🔍', 'Đang quét biên lai…',
      d.user_message || 'OCR đang xử lý — thường dưới 10 giây.', 'wait');

    btn.style.display = 'none';
    document.getElementById('preview-wrap').style.display = 'none';
    startPolling();
  } catch(e) {
    btn.disabled = false;
    btn.textContent = 'Thử lại →';
    showStatus('error', '⛔', 'Tải lên thất bại', e.message, 'error');
    setRing('upload', '');
  }
}

// ── Status polling ─────────────────────────────────────────────────────────
function startPolling() {
  clearPoll();
  pollHandle = setInterval(pollStatus, 2500);
}
function clearPoll() {
  if (pollHandle) { clearInterval(pollHandle); pollHandle = null; }
}

async function pollStatus() {
  if (!expenseId) return;
  try {
    const r = await fetch('/api/mobile/status/'+expenseId, {
      headers: { Authorization: 'Bearer '+token },
    });
    if (r.status===401) { clearPoll(); doLogout(); return; }
    const d = await r.json();
    handleStatusUpdate(d);
  } catch {}
}

function handleStatusUpdate(d) {
  const status = d.status;
  const action = d.action_required;

  currentStatus = status;

  // Update pipeline ring
  if (['processing','pending_ocr'].includes(status)) {
    setRing('upload', 'done'); setRing('ocr', 'active');
  } else if (status === 'complete') {
    setRing('upload', 'done'); setRing('ocr', 'done'); setRing('gate', 'active');
  } else if (['approved','needs_review','failed','rejected','erp_exported'].includes(status)) {
    setRing('upload', 'done'); setRing('ocr', 'done');
    setRing('gate', status==='failed'?'':'done');
    setRing('review', 'done');
  }

  if (action === 'wait') {
    showStatus('wait', '🔍', 'Đang xử lý…', d.user_message, 'wait');
    return;
  }

  clearPoll();
  document.getElementById('new-btn-wrap').style.display = '';

  if (action === 'done') {
    let icon = '✅';
    if (status === 'erp_exported') icon = '📤';
    showStatus('done', icon, 'Hoàn tất!', d.user_message, 'done');
    if (d.ocrData) renderOcr(d.ocrData);
  } else if (action === 'in_review') {
    showStatus('review', '🔍', 'Đang chờ kiểm tra', d.user_message, 'review');
    renderReasons(d.failure_reasons_human || []);
  } else if (action === 'reupload') {
    showStatus('error', '📷', 'Cần tải lại', d.user_message, 'error');
    renderReasons(d.failure_reasons_human || []);
  } else if (action === 'rejected') {
    showStatus('error', '❌', 'Biên lai bị từ chối', d.user_message, 'error');
  }
}

// ── Status display helpers ─────────────────────────────────────────────────
const STATUS_TYPE = { wait:'wait', done:'done', review:'review', error:'error' };
const STATUS_CSS = { wait:'status-wait', done:'status-done', review:'status-review', error:'status-error' };
const ACTION_CSS = { wait:'st-action-wait', done:'st-action-done', review:'st-action-review', error:'st-action-error' };
const ACTION_TEXT = {
  wait:   '⏱ Đang xử lý — vui lòng chờ',
  done:   '✅ Chi phí đã được ghi nhận',
  review: '📋 Kế toán sẽ xem xét trong thời gian sớm nhất',
  error:  '↩ Vui lòng thử lại',
};

function showStatus(type, icon, title, msg, actionKey) {
  const card = document.getElementById('status-card');
  card.className = 'status-card ' + (STATUS_CSS[type]||'status-wait');
  card.style.display = '';
  document.getElementById('st-icon').textContent   = icon;
  document.getElementById('st-title').textContent  = title;
  document.getElementById('st-msg').textContent    = msg;
  const actEl = document.getElementById('st-action');
  actEl.className = 'st-action ' + (ACTION_CSS[actionKey]||'st-action-wait');
  actEl.textContent = ACTION_TEXT[actionKey] || '';
}

function renderReasons(reasons) {
  const list = document.getElementById('reason-list');
  if (!reasons.length) { list.innerHTML = ''; return; }
  list.innerHTML = reasons.map(r =>
    '<div class="reason-item">'
      +'<div class="ri-title">'+esc(r.title||'')+'</div>'
      +'<div class="ri-detail">'+esc(r.detail||'')+'</div>'
      +'<div class="ri-action">→ '+esc(r.action||'')+'</div>'
    +'</div>'
  ).join('');
}

function renderOcr(ocr) {
  const box = document.getElementById('ocr-box');
  box.style.display = '';
  document.getElementById('ocr-vendor').textContent = ocr.vendor || '(không xác định)';
  document.getElementById('ocr-amount').textContent =
    ocr.amount ? Number(ocr.amount).toLocaleString('vi-VN') + ' ' + (ocr.currency||'VND') : '—';
  document.getElementById('ocr-date').textContent =
    ocr.date ? new Date(ocr.date).toLocaleDateString('vi-VN') : '—';
  const conf = Math.round((ocr.confidence||0)*100);
  document.getElementById('ocr-conf').textContent = conf+'%';
  const bar   = document.getElementById('ocr-conf-bar');
  bar.style.width = conf+'%';
  bar.style.background = conf<40?'#ef4444':conf<70?'#f59e0b':'#10b981';
}

function setRing(stage, state) {
  const id = { upload:'pd-upload', ocr:'pd-ocr', gate:'pd-gate', review:'pd-review' }[stage];
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'ring-dot' + (state?' '+state:'');
}

function resetUpload() {
  clearPoll();
  selectedFile = null; expenseId = null; currentStatus = null;
  document.getElementById('drop-zone').style.display    = '';
  document.getElementById('preview-wrap').style.display = 'none';
  document.getElementById('preview-img').src            = '';
  document.getElementById('status-card').style.display  = 'none';
  document.getElementById('ocr-box').style.display      = 'none';
  document.getElementById('reason-list').innerHTML      = '';
  document.getElementById('new-btn-wrap').style.display = 'none';
  const btn = document.getElementById('upload-btn');
  btn.disabled  = true;
  btn.style.display = '';
  btn.textContent = 'Nộp biên lai →';
  const fi = document.getElementById('file-input');
  fi.value = '';
  setRing('upload',''); setRing('ocr',''); setRing('gate',''); setRing('review','');
  clearUploadError();
}

function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
</script>
</body>
</html>`;
}
//# sourceMappingURL=mobile-guide.html.js.map