"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildImportHtml = buildImportHtml;
function buildImportHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — Nhập dữ liệu</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --brand:    #1a56db; --brand-lt: #eff6ff;
    --danger:   #dc2626; --warn: #d97706; --ok: #059669;
    --bg:       #f3f4f6; --card: #ffffff; --border: #e5e7eb;
    --text:     #111827; --muted: #6b7280;
  }
  body { font-family: system-ui,-apple-system,sans-serif; font-size:14px; color:var(--text); background:var(--bg); min-height:100vh; }
  .topbar { background:var(--brand); color:#fff; padding:0 20px; height:48px; display:flex; align-items:center; gap:12px; }
  .topbar h1 { font-size:15px; font-weight:700; }
  .topbar .spacer { flex:1; }
  .topbar .logout { font-size:12px; cursor:pointer; background:rgba(255,255,255,.2); border:none; color:#fff; padding:4px 12px; border-radius:4px; }
  .topbar .logout:hover { background:rgba(255,255,255,.35); }
  .topbar .role-badge { font-size:11px; background:rgba(255,255,255,.2); padding:2px 10px; border-radius:10px; }
  #login-screen { display:flex; align-items:center; justify-content:center; min-height:calc(100vh - 48px); }
  .login-card { background:var(--card); padding:32px; border-radius:8px; border:1px solid var(--border); width:340px; }
  .login-card h2 { font-size:18px; font-weight:700; margin-bottom:20px; }
  .f-row { margin-bottom:14px; }
  .f-row label { display:block; font-size:12px; font-weight:500; margin-bottom:4px; color:var(--muted); }
  .f-row input { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:5px; font-size:14px; }
  .f-row input:focus { outline:none; border-color:var(--brand); }
  .btn { padding:8px 16px; border-radius:5px; border:none; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-primary { background:var(--brand); color:#fff; }
  .btn-primary:hover { background:#1741b6; }
  .btn-primary-full { width:100%; padding:10px; font-size:14px; }
  .btn-sm { padding:5px 12px; font-size:12px; }
  .btn-ghost { background:var(--bg); color:var(--text); border:1px solid var(--border); }
  .btn-ghost:hover { background:#e5e7eb; }
  .err-msg { color:var(--danger); font-size:12px; margin-top:8px; min-height:16px; }
  #app-screen { display:none; }
  .nav-tabs { background:var(--card); border-bottom:1px solid var(--border); padding:0 20px; display:flex; gap:2px; }
  .nav-tab { padding:12px 16px; font-size:13px; font-weight:500; cursor:pointer; border-bottom:2px solid transparent; color:var(--muted); }
  .nav-tab.active { color:var(--brand); border-bottom-color:var(--brand); }
  .tab-panel { display:none; padding:24px; max-width:860px; margin:0 auto; }
  .tab-panel.active { display:block; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:24px; }
  .card + .card { margin-top:16px; }
  .card h3 { font-size:15px; font-weight:600; margin-bottom:16px; }
  .section-label { font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px; margin-top:20px; }
  .section-label:first-child { margin-top:0; }
  .drop-zone { border:2px dashed var(--border); border-radius:8px; padding:32px; text-align:center; cursor:pointer; transition:border-color .15s, background .15s; }
  .drop-zone:hover, .drop-zone.drag-over { border-color:var(--brand); background:var(--brand-lt); }
  .drop-zone .dz-icon { font-size:32px; display:block; margin-bottom:8px; }
  .drop-zone .dz-label { font-size:14px; color:var(--muted); }
  .drop-zone .dz-hint { font-size:12px; color:var(--muted); margin-top:4px; }
  .drop-zone .dz-file { font-size:13px; color:var(--brand); font-weight:500; margin-top:8px; }
  .checkbox-row { display:flex; align-items:center; gap:8px; margin:12px 0; }
  .checkbox-row input { width:auto; }
  .checkbox-row label { font-size:13px; font-weight:500; cursor:pointer; margin-bottom:0; }
  .action-row { display:flex; gap:8px; align-items:center; margin-top:16px; }
  .result-card { display:none; background:var(--card); border:1px solid var(--border); border-radius:8px; margin-top:16px; overflow:hidden; }
  .result-card.visible { display:block; }
  .result-card .result-header { padding:14px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:16px; }
  .stat-chip { text-align:center; }
  .stat-chip .n { font-size:20px; font-weight:700; }
  .stat-chip .l { font-size:11px; color:var(--muted); }
  .stat-chip.ok .n  { color:var(--ok); }
  .stat-chip.err .n { color:var(--danger); }
  .stat-chip.skip .n { color:var(--warn); }
  .dry-tag { background:#fef3c7; color:#92400e; font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; }
  .err-table { width:100%; border-collapse:collapse; }
  .err-table th, .err-table td { padding:8px 14px; text-align:left; border-bottom:1px solid var(--border); font-size:12px; }
  .err-table th { font-weight:600; color:var(--muted); background:#f9fafb; }
  .ok-list { padding:12px 16px; }
  .ok-list li { padding:4px 0; font-size:13px; color:var(--ok); }
  .err-list li { padding:4px 0; font-size:13px; color:var(--danger); }
  .ok-list li::before { content:'✓ '; font-weight:700; }
  .err-list li::before { content:'✗ '; font-weight:700; }
  .info-box { background:var(--brand-lt); border:1px solid #bfdbfe; border-radius:6px; padding:12px 16px; font-size:13px; color:#1e40af; margin-bottom:16px; }
  .info-box code { background:rgba(255,255,255,.7); padding:1px 5px; border-radius:3px; font-size:12px; }
  .schema-table { width:100%; border-collapse:collapse; margin-top:8px; }
  .schema-table th, .schema-table td { padding:7px 12px; text-align:left; border:1px solid var(--border); font-size:12px; }
  .schema-table th { background:#f9fafb; font-weight:600; }
  .schema-table code { background:#f3f4f6; padding:1px 5px; border-radius:3px; }
  .progress-bar { width:100%; height:6px; background:#e5e7eb; border-radius:3px; overflow:hidden; margin-top:12px; display:none; }
  .progress-bar.visible { display:block; }
  .progress-fill { height:100%; background:var(--brand); border-radius:3px; transition:width .3s; }
</style>
</head>
<body>
<div class="topbar">
  <h1>Reclaim! — Nhập dữ liệu</h1>
  <div class="spacer"></div>
  <span id="user-email" style="font-size:12px;opacity:.8"></span>
  <span id="user-role-badge" class="role-badge" style="display:none"></span>
  <button class="logout" onclick="logout()">Đăng xuất</button>
</div>

<div id="login-screen">
  <div class="login-card">
    <h2>Đăng nhập</h2>
    <div class="f-row"><label>Email</label><input type="email" id="l-email" placeholder="email@company.com"></div>
    <div class="f-row"><label>Mật khẩu</label><input type="password" id="l-pass" placeholder="••••••••"></div>
    <button class="btn btn-primary btn-primary-full" onclick="login()">Đăng nhập</button>
    <div class="err-msg" id="l-err"></div>
  </div>
</div>

<div id="app-screen">
  <div class="nav-tabs" id="nav-tabs">
    <div class="nav-tab active" id="tab-btn-expenses" onclick="switchTab('expenses',this)">Nhập chi phí</div>
    <div class="nav-tab" id="tab-btn-tenants" onclick="switchTab('tenants',this)" style="display:none">Tạo hàng loạt Tenant</div>
  </div>

  <!-- EXPENSE IMPORT TAB -->
  <div class="tab-panel active" id="tab-expenses">
    <div class="info-box">
      <strong>Cách sử dụng:</strong> Tải template CSV, điền dữ liệu chi phí lịch sử, rồi upload lên.
      Chạy thử (dry run) trước để kiểm tra lỗi mà không lưu dữ liệu.
    </div>

    <div class="card">
      <h3>Nhập chi phí từ CSV</h3>

      <div class="section-label">Định dạng CSV</div>
      <table class="schema-table">
        <thead><tr><th>Cột</th><th>Bắt buộc</th><th>Định dạng</th><th>Ví dụ</th></tr></thead>
        <tbody>
          <tr><td><code>date</code></td><td>✓</td><td>YYYY-MM-DD hoặc DD/MM/YYYY</td><td>2026-01-15</td></tr>
          <tr><td><code>employee_id</code></td><td>✓</td><td>Mã nhân viên (NV001)</td><td>NV001</td></tr>
          <tr><td><code>vendor_name</code></td><td>✓</td><td>Tên nhà cung cấp</td><td>Grab</td></tr>
          <tr><td><code>amount_vnd</code></td><td>✓</td><td>Số nguyên dương (≤ 100.000.000)</td><td>250000</td></tr>
          <tr><td><code>category</code></td><td>✓</td><td>travel_allowance | welfare_allowance | personal_card_reimbursement</td><td>travel_allowance</td></tr>
          <tr><td><code>description</code></td><td></td><td>Ghi chú tự do</td><td>Công tác TP.HCM</td></tr>
        </tbody>
      </table>

      <div class="section-label" style="margin-top:20px">Tải template</div>
      <button class="btn btn-sm btn-ghost" onclick="downloadTemplate()">↓ Tải template CSV</button>

      <div class="section-label" style="margin-top:20px">Upload file</div>
      <div class="drop-zone" id="exp-drop" onclick="document.getElementById('exp-file').click()">
        <span class="dz-icon">📄</span>
        <div class="dz-label">Kéo thả file CSV vào đây hoặc bấm để chọn file</div>
        <div class="dz-hint">Tối đa 5 MB · 5.000 hàng</div>
        <div class="dz-file" id="exp-file-name"></div>
      </div>
      <input type="file" id="exp-file" accept=".csv" style="display:none" onchange="onExpFileChange(this)">

      <div class="checkbox-row">
        <input type="checkbox" id="exp-dry-run" checked>
        <label for="exp-dry-run">Chạy thử (dry run) — kiểm tra lỗi, không lưu dữ liệu</label>
      </div>

      <div class="action-row">
        <button class="btn btn-primary" onclick="uploadExpenses()" id="exp-upload-btn" disabled>Upload & Nhập</button>
        <span id="exp-status" style="font-size:12px;color:var(--muted)"></span>
      </div>
      <div class="progress-bar" id="exp-progress"><div class="progress-fill" id="exp-fill" style="width:0"></div></div>
    </div>

    <div class="result-card" id="exp-result">
      <div class="result-header" id="exp-result-header"></div>
      <div id="exp-result-body"></div>
    </div>
  </div>

  <!-- TENANT BULK PROVISION TAB -->
  <div class="tab-panel" id="tab-tenants">
    <div class="info-box">
      <strong>Dành cho Super Admin.</strong> Upload CSV danh sách công ty để tạo hàng loạt tenant + admin user trong một lần.
    </div>

    <div class="card">
      <h3>Tạo Tenants từ CSV</h3>

      <div class="section-label">Định dạng CSV</div>
      <table class="schema-table">
        <thead><tr><th>Cột</th><th>Bắt buộc</th><th>Ghi chú</th></tr></thead>
        <tbody>
          <tr><td><code>name</code></td><td>✓</td><td>Tên công ty (phải duy nhất)</td></tr>
          <tr><td><code>tax_code</code></td><td>✓</td><td>Mã số thuế (phải duy nhất)</td></tr>
          <tr><td><code>admin_email</code></td><td>✓</td><td>Email đăng nhập của partner admin</td></tr>
          <tr><td><code>admin_password</code></td><td>✓</td><td>Mật khẩu (tối thiểu 8 ký tự)</td></tr>
        </tbody>
      </table>

      <div class="section-label" style="margin-top:20px">Tải template</div>
      <button class="btn btn-sm btn-ghost" onclick="downloadTenantTemplate()">↓ Tải template CSV</button>

      <div class="section-label" style="margin-top:20px">Upload file</div>
      <div class="drop-zone" id="ten-drop" onclick="document.getElementById('ten-file').click()">
        <span class="dz-icon">🏢</span>
        <div class="dz-label">Kéo thả file CSV danh sách công ty</div>
        <div class="dz-hint">Tối đa 5 MB · 500 công ty</div>
        <div class="dz-file" id="ten-file-name"></div>
      </div>
      <input type="file" id="ten-file" accept=".csv" style="display:none" onchange="onTenFileChange(this)">

      <div class="action-row">
        <button class="btn btn-primary" onclick="uploadTenants()" id="ten-upload-btn" disabled>Upload & Tạo</button>
        <span id="ten-status" style="font-size:12px;color:var(--muted)"></span>
      </div>
      <div class="progress-bar" id="ten-progress"><div class="progress-fill" id="ten-fill" style="width:0"></div></div>
    </div>

    <div class="result-card" id="ten-result">
      <div class="result-header" id="ten-result-header"></div>
      <div id="ten-result-body"></div>
    </div>
  </div>
</div>

<script>
const API = '/api';
let token = localStorage.getItem('import_token') || '';
let userRole = '';
let expFile = null, tenFile = null;

function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

async function login() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  document.getElementById('l-err').textContent = '';
  try {
    const data = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    }).then(r => r.json());
    if (!data.access_token) throw new Error(data.message || 'Đăng nhập thất bại');
    const payload = JSON.parse(atob(data.access_token.split('.')[1]));
    if (!['partner_admin', 'super_admin'].includes(payload.role)) {
      throw new Error('Chỉ Partner Admin hoặc Super Admin được sử dụng công cụ này');
    }
    token = data.access_token;
    userRole = payload.role;
    localStorage.setItem('import_token', token);
    initApp(email, userRole);
  } catch(e) { document.getElementById('l-err').textContent = e.message; }
}

function logout() {
  token = ''; localStorage.removeItem('import_token');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display = 'none';
}

function initApp(email, role) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-screen').style.display = 'block';
  document.getElementById('user-email').textContent = email;
  const badge = document.getElementById('user-role-badge');
  badge.textContent = role === 'super_admin' ? 'Super Admin' : 'Partner Admin';
  badge.style.display = 'inline-block';
  if (role === 'super_admin') {
    document.getElementById('tab-btn-tenants').style.display = 'inline-block';
  }
  setupDragDrop();
}

function switchTab(name, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

// ── Drag & drop ───────────────────────────────────────────────────────────
function setupDragDrop() {
  [['exp-drop','exp-file', f => { expFile = f; document.getElementById('exp-file-name').textContent = f.name; document.getElementById('exp-upload-btn').disabled = false; }],
   ['ten-drop','ten-file', f => { tenFile = f; document.getElementById('ten-file-name').textContent = f.name; document.getElementById('ten-upload-btn').disabled = false; }]
  ].forEach(([dropId, fileId, cb]) => {
    const drop = document.getElementById(dropId);
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag-over');
      const f = e.dataTransfer.files[0];
      if (f && f.name.endsWith('.csv')) cb(f);
      else alert('Vui lòng chọn file .csv');
    });
  });
}

function onExpFileChange(input) {
  const f = input.files[0];
  if (!f) return;
  expFile = f;
  document.getElementById('exp-file-name').textContent = f.name;
  document.getElementById('exp-upload-btn').disabled = false;
}
function onTenFileChange(input) {
  const f = input.files[0];
  if (!f) return;
  tenFile = f;
  document.getElementById('ten-file-name').textContent = f.name;
  document.getElementById('ten-upload-btn').disabled = false;
}

// ── Templates ─────────────────────────────────────────────────────────────
function downloadTemplate() {
  const a = document.createElement('a');
  a.href = API + '/import/template/expenses';
  a.setAttribute('Authorization', 'Bearer ' + token);
  // Use fetch to handle auth header
  fetch(API + '/import/template/expenses', { headers: { Authorization: 'Bearer ' + token } })
    .then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a2 = document.createElement('a');
      a2.href = url; a2.download = 'reclaim_expense_template.csv'; a2.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }).catch(e => alert('Lỗi tải template: ' + e.message));
}
function downloadTenantTemplate() {
  fetch(API + '/import/template/tenants', { headers: { Authorization: 'Bearer ' + token } })
    .then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'reclaim_tenant_template.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }).catch(e => alert('Lỗi tải template: ' + e.message));
}

// ── Expense upload ────────────────────────────────────────────────────────
async function uploadExpenses() {
  if (!expFile) return;
  const dryRun = document.getElementById('exp-dry-run').checked;
  const btn = document.getElementById('exp-upload-btn');
  btn.disabled = true;
  document.getElementById('exp-status').textContent = 'Đang xử lý...';
  const prog = document.getElementById('exp-progress');
  const fill = document.getElementById('exp-fill');
  prog.classList.add('visible'); fill.style.width = '30%';

  const fd = new FormData();
  fd.append('file', expFile);
  fill.style.width = '60%';
  try {
    const res = await fetch(API + '/import/expenses?dry_run=' + dryRun, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: fd,
    });
    fill.style.width = '100%';
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload thất bại');
    renderExpenseResult(data);
    document.getElementById('exp-status').textContent = '';
  } catch(e) {
    document.getElementById('exp-status').textContent = '✗ ' + e.message;
    document.getElementById('exp-status').style.color = 'var(--danger)';
  } finally {
    btn.disabled = false;
    setTimeout(() => { prog.classList.remove('visible'); fill.style.width = '0'; }, 800);
  }
}

function renderExpenseResult(d) {
  const card = document.getElementById('exp-result');
  card.classList.add('visible');
  document.getElementById('exp-result-header').innerHTML =
    \`<div class="stat-chip ok"><div class="n">\${d.imported}</div><div class="l">Đã nhập</div></div>
     <div class="stat-chip skip"><div class="n">\${d.skipped}</div><div class="l">Bỏ qua</div></div>
     <div class="stat-chip"><div class="n">\${d.total}</div><div class="l">Tổng hàng</div></div>
     \${d.dry_run ? '<span class="dry-tag">DRY RUN — Không lưu</span>' : ''}\`;

  if (!d.errors.length) {
    document.getElementById('exp-result-body').innerHTML =
      \`<div style="padding:16px;color:var(--ok);font-weight:500">\${d.dry_run ? '✓ Không có lỗi — có thể nhập an toàn.' : '✓ Nhập thành công toàn bộ hàng hợp lệ.'}</div>\`;
    return;
  }
  document.getElementById('exp-result-body').innerHTML =
    \`<div style="padding:10px 14px;font-size:12px;color:var(--danger);font-weight:600">\${d.errors.length} hàng có lỗi:</div>
     <div style="overflow-x:auto">
       <table class="err-table">
         <thead><tr><th>Hàng</th><th>Cột</th><th>Lỗi</th></tr></thead>
         <tbody>\${d.errors.slice(0,200).map(e => \`<tr><td>\${e.row}</td><td><code>\${esc(e.field)}</code></td><td>\${esc(e.message)}</td></tr>\`).join('')}</tbody>
       </table>
       \${d.errors.length > 200 ? \`<div style="padding:8px 14px;font-size:12px;color:var(--muted)">... và \${d.errors.length - 200} lỗi khác</div>\` : ''}
     </div>\`;
}

// ── Tenant bulk upload ────────────────────────────────────────────────────
async function uploadTenants() {
  if (!tenFile) return;
  const btn = document.getElementById('ten-upload-btn');
  btn.disabled = true;
  document.getElementById('ten-status').textContent = 'Đang xử lý...';
  const prog = document.getElementById('ten-progress');
  const fill = document.getElementById('ten-fill');
  prog.classList.add('visible'); fill.style.width = '30%';

  const fd = new FormData();
  fd.append('file', tenFile);
  fill.style.width = '60%';
  try {
    const res = await fetch(API + '/import/tenants', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: fd,
    });
    fill.style.width = '100%';
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload thất bại');
    renderTenantResult(data);
    document.getElementById('ten-status').textContent = '';
  } catch(e) {
    document.getElementById('ten-status').textContent = '✗ ' + e.message;
    document.getElementById('ten-status').style.color = 'var(--danger)';
  } finally {
    btn.disabled = false;
    setTimeout(() => { prog.classList.remove('visible'); fill.style.width = '0'; }, 800);
  }
}

function renderTenantResult(d) {
  const card = document.getElementById('ten-result');
  card.classList.add('visible');
  document.getElementById('ten-result-header').innerHTML =
    \`<div class="stat-chip ok"><div class="n">\${d.succeeded}</div><div class="l">Tạo thành công</div></div>
     <div class="stat-chip err"><div class="n">\${d.failed}</div><div class="l">Thất bại</div></div>
     <div class="stat-chip"><div class="n">\${d.total}</div><div class="l">Tổng</div></div>\`;

  const ok  = d.results.filter(r => r.status === 'ok');
  const err = d.results.filter(r => r.status === 'error');
  let html = '';
  if (ok.length) {
    html += \`<ul class="ok-list" style="padding:12px 16px;list-style:none">\${ok.map(r => \`<li>Hàng \${r.row}: \${esc(r.name)}</li>\`).join('')}</ul>\`;
  }
  if (err.length) {
    html += \`<ul class="err-list" style="padding:12px 16px;list-style:none;border-top:1px solid var(--border)">\${err.map(r => \`<li>Hàng \${r.row}: \${esc(r.name)} — \${esc(r.message)}</li>\`).join('')}</ul>\`;
  }
  document.getElementById('ten-result-body').innerHTML = html || '<div style="padding:16px;color:var(--muted)">Không có kết quả</div>';
}

// ── Auto-login from stored token ──────────────────────────────────────────
if (token) {
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    if (p.exp * 1000 > Date.now() && ['partner_admin','super_admin'].includes(p.role)) {
      userRole = p.role;
      initApp(p.sub || 'user', p.role);
    } else { localStorage.removeItem('import_token'); token = ''; }
  } catch { localStorage.removeItem('import_token'); token = ''; }
}
</script>
</body>
</html>`;
}
//# sourceMappingURL=import.html.js.map