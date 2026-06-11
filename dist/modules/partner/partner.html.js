"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPartnerPortalHtml = buildPartnerPortalHtml;
function buildPartnerPortalHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — Partner Portal</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --brand:    #1a56db; --brand-lt: #eff6ff;
    --danger:   #dc2626; --warn: #d97706; --ok: #059669;
    --bg:       #f3f4f6; --card: #ffffff; --border: #e5e7eb;
    --text:     #111827; --muted: #6b7280;
  }
  body { font-family: system-ui,-apple-system,sans-serif; font-size:14px; color:var(--text); background:var(--bg); }
  .topbar { background:var(--brand); color:#fff; padding:0 20px; height:48px; display:flex; align-items:center; gap:12px; }
  .topbar h1 { font-size:15px; font-weight:700; }
  .topbar .spacer { flex:1; }
  .topbar .logout { font-size:12px; cursor:pointer; background:rgba(255,255,255,.2); border:none; color:#fff; padding:4px 12px; border-radius:4px; }
  .topbar .logout:hover { background:rgba(255,255,255,.35); }
  #login-screen { display:flex; align-items:center; justify-content:center; min-height:calc(100vh - 48px); }
  .login-card { background:var(--card); padding:32px; border-radius:8px; border:1px solid var(--border); width:340px; }
  .login-card h2 { font-size:18px; font-weight:700; margin-bottom:20px; }
  .f-row { margin-bottom:14px; }
  .f-row label { display:block; font-size:12px; font-weight:500; margin-bottom:4px; color:var(--muted); }
  .f-row input, .f-row select { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:5px; font-size:14px; }
  .f-row input:focus, .f-row select:focus { outline:none; border-color:var(--brand); }
  .btn { padding:8px 16px; border-radius:5px; border:none; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-primary { background:var(--brand); color:#fff; }
  .btn-primary:hover { background:#1741b6; }
  .btn-primary-full { width:100%; padding:10px; font-size:14px; }
  .btn-sm { padding:4px 10px; font-size:12px; }
  .btn-danger { background:#fee2e2; color:var(--danger); }
  .btn-ghost { background:var(--bg); color:var(--text); border:1px solid var(--border); }
  .btn-ghost:hover { background:#e5e7eb; }
  .err-msg { color:var(--danger); font-size:12px; margin-top:8px; min-height:16px; }
  #app-screen { display:none; }
  .nav-tabs { background:var(--card); border-bottom:1px solid var(--border); padding:0 20px; display:flex; gap:2px; }
  .nav-tab { padding:12px 16px; font-size:13px; font-weight:500; cursor:pointer; border-bottom:2px solid transparent; color:var(--muted); }
  .nav-tab.active { color:var(--brand); border-bottom-color:var(--brand); }
  .tab-panel { display:none; padding:20px; }
  .tab-panel.active { display:block; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; }
  .card-head { padding:14px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
  .card-head h3 { font-size:14px; font-weight:600; }
  .card-head .spacer { flex:1; }
  .toolbar { padding:10px 16px; background:var(--bg); border-bottom:1px solid var(--border); display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .toolbar input, .toolbar select { padding:6px 10px; border:1px solid var(--border); border-radius:5px; font-size:13px; background:var(--card); }
  .toolbar input:focus, .toolbar select:focus { outline:none; border-color:var(--brand); }
  table { width:100%; border-collapse:collapse; }
  th, td { padding:10px 14px; text-align:left; border-bottom:1px solid var(--border); font-size:13px; }
  th { font-size:12px; font-weight:600; color:var(--muted); background:#f9fafb; }
  tr:hover td { background:#f9fafb; }
  .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; }
  .b-ok { background:#d1fae5; color:#065f46; }
  .b-off { background:#f3f4f6; color:var(--muted); }
  .b-warn { background:#fef3c7; color:#92400e; }
  .b-blue { background:var(--brand-lt); color:var(--brand); }
  .b-danger { background:#fee2e2; color:#b91c1c; }
  .metrics-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:20px; }
  .metric-card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:16px; }
  .metric-card .label { font-size:11px; color:var(--muted); font-weight:500; margin-bottom:6px; }
  .metric-card .value { font-size:24px; font-weight:700; }
  .metric-card .sub { font-size:11px; color:var(--muted); margin-top:4px; }
  .modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:100; align-items:center; justify-content:center; }
  .modal-overlay.on { display:flex; }
  .modal { background:var(--card); border-radius:8px; padding:24px; width:400px; max-width:90vw; }
  .modal h3 { font-size:16px; font-weight:700; margin-bottom:16px; }
  .modal-footer { margin-top:20px; display:flex; justify-content:flex-end; gap:8px; }
  .loading { text-align:center; padding:32px; color:var(--muted); }
  .text-link { color:var(--brand); cursor:pointer; }
  .text-link:hover { text-decoration:underline; }
  .gap-r { display:flex; gap:6px; }
  .report-bar-row { display:flex; align-items:center; gap:8px; padding:8px 16px; border-bottom:1px solid var(--border); }
  .report-bar-row:last-child { border-bottom:none; }
  .r-bar { flex:1; height:10px; background:#e5e7eb; border-radius:4px; overflow:hidden; }
  .r-fill { height:100%; border-radius:4px; }
  /* ── Toast notifications ── */
  #toast-container { position:fixed; bottom:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:8px; pointer-events:none; }
  .toast { padding:12px 16px; border-radius:8px; font-size:13px; font-weight:500; box-shadow:0 4px 16px rgba(0,0,0,.14);
           max-width:360px; display:flex; align-items:flex-start; gap:10px; animation:toast-in .2s ease; pointer-events:auto; }
  @keyframes toast-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .toast-error { background:#fef2f2; border:1px solid #fca5a5; color:#7f1d1d; }
  .toast-ok    { background:#f0fdf4; border:1px solid #86efac; color:#14532d; }
  .toast-info  { background:#eff6ff; border:1px solid #93c5fd; color:#1e3a5f; }
  .toast-close { margin-left:auto; cursor:pointer; opacity:.5; font-size:16px; background:none; border:none; padding:0 0 0 6px; color:inherit; }
  /* ── Better empty states ── */
  .empty-state { text-align:center; padding:40px 20px; color:var(--muted); }
  .empty-state .es-icon { font-size:36px; margin-bottom:12px; }
  .empty-state .es-title { font-size:15px; font-weight:600; color:var(--text); margin-bottom:6px; }
  .empty-state .es-sub { font-size:13px; margin-bottom:16px; }
</style>
</head>
<body>
<div id="toast-container"></div>
<div class="topbar">
  <h1>Reclaim! Partner Portal</h1>
  <div class="spacer"></div>
  <span id="partner-name" style="font-size:12px;opacity:.8"></span>
  <button class="logout" onclick="logout()">Đăng xuất</button>
</div>

<div id="login-screen">
  <div class="login-card">
    <h2>Đăng nhập Partner</h2>
    <div class="f-row"><label>Email</label><input type="email" id="l-email" placeholder="partner@example.com"></div>
    <div class="f-row"><label>Mật khẩu</label><input type="password" id="l-pass" placeholder="••••••••"></div>
    <button class="btn btn-primary btn-primary-full" onclick="login()">Đăng nhập</button>
    <div class="err-msg" id="l-err"></div>
  </div>
</div>

<div id="app-screen">
  <div class="nav-tabs">
    <div class="nav-tab active" onclick="switchTab('dashboard',this)">Tổng quan</div>
    <div class="nav-tab" onclick="switchTab('clients',this)">Khách hàng</div>
    <div class="nav-tab" onclick="switchTab('employees',this)">Nhân viên</div>
    <div class="nav-tab" onclick="switchTab('reports',this)">Báo cáo</div>
    <div class="nav-tab" onclick="switchTab('branding',this)">Thương hiệu</div>
  </div>

  <!-- DASHBOARD TAB -->
  <div class="tab-panel active" id="tab-dashboard">
    <h2 style="font-size:16px;font-weight:700;margin-bottom:16px">Tổng quan hoạt động</h2>
    <div class="metrics-row" id="dash-metrics">
      <div class="loading" style="grid-column:1/-1">Đang tải...</div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Clients của bạn</h3></div>
      <table>
        <thead><tr><th>Tên Client</th><th>Nhân viên</th><th>Chi phí</th><th>Chờ duyệt</th><th>Trạng thái</th></tr></thead>
        <tbody id="dash-clients"><tr><td colspan="5" class="loading">Đang tải...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- CLIENTS TAB -->
  <div class="tab-panel" id="tab-clients">
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <h2 style="font-size:16px;font-weight:700">Quản lý Khách hàng</h2>
      <div style="flex:1"></div>
      <button class="btn btn-sm btn-primary" onclick="openClientModal()">+ Thêm client</button>
    </div>
    <div class="card">
      <table>
        <thead><tr><th>Tên Client</th><th>Nhân viên</th><th>Chi phí</th><th>Chờ duyệt</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody id="cl-body"><tr><td colspan="6" class="loading">Đang tải...</td></tr></tbody>
      </table>
    </div>
  </div>

  <!-- EMPLOYEES TAB -->
  <div class="tab-panel" id="tab-employees">
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <h2 style="font-size:16px;font-weight:700">Nhân viên</h2>
      <div style="flex:1"></div>
      <button class="btn btn-sm btn-primary" onclick="openEmpModal()">+ Thêm nhân viên</button>
    </div>
    <div class="card">
      <div class="toolbar">
        <input type="text" id="emp-search" placeholder="Tìm tên / mã NV..." style="width:220px" oninput="filterEmployees()">
        <select id="emp-client-filter" onchange="filterEmployees()">
          <option value="">Tất cả clients</option>
        </select>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Mã NV</th><th>Họ tên</th><th>Client</th><th>PDPD</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
          <tbody id="emp-body"><tr><td colspan="6" class="loading">Đang tải...</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- REPORTS TAB -->
  <div class="tab-panel" id="tab-reports">
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <h2 style="font-size:16px;font-weight:700">Báo cáo</h2>
      <div style="flex:1"></div>
      <input type="date" id="rep-from">
      <input type="date" id="rep-to">
      <button class="btn btn-sm btn-ghost" onclick="loadReports()">Áp dụng</button>
    </div>
    <div class="metrics-row" id="rep-metrics">
      <div class="loading" style="grid-column:1/-1">Đang tải...</div>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="card-head"><h3>Chi phí theo Client</h3></div>
      <div id="rep-bars"><div class="loading">Đang tải...</div></div>
    </div>
  </div>

  <!-- BRANDING TAB -->
  <div class="tab-panel" id="tab-branding">
    <div style="max-width:560px">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:4px">Thương hiệu</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:20px">Tuỳ chỉnh logo, màu sắc và tên hiển thị trên báo cáo, xuất file và tài liệu PDF.</p>
      <div class="card" style="padding:20px">
        <div class="f-row">
          <label>URL Logo <span style="font-size:11px;color:var(--muted)">(URL công khai, khuyến nghị 200×60px)</span></label>
          <input type="url" id="br-logo" placeholder="https://cdn.example.com/logo.png">
        </div>
        <div id="br-logo-preview" style="margin-top:-6px;margin-bottom:14px;display:none">
          <img id="br-logo-img" src="" alt="Logo preview" style="max-height:48px;max-width:180px;object-fit:contain;border:1px solid var(--border);border-radius:4px;padding:4px">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="f-row" style="margin-bottom:0">
            <label>Màu chính <span style="font-size:11px;color:var(--muted)">(hex)</span></label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="color" id="br-color-picker" value="#1a56db" style="width:40px;height:34px;padding:2px;border:1px solid var(--border);border-radius:4px;cursor:pointer">
              <input type="text" id="br-primary" placeholder="#1a56db" style="flex:1">
            </div>
          </div>
          <div class="f-row" style="margin-bottom:0">
            <label>Màu phụ <span style="font-size:11px;color:var(--muted)">(hex)</span></label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="color" id="br-accent-picker" value="#1741b6" style="width:40px;height:34px;padding:2px;border:1px solid var(--border);border-radius:4px;cursor:pointer">
              <input type="text" id="br-accent" placeholder="#1741b6" style="flex:1">
            </div>
          </div>
        </div>
        <div class="f-row" style="margin-top:14px">
          <label>Tên hiển thị <span style="font-size:11px;color:var(--muted)">(xuất hiện trên PDF và báo cáo)</span></label>
          <input type="text" id="br-display-name" placeholder="Công ty TNHH Kế toán ABC" maxlength="200">
        </div>
        <div class="f-row">
          <label>Tiêu đề báo cáo <span style="font-size:11px;color:var(--muted)">(tùy chọn, tối đa 500 ký tự)</span></label>
          <input type="text" id="br-header" placeholder="Báo cáo chi phí doanh nghiệp" maxlength="500">
        </div>
        <div class="f-row">
          <label>Chân trang báo cáo <span style="font-size:11px;color:var(--muted)">(tùy chọn, hiển thị cuối PDF)</span></label>
          <input type="text" id="br-footer" placeholder="Mọi thắc mắc liên hệ: accounting@example.com" maxlength="500">
        </div>
        <div id="br-preview" style="margin-bottom:14px;padding:12px;background:var(--bg);border-radius:6px;border:1px solid var(--border);display:none">
          <div style="font-size:11px;color:var(--muted);margin-bottom:6px">Xem trước</div>
          <div id="br-preview-bar" style="height:6px;border-radius:3px;margin-bottom:8px;background:var(--brand)"></div>
          <div style="display:flex;align-items:center;gap:10px">
            <img id="br-preview-logo" src="" style="max-height:32px;max-width:100px;object-fit:contain;display:none">
            <span id="br-preview-name" style="font-weight:700;font-size:14px"></span>
          </div>
        </div>
        <div class="err-msg" id="br-err"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
          <button class="btn btn-sm btn-ghost" onclick="loadBranding()">Đặt lại</button>
          <button class="btn btn-sm btn-primary" onclick="saveBranding()">Lưu thay đổi</button>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- ADD CLIENT MODAL -->
<div class="modal-overlay" id="cl-modal">
  <div class="modal">
    <h3 id="cl-modal-title">Thêm Client</h3>
    <div class="f-row"><label>Tên công ty</label><input type="text" id="cl-name" placeholder="ABC Company"></div>
    <div class="err-msg" id="cl-err"></div>
    <div class="modal-footer">
      <button class="btn btn-sm btn-ghost" onclick="closeModal('cl-modal')">Hủy</button>
      <button class="btn btn-sm btn-primary" onclick="saveClient()">Lưu</button>
    </div>
  </div>
</div>

<!-- ADD EMPLOYEE MODAL -->
<div class="modal-overlay" id="emp-modal">
  <div class="modal">
    <h3 id="emp-modal-title">Thêm Nhân viên</h3>
    <div class="f-row"><label>Client</label>
      <select id="emp-client-sel"><option value="">-- Chọn client --</option></select>
    </div>
    <div class="f-row"><label>Mã nhân viên</label><input type="text" id="emp-id" placeholder="NV001"></div>
    <div class="f-row"><label>Họ và tên</label><input type="text" id="emp-name" placeholder="Nguyễn Văn A"></div>
    <div class="err-msg" id="emp-err"></div>
    <div class="modal-footer">
      <button class="btn btn-sm btn-ghost" onclick="closeModal('emp-modal')">Hủy</button>
      <button class="btn btn-sm btn-primary" onclick="saveEmployee()">Lưu</button>
    </div>
  </div>
</div>

<script>
const API = '/api';
let token = localStorage.getItem('partner_token') || '';
let allEmployees = [], allClients = [], editClientId = null, editEmpId = null;

function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtNum(n) { return Number(n || 0).toLocaleString('vi-VN'); }
function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('vi-VN') : '—'; }
function fmtVnd(v) { return fmtNum(v) + ' ₫'; }

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    ...opts,
  });
  if (res.status === 401) { logout(); throw new Error('Phiên đăng nhập hết hạn'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Yêu cầu thất bại');
  return data;
}

function toast(type, msg, durationMs = 4000) {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast toast-' + (type === 'success' ? 'ok' : type);
  el.innerHTML = \`<span style="flex:1">\${esc(msg)}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>\`;
  container.appendChild(el);
  setTimeout(() => el.remove(), durationMs);
}

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
    if (payload.role !== 'partner_admin') throw new Error('Chỉ dành cho Partner Admin');
    token = data.access_token;
    localStorage.setItem('partner_token', token);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    document.getElementById('partner-name').textContent = email;
    initApp();
  } catch(e) { document.getElementById('l-err').textContent = e.message; }
}

function logout() {
  token = ''; localStorage.removeItem('partner_token');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display = 'none';
}

function switchTab(name, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'reports') loadReports();
  if (name === 'branding') loadBranding();
}

async function initApp() {
  await Promise.all([loadDashboard(), loadClients(), loadEmployees()]);
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const d = await apiFetch('/partner/dashboard');
    document.getElementById('dash-metrics').innerHTML = [
      ['Khách hàng', d.totalClients, 'Đang quản lý'],
      ['Nhân viên', d.totalEmployees, 'Đang hoạt động'],
      ['Chi phí tháng này', d.expensesThisMonth, fmtVnd(d.totalAmountVnd) + ' tổng'],
      ['Chờ duyệt', d.pendingExpenses, 'Cần xử lý'],
    ].map(([l,v,s]) => \`<div class="metric-card"><div class="label">\${l}</div><div class="value">\${fmtNum(v)}</div><div class="sub">\${s}</div></div>\`).join('');
  } catch(e) {
    document.getElementById('dash-metrics').innerHTML = '<div style="color:var(--danger);grid-column:1/-1">' + e.message + '</div>';
  }
}

// ── CLIENTS ───────────────────────────────────────────────────────────────
async function loadClients() {
  try {
    allClients = await apiFetch('/partner/clients');
    renderClientTable('cl-body', true);
    renderClientTable('dash-clients', false);
    populateClientSelects();
  } catch(e) {
    document.getElementById('cl-body').innerHTML = '<tr><td colspan="6" style="color:var(--danger);padding:16px">' + e.message + '</td></tr>';
  }
}

function renderClientTable(tbodyId, showActions) {
  if (!allClients.length) {
    const cols = showActions ? 6 : 5;
    document.getElementById(tbodyId).innerHTML = \`<tr><td colspan="\${cols}">
      <div class="empty-state">
        <div class="es-icon">🏢</div>
        <div class="es-title">Chưa có khách hàng nào</div>
        <div class="es-sub">Thêm công ty đầu tiên để bắt đầu quản lý chi phí</div>
        \${showActions ? '<button class="btn btn-sm btn-primary" onclick="openClientModal()">+ Thêm khách hàng</button>' : ''}
      </div></td></tr>\`;
    return;
  }
  document.getElementById(tbodyId).innerHTML = allClients.map(c => \`
    <tr>
      <td>\${esc(c.name)}</td>
      <td>\${c.employee_count}</td>
      <td>\${c.expense_count}</td>
      <td>\${c.pending_count > 0 ? '<span class="badge b-warn">' + c.pending_count + '</span>' : '0'}</td>
      <td><span class="badge \${c.is_active?'b-ok':'b-off'}">\${c.is_active?'Hoạt động':'Dừng'}</span></td>
      \${showActions ? \`<td><div class="gap-r">
        <button class="btn btn-sm btn-ghost" onclick="editClient('\${c.id}','\${esc(c.name)}',\${c.is_active})">Sửa</button>
        <button class="btn btn-sm btn-ghost" onclick="toggleClient('\${c.id}',\${c.is_active})">\${c.is_active?'Dừng':'Kích hoạt'}</button>
      </div></td>\` : ''}
    </tr>\`).join('');
}

function populateClientSelects() {
  const opts = allClients.map(c => \`<option value="\${c.id}">\${esc(c.name)}</option>\`).join('');
  const filterOpts = '<option value="">Tất cả clients</option>' + opts;
  document.getElementById('emp-client-filter').innerHTML = filterOpts;
  document.getElementById('emp-client-sel').innerHTML = '<option value="">-- Chọn client --</option>' + opts;
}

function openClientModal(id, name, isActive) {
  editClientId = id || null;
  document.getElementById('cl-modal-title').textContent = id ? 'Sửa Client' : 'Thêm Client';
  document.getElementById('cl-name').value = name || '';
  document.getElementById('cl-err').textContent = '';
  document.getElementById('cl-modal').classList.add('on');
}
function editClient(id, name, isActive) { openClientModal(id, name, isActive); }

async function saveClient() {
  const name = document.getElementById('cl-name').value.trim();
  document.getElementById('cl-err').textContent = '';
  if (!name) { document.getElementById('cl-err').textContent = 'Vui lòng nhập tên công ty'; return; }
  try {
    if (editClientId) {
      await apiFetch('/partner/clients/' + editClientId, { method:'PATCH', body: JSON.stringify({ name }) });
      toast('ok', 'Đã cập nhật thông tin khách hàng');
    } else {
      await apiFetch('/partner/clients', { method:'POST', body: JSON.stringify({ name }) });
      toast('ok', 'Đã thêm khách hàng mới: ' + name);
    }
    closeModal('cl-modal');
    await loadClients();
  } catch(e) { document.getElementById('cl-err').textContent = e.message; }
}

async function toggleClient(id, isActive) {
  try {
    await apiFetch('/partner/clients/' + id, { method:'PATCH', body: JSON.stringify({ is_active: !isActive }) });
    toast('ok', isActive ? 'Đã tạm dừng khách hàng' : 'Đã kích hoạt khách hàng');
    await loadClients();
  } catch(e) { toast('error', e.message); }
}

// ── EMPLOYEES ─────────────────────────────────────────────────────────────
async function loadEmployees() {
  try {
    allEmployees = await apiFetch('/partner/employees');
    renderEmployees();
  } catch(e) {
    document.getElementById('emp-body').innerHTML = '<tr><td colspan="6" style="color:var(--danger);padding:16px">' + e.message + '</td></tr>';
  }
}

function filterEmployees() { renderEmployees(); }

function renderEmployees() {
  const search  = (document.getElementById('emp-search')?.value || '').toLowerCase();
  const clientF = document.getElementById('emp-client-filter')?.value || '';
  let data = allEmployees;
  if (search)  data = data.filter(e => e.full_name.toLowerCase().includes(search) || e.employee_id.toLowerCase().includes(search));
  if (clientF) data = data.filter(e => e.client_id === clientF);
  if (!data.length) {
    const isEmpty = !allEmployees.length;
    document.getElementById('emp-body').innerHTML = isEmpty
      ? \`<tr><td colspan="6"><div class="empty-state">
          <div class="es-icon">👤</div>
          <div class="es-title">Chưa có nhân viên nào</div>
          <div class="es-sub">Thêm nhân viên hoặc gửi link mời để họ tự đăng ký</div>
          <button class="btn btn-sm btn-primary" onclick="openEmpModal()">+ Thêm nhân viên</button>
        </div></td></tr>\`
      : '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted)">Không tìm thấy nhân viên phù hợp</td></tr>';
    return;
  }
  document.getElementById('emp-body').innerHTML = data.map(e => \`
    <tr>
      <td style="font-family:monospace;font-size:12px">\${esc(e.employee_id)}</td>
      <td>\${esc(e.full_name)}</td>
      <td style="font-size:12px">\${esc(e.client_name)}</td>
      <td><span class="badge \${e.pdpd_consent?'b-ok':'b-off'}">\${e.pdpd_consent?'Đã ký':'Chưa ký'}</span></td>
      <td><span class="badge \${e.is_active?'b-ok':'b-off'}">\${e.is_active?'Hoạt động':'Dừng hoạt động'}</span></td>
      <td><div class="gap-r">
        <button class="btn btn-sm btn-ghost" onclick="editEmployee('\${e.id}','\${esc(e.full_name)}','\${e.client_id}',\${e.is_active},\${e.pdpd_consent})">Sửa</button>
        <button class="btn btn-sm btn-ghost" onclick="toggleEmployee('\${e.id}',\${e.is_active})">\${e.is_active?'Dừng':'Kích hoạt'}</button>
      </div></td>
    </tr>\`).join('');
}

function openEmpModal() {
  editEmpId = null;
  document.getElementById('emp-modal-title').textContent = 'Thêm Nhân viên';
  ['emp-id','emp-name'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('emp-client-sel').value = '';
  document.getElementById('emp-err').textContent = '';
  document.getElementById('emp-modal').classList.add('on');
}

function editEmployee(id, name, clientId, isActive, pdpdConsent) {
  editEmpId = id;
  document.getElementById('emp-modal-title').textContent = 'Sửa Nhân viên';
  document.getElementById('emp-name').value = name;
  document.getElementById('emp-client-sel').value = clientId;
  document.getElementById('emp-err').textContent = '';
  document.getElementById('emp-modal').classList.add('on');
}

async function saveEmployee() {
  const clientId  = document.getElementById('emp-client-sel').value;
  const employeeId = document.getElementById('emp-id').value.trim();
  const name      = document.getElementById('emp-name').value.trim();
  document.getElementById('emp-err').textContent = '';
  if (!name) { document.getElementById('emp-err').textContent = 'Vui lòng nhập họ tên'; return; }
  try {
    if (editEmpId) {
      await apiFetch('/partner/employees/' + editEmpId, { method:'PATCH', body: JSON.stringify({ full_name: name }) });
    } else {
      if (!clientId) { document.getElementById('emp-err').textContent = 'Chọn client'; return; }
      if (!employeeId) { document.getElementById('emp-err').textContent = 'Nhập mã nhân viên'; return; }
      await apiFetch('/partner/employees', { method:'POST', body: JSON.stringify({ full_name: name, employee_id: employeeId, client_id: clientId }) });
    }
    const action = editEmpId ? 'Đã cập nhật thông tin nhân viên' : 'Đã thêm nhân viên: ' + name;
    closeModal('emp-modal');
    await loadEmployees();
    toast('ok', action);
  } catch(e) { document.getElementById('emp-err').textContent = e.message; }
}

async function toggleEmployee(id, isActive) {
  try {
    await apiFetch('/partner/employees/' + id, { method:'PATCH', body: JSON.stringify({ is_active: !isActive }) });
    toast('ok', isActive ? 'Đã tạm dừng nhân viên' : 'Đã kích hoạt nhân viên');
    await loadEmployees();
  } catch(e) { toast('error', e.message); }
}

// ── REPORTS ───────────────────────────────────────────────────────────────
async function loadReports() {
  const from = document.getElementById('rep-from').value;
  const to   = document.getElementById('rep-to').value;
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to)   params.set('to', to + 'T23:59:59Z');
  document.getElementById('rep-bars').innerHTML = '<div class="loading">Đang tải...</div>';
  document.getElementById('rep-metrics').innerHTML = '<div class="loading" style="grid-column:1/-1">Đang tải...</div>';
  try {
    const d = await apiFetch('/partner/reports?' + params);
    const totals = d.items.reduce((acc, r) => ({
      total: acc.total + r.total,
      pending: acc.pending + r.pending,
      approved: acc.approved + r.approved,
      rejected: acc.rejected + r.rejected,
    }), { total: 0, pending: 0, approved: 0, rejected: 0 });
    document.getElementById('rep-metrics').innerHTML = [
      ['Tổng chi phí', totals.total, 'Tất cả clients'],
      ['Đã duyệt', totals.approved, 'Trong kỳ'],
      ['Chờ duyệt', totals.pending, 'Cần xử lý'],
      ['Từ chối', totals.rejected, 'Trong kỳ'],
    ].map(([l,v,s]) => \`<div class="metric-card"><div class="label">\${l}</div><div class="value">\${fmtNum(v)}</div><div class="sub">\${s}</div></div>\`).join('');

    const max = Math.max(...d.items.map(r => r.total), 1);
    document.getElementById('rep-bars').innerHTML = d.items.length
      ? d.items.map(r => \`<div class="report-bar-row">
          <span style="min-width:140px;font-size:13px;font-weight:500">\${esc(r.client_name)}</span>
          <div class="r-bar"><div class="r-fill" style="width:\${Math.round(r.total/max*100)}%;background:var(--brand)"></div></div>
          <span style="font-size:12px;color:var(--muted);min-width:60px;text-align:right">\${fmtNum(r.total)}</span>
          <span class="badge b-warn" style="min-width:50px;text-align:center">\${r.pending} chờ</span>
        </div>\`).join('')
      : '<div style="text-align:center;padding:30px;color:var(--muted)">Không có dữ liệu trong kỳ này</div>';
  } catch(e) {
    document.getElementById('rep-bars').innerHTML = '<div style="color:var(--danger);padding:16px">' + e.message + '</div>';
  }
}

function closeModal(id) { document.getElementById(id).classList.remove('on'); }
document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('on'); }));

// ── BRANDING ──────────────────────────────────────────────────────────────
async function loadBranding() {
  document.getElementById('br-err').textContent = '';
  try {
    const b = await apiFetch('/branding');
    document.getElementById('br-logo').value        = b.logo_url || '';
    document.getElementById('br-primary').value     = b.primary_color || '#1a56db';
    document.getElementById('br-accent').value      = b.accent_color  || '#1741b6';
    document.getElementById('br-display-name').value = b.company_display_name || '';
    document.getElementById('br-header').value      = b.report_header || '';
    document.getElementById('br-footer').value      = b.report_footer || '';
    document.getElementById('br-color-picker').value  = b.primary_color || '#1a56db';
    document.getElementById('br-accent-picker').value = b.accent_color  || '#1741b6';
    updateBrandingPreview();
  } catch(e) { document.getElementById('br-err').textContent = e.message; }
}

async function saveBranding() {
  document.getElementById('br-err').textContent = '';
  const payload = {
    logo_url:             document.getElementById('br-logo').value.trim() || null,
    primary_color:        document.getElementById('br-primary').value.trim() || '#1a56db',
    accent_color:         document.getElementById('br-accent').value.trim()  || '#1741b6',
    company_display_name: document.getElementById('br-display-name').value.trim() || null,
    report_header:        document.getElementById('br-header').value.trim() || null,
    report_footer:        document.getElementById('br-footer').value.trim() || null,
  };
  try {
    await apiFetch('/branding', { method:'PUT', body: JSON.stringify(payload) });
    document.getElementById('br-err').innerHTML = '<span style="color:var(--ok)">✓ Đã lưu thành công</span>';
    // Apply branding to current SPA immediately
    document.documentElement.style.setProperty('--brand', payload.primary_color);
    document.documentElement.style.setProperty('--brand-accent', payload.accent_color);
    setTimeout(() => { document.getElementById('br-err').textContent = ''; }, 3000);
  } catch(e) { document.getElementById('br-err').textContent = e.message; }
}

function updateBrandingPreview() {
  const logoUrl = document.getElementById('br-logo').value.trim();
  const primary = document.getElementById('br-primary').value.trim() || '#1a56db';
  const name    = document.getElementById('br-display-name').value.trim();
  const preview = document.getElementById('br-preview');
  preview.style.display = (logoUrl || name) ? 'block' : 'none';
  document.getElementById('br-preview-bar').style.background = primary;
  const logoImg = document.getElementById('br-preview-logo');
  if (logoUrl) { logoImg.src = logoUrl; logoImg.style.display = 'block'; } else { logoImg.style.display = 'none'; }
  document.getElementById('br-preview-name').textContent = name;
  // Live logo large preview
  const lp = document.getElementById('br-logo-preview');
  if (logoUrl) { document.getElementById('br-logo-img').src = logoUrl; lp.style.display = 'block'; } else { lp.style.display = 'none'; }
}

// Sync color pickers ↔ hex inputs
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('br-color-picker').addEventListener('input', e => {
    document.getElementById('br-primary').value = e.target.value; updateBrandingPreview();
  });
  document.getElementById('br-accent-picker').addEventListener('input', e => {
    document.getElementById('br-accent').value = e.target.value;
  });
  ['br-logo','br-primary','br-accent','br-display-name'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateBrandingPreview);
  });
  document.getElementById('br-primary').addEventListener('change', e => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) document.getElementById('br-color-picker').value = e.target.value;
  });
});

const today = new Date().toISOString().slice(0,10);
const monthAgo = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
document.getElementById('rep-from').value = monthAgo;
document.getElementById('rep-to').value   = today;

if (token) {
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    if (p.role === 'partner_admin' && p.exp * 1000 > Date.now()) {
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-screen').style.display = 'block';
      document.getElementById('partner-name').textContent = p.sub || 'partner';
      initApp();
    } else { localStorage.removeItem('partner_token'); token = ''; }
  } catch { localStorage.removeItem('partner_token'); token = ''; }
}
</script>
<script src="/api/feedback/widget.js" defer></script>
</body>
</html>`;
}
//# sourceMappingURL=partner.html.js.map