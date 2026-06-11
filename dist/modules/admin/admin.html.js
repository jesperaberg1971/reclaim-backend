"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminDashboardHtml = buildAdminDashboardHtml;
function buildAdminDashboardHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — Super-Admin</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --brand:    #1a56db;
    --brand-lt: #eff6ff;
    --danger:   #dc2626;
    --warn:     #d97706;
    --ok:       #059669;
    --bg:       #f3f4f6;
    --card:     #ffffff;
    --border:   #e5e7eb;
    --text:     #111827;
    --muted:    #6b7280;
  }
  body { font-family: system-ui,-apple-system,sans-serif; font-size:14px; color:var(--text); background:var(--bg); min-height:100vh; }
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
  .f-row input { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:5px; font-size:14px; }
  .f-row input:focus { outline:none; border-color:var(--brand); }
  .btn { padding:8px 16px; border-radius:5px; border:none; font-size:13px; font-weight:500; cursor:pointer; }
  .btn-primary { background:var(--brand); color:#fff; width:100%; padding:10px; font-size:14px; }
  .btn-primary:hover { background:#1741b6; }
  .btn-sm { padding:4px 10px; font-size:12px; }
  .btn-danger { background:#fee2e2; color:var(--danger); }
  .btn-danger:hover { background:#fecaca; }
  .btn-ok { background:#d1fae5; color:var(--ok); }
  .btn-ok:hover { background:#a7f3d0; }
  .btn-ghost { background:var(--bg); color:var(--text); }
  .btn-ghost:hover { background:#e5e7eb; }
  .err-msg { color:var(--danger); font-size:12px; margin-top:8px; min-height:16px; }
  #app-screen { display:none; }
  .nav-tabs { background:var(--card); border-bottom:1px solid var(--border); padding:0 20px; display:flex; gap:2px; }
  .nav-tab { padding:12px 16px; font-size:13px; font-weight:500; cursor:pointer; border-bottom:2px solid transparent; color:var(--muted); }
  .nav-tab.active { color:var(--brand); border-bottom-color:var(--brand); }
  .nav-tab:hover { color:var(--text); }
  .tab-panel { display:none; padding:20px; }
  .tab-panel.active { display:block; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; }
  .card-head { padding:14px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; }
  .card-head h3 { font-size:14px; font-weight:600; }
  .card-head .spacer { flex:1; }
  .toolbar { padding:12px 16px; background:var(--bg); border-bottom:1px solid var(--border); display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .toolbar input, .toolbar select { padding:6px 10px; border:1px solid var(--border); border-radius:5px; font-size:13px; background:var(--card); }
  .toolbar input:focus, .toolbar select:focus { outline:none; border-color:var(--brand); }
  .bulk-bar { padding:10px 16px; background:#1e3a5f; color:#fff; display:none; align-items:center; gap:10px; font-size:13px; }
  .bulk-bar.on { display:flex; }
  table { width:100%; border-collapse:collapse; }
  th, td { padding:10px 14px; text-align:left; border-bottom:1px solid var(--border); font-size:13px; }
  th { font-size:12px; font-weight:600; color:var(--muted); background:#f9fafb; white-space:nowrap; }
  tr:hover td { background:#f9fafb; }
  .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:11px; font-weight:600; }
  .b-ok  { background:#d1fae5; color:#065f46; }
  .b-off { background:#f3f4f6; color:var(--muted); }
  .b-warn { background:#fef3c7; color:#92400e; }
  .b-danger { background:#fee2e2; color:#b91c1c; }
  .b-blue { background:var(--brand-lt); color:var(--brand); }
  .pagination { padding:12px 16px; display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); }
  .pagination button { padding:4px 10px; border:1px solid var(--border); border-radius:4px; background:var(--card); font-size:12px; cursor:pointer; }
  .pagination button:disabled { opacity:.4; cursor:default; }
  .metrics-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:20px; }
  .metric-card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:16px; }
  .metric-card .label { font-size:11px; color:var(--muted); font-weight:500; margin-bottom:6px; }
  .metric-card .value { font-size:24px; font-weight:700; }
  .metric-card .sub { font-size:11px; color:var(--muted); margin-top:4px; }
  .modal-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.4); z-index:100; align-items:center; justify-content:center; }
  .modal-overlay.on { display:flex; }
  .modal { background:var(--card); border-radius:8px; padding:24px; width:420px; max-width:90vw; }
  .modal h3 { font-size:16px; font-weight:700; margin-bottom:16px; }
  .modal-footer { margin-top:20px; display:flex; justify-content:flex-end; gap:8px; }
  .usage-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:16px; }
  .usage-item { }
  .usage-item .u-label { font-size:11px; color:var(--muted); }
  .usage-item .u-val { font-size:15px; font-weight:600; margin-top:2px; }
  .top-actions { padding:0; }
  .top-actions li { display:flex; align-items:center; padding:8px 16px; border-bottom:1px solid var(--border); gap:8px; }
  .top-actions li:last-child { border-bottom:none; }
  .ta-bar { flex:1; height:8px; background:#e5e7eb; border-radius:4px; overflow:hidden; }
  .ta-fill { height:100%; background:var(--brand); border-radius:4px; }
  .ta-count { font-size:12px; font-weight:600; color:var(--muted); min-width:40px; text-align:right; }
  .loading { text-align:center; padding:40px; color:var(--muted); }
  .text-link { color:var(--brand); cursor:pointer; text-decoration:none; }
  .text-link:hover { text-decoration:underline; }
  .gap-r { display:flex; gap:6px; }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  @media(max-width:600px) { .form-grid { grid-template-columns:1fr; } .nav-tab { padding:10px 10px; font-size:12px; } }
</style>
</head>
<body>
<div class="topbar">
  <h1>Reclaim! Super-Admin</h1>
  <div class="spacer"></div>
  <span id="admin-email" style="font-size:12px;opacity:.8"></span>
  <button class="logout" onclick="logout()">Đăng xuất</button>
</div>

<div id="login-screen">
  <div class="login-card">
    <h2>Đăng nhập Admin</h2>
    <div class="f-row"><label>Email</label><input type="email" id="l-email" placeholder="admin@example.com"></div>
    <div class="f-row"><label>Mật khẩu</label><input type="password" id="l-pass" placeholder="••••••••"></div>
    <button class="btn btn-primary" onclick="login()">Đăng nhập</button>
    <div class="err-msg" id="l-err"></div>
  </div>
</div>

<div id="app-screen">
  <div class="nav-tabs">
    <div class="nav-tab active" data-tab="tenants" onclick="switchTab('tenants',this)">Tenants</div>
    <div class="nav-tab" data-tab="users" onclick="switchTab('users',this)">Người dùng</div>
    <div class="nav-tab" data-tab="billing" onclick="switchTab('billing',this)">Billing</div>
    <div class="nav-tab" data-tab="audit" onclick="switchTab('audit',this)">Audit Log</div>
    <div class="nav-tab" data-tab="analytics" onclick="switchTab('analytics',this)">Analytics</div>
  </div>

  <!-- TENANTS TAB -->
  <div class="tab-panel active" id="tab-tenants">
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <h2 style="font-size:16px;font-weight:700">Quản lý Tenants</h2>
      <div class="spacer" style="flex:1"></div>
      <button class="btn btn-sm btn-ghost" onclick="openProvisionModal()">+ Tạo tenant mới</button>
    </div>
    <div class="card">
      <div class="toolbar">
        <input type="text" id="t-search" placeholder="Tìm tên / mã số thuế..." style="width:220px" oninput="debounceTenants()">
        <select id="t-active" onchange="loadTenants()">
          <option value="">Tất cả</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Tạm dừng</option>
        </select>
        <div class="spacer" style="flex:1"></div>
        <span id="t-count" style="font-size:12px;color:var(--muted)"></span>
      </div>
      <div class="bulk-bar" id="t-bulk">
        <span id="t-bulk-label">0 được chọn</span>
        <button class="btn btn-sm btn-ok" onclick="bulkTenants('activate')">Kích hoạt</button>
        <button class="btn btn-sm btn-danger" onclick="bulkTenants('deactivate')">Tạm dừng</button>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th style="width:32px"><input type="checkbox" id="t-chk-all" onchange="toggleAllTenants(this)"></th>
            <th>Tên</th><th>Mã số thuế</th><th>Tier</th><th>Clients</th><th>Users</th>
            <th>Trạng thái</th><th>Tạo lúc</th><th>Thao tác</th>
          </tr></thead>
          <tbody id="t-body"><tr><td colspan="9" class="loading">Đang tải...</td></tr></tbody>
        </table>
      </div>
      <div class="pagination">
        <button onclick="tPage(-1)" id="t-prev">‹ Trước</button>
        <span id="t-page-info"></span>
        <button onclick="tPage(1)" id="t-next">Sau ›</button>
      </div>
    </div>
  </div>

  <!-- USERS TAB -->
  <div class="tab-panel" id="tab-users">
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <h2 style="font-size:16px;font-weight:700">Quản lý Người dùng</h2>
      <div style="flex:1"></div>
      <button class="btn btn-sm btn-ghost" onclick="openCreateAdminModal()">+ Tạo Super Admin</button>
    </div>
    <div class="card">
      <div class="toolbar">
        <input type="text" id="u-search" placeholder="Tìm email..." style="width:200px" oninput="debounceUsers()">
        <select id="u-role" onchange="loadUsers()">
          <option value="">Tất cả vai trò</option>
          <option value="partner_admin">Partner Admin</option>
          <option value="client_admin">Client Admin</option>
          <option value="employee">Employee</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <select id="u-active" onchange="loadUsers()">
          <option value="">Tất cả</option>
          <option value="true">Đang hoạt động</option>
        </select>
        <div style="flex:1"></div>
        <span id="u-count" style="font-size:12px;color:var(--muted)"></span>
      </div>
      <div class="bulk-bar" id="u-bulk">
        <span id="u-bulk-label">0 được chọn</span>
        <button class="btn btn-sm btn-ok" onclick="bulkUsers('activate')">Kích hoạt</button>
        <button class="btn btn-sm btn-danger" onclick="bulkUsers('deactivate')">Tạm dừng</button>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th style="width:32px"><input type="checkbox" id="u-chk-all" onchange="toggleAllUsers(this)"></th>
            <th>Email</th><th>Vai trò</th><th>Tenant</th><th>Trạng thái</th><th>Tạo lúc</th><th>Thao tác</th>
          </tr></thead>
          <tbody id="u-body"><tr><td colspan="7" class="loading">Đang tải...</td></tr></tbody>
        </table>
      </div>
      <div class="pagination">
        <button onclick="uPage(-1)" id="u-prev">‹ Trước</button>
        <span id="u-page-info"></span>
        <button onclick="uPage(1)" id="u-next">Sau ›</button>
      </div>
    </div>
  </div>

  <!-- BILLING TAB -->
  <div class="tab-panel" id="tab-billing">
    <h2 style="font-size:16px;font-weight:700;margin-bottom:16px">Quản lý Billing</h2>
    <div class="card">
      <div class="toolbar">
        <input type="text" id="b-search" placeholder="Tìm tenant..." style="width:220px" oninput="debounceBilling()">
        <div style="flex:1"></div>
        <span id="b-count" style="font-size:12px;color:var(--muted)"></span>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>Tenant</th><th>Tier</th><th>Plan</th><th>Subscription</th>
            <th>Trial ends</th><th>Clients</th><th>Thao tác</th>
          </tr></thead>
          <tbody id="b-body"><tr><td colspan="7" class="loading">Đang tải...</td></tr></tbody>
        </table>
      </div>
      <div class="pagination">
        <button onclick="bPage(-1)" id="b-prev">‹ Trước</button>
        <span id="b-page-info"></span>
        <button onclick="bPage(1)" id="b-next">Sau ›</button>
      </div>
    </div>
  </div>

  <!-- AUDIT TAB -->
  <div class="tab-panel" id="tab-audit">
    <h2 style="font-size:16px;font-weight:700;margin-bottom:16px">Audit Log</h2>
    <div class="card">
      <div class="toolbar">
        <input type="text" id="al-action" placeholder="Action..." style="width:160px" oninput="debounceAudit()">
        <input type="date" id="al-from">
        <input type="date" id="al-to">
        <button class="btn btn-sm btn-ghost" onclick="loadAudit()">Lọc</button>
        <div style="flex:1"></div>
        <span id="al-count" style="font-size:12px;color:var(--muted)"></span>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>Thời gian</th><th>Tenant</th><th>User</th><th>Action</th><th>Resource</th><th>IP</th>
          </tr></thead>
          <tbody id="al-body"><tr><td colspan="6" class="loading">Đang tải...</td></tr></tbody>
        </table>
      </div>
      <div class="pagination">
        <button onclick="alPage(-1)" id="al-prev">‹ Trước</button>
        <span id="al-page-info"></span>
        <button onclick="alPage(1)" id="al-next">Sau ›</button>
      </div>
    </div>
  </div>

  <!-- ANALYTICS TAB -->
  <div class="tab-panel" id="tab-analytics">
    <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
      <h2 style="font-size:16px;font-weight:700">Analytics</h2>
      <div style="flex:1"></div>
      <input type="date" id="an-from">
      <input type="date" id="an-to">
      <button class="btn btn-sm btn-ghost" onclick="loadAnalytics()">Áp dụng</button>
    </div>
    <div class="metrics-row" id="an-metrics">
      <div class="loading" style="grid-column:1/-1">Đang tải...</div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Top Actions</h3></div>
      <ul class="top-actions" id="an-actions"></ul>
    </div>
  </div>
</div>

<!-- PROVISION MODAL -->
<div class="modal-overlay" id="prov-modal">
  <div class="modal">
    <h3>Tạo Tenant Mới</h3>
    <div class="form-grid">
      <div class="f-row"><label>Tên công ty</label><input type="text" id="prov-name" placeholder="ABC Corp"></div>
      <div class="f-row"><label>Mã số thuế</label><input type="text" id="prov-tax" placeholder="0123456789"></div>
      <div class="f-row"><label>Email Admin</label><input type="email" id="prov-email" placeholder="admin@abc.com"></div>
      <div class="f-row"><label>Mật khẩu Admin</label><input type="password" id="prov-pass" placeholder="min 8 ký tự"></div>
    </div>
    <div class="err-msg" id="prov-err"></div>
    <div class="modal-footer">
      <button class="btn btn-sm btn-ghost" onclick="closeModal('prov-modal')">Hủy</button>
      <button class="btn btn-sm btn-primary" onclick="provisionTenant()">Tạo</button>
    </div>
  </div>
</div>

<!-- CREATE ADMIN MODAL -->
<div class="modal-overlay" id="cadmin-modal">
  <div class="modal">
    <h3>Tạo Super Admin</h3>
    <div class="f-row"><label>Email</label><input type="email" id="ca-email" placeholder="admin@reclaim.vn"></div>
    <div class="f-row"><label>Mật khẩu</label><input type="password" id="ca-pass" placeholder="min 8 ký tự"></div>
    <div class="err-msg" id="ca-err"></div>
    <div class="modal-footer">
      <button class="btn btn-sm btn-ghost" onclick="closeModal('cadmin-modal')">Hủy</button>
      <button class="btn btn-sm btn-primary" onclick="createAdminUser()">Tạo</button>
    </div>
  </div>
</div>

<!-- USAGE MODAL -->
<div class="modal-overlay" id="usage-modal">
  <div class="modal" style="width:500px">
    <h3 id="usage-title">Chi tiết Tenant</h3>
    <div class="usage-grid" id="usage-grid"><div class="loading">Đang tải...</div></div>
    <div class="modal-footer"><button class="btn btn-sm btn-ghost" onclick="closeModal('usage-modal')">Đóng</button></div>
  </div>
</div>

<script>
const API = '/api';
let token = localStorage.getItem('admin_token') || '';

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('vi-VN');
}
function fmtNum(n) { return Number(n).toLocaleString('vi-VN'); }

async function apiFetch(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    ...opts,
  });
  if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
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
    if (!data.access_token) throw new Error(data.message || 'Login failed');
    const payload = JSON.parse(atob(data.access_token.split('.')[1]));
    if (payload.role !== 'super_admin') throw new Error('Access denied: super_admin only');
    token = data.access_token;
    localStorage.setItem('admin_token', token);
    document.getElementById('admin-email').textContent = email;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app-screen').style.display = 'block';
    loadTenants(); loadAnalytics();
  } catch(e) {
    document.getElementById('l-err').textContent = e.message;
  }
}

function logout() {
  token = '';
  localStorage.removeItem('admin_token');
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-screen').style.display = 'none';
}

function switchTab(name, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'tenants' && !tLoaded) loadTenants();
  if (name === 'users') loadUsers();
  if (name === 'billing') loadBilling();
  if (name === 'audit') loadAudit();
  if (name === 'analytics') loadAnalytics();
}

// ── TENANTS ──────────────────────────────────────────────────────────────────
let tOffset = 0, tTotal = 0, tLoaded = false, tSel = new Set();
const T_LIMIT = 20;
let tDebounce;
function debounceTenants() { clearTimeout(tDebounce); tDebounce = setTimeout(loadTenants, 350); }

async function loadTenants() {
  tOffset = 0; tSel.clear(); updateTBulk();
  const search = document.getElementById('t-search').value.trim();
  const active = document.getElementById('t-active').value;
  const params = new URLSearchParams({ limit: T_LIMIT, offset: 0 });
  if (search) params.set('search', search);
  if (active === 'true') params.set('activeOnly', 'true');
  document.getElementById('t-body').innerHTML = '<tr><td colspan="9" class="loading">Đang tải...</td></tr>';
  try {
    const { items, total } = await apiFetch('/admin/tenants?' + params);
    tTotal = total;
    tLoaded = true;
    renderTenants(items);
  } catch(e) {
    document.getElementById('t-body').innerHTML = '<tr><td colspan="9" style="color:var(--danger);padding:16px">' + e.message + '</td></tr>';
  }
}

function renderTenants(items) {
  const allChecked = document.getElementById('t-chk-all');
  allChecked.checked = false;
  document.getElementById('t-count').textContent = fmtNum(tTotal) + ' tenants';
  document.getElementById('t-page-info').textContent = (tOffset + 1) + '–' + Math.min(tOffset + T_LIMIT, tTotal) + ' / ' + tTotal;
  document.getElementById('t-prev').disabled = tOffset === 0;
  document.getElementById('t-next').disabled = tOffset + T_LIMIT >= tTotal;
  if (!items.length) {
    document.getElementById('t-body').innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:var(--muted)">Không tìm thấy</td></tr>';
    return;
  }
  document.getElementById('t-body').innerHTML = items.map(t => \`
    <tr>
      <td><input type="checkbox" class="t-chk" value="\${t.id}" onchange="onTChk(this)" \${tSel.has(t.id)?'checked':''}></td>
      <td><a class="text-link" onclick="showUsage('\${t.id}','\${esc(t.name)}')">\${esc(t.name)}</a></td>
      <td style="font-family:monospace;font-size:12px">\${esc(t.tax_code)}</td>
      <td><span class="badge b-blue">\${t.subscription_tier || '—'}</span></td>
      <td>\${t.client_count}</td>
      <td>\${t.user_count}</td>
      <td><span class="badge \${t.is_active?'b-ok':'b-off'}">\${t.is_active?'Hoạt động':'Dừng'}</span></td>
      <td style="font-size:12px">\${fmtDate(t.created_at)}</td>
      <td><div class="gap-r">
        <button class="btn btn-sm btn-ghost" onclick="toggleTenant('\${t.id}',\${t.is_active})">\${t.is_active?'Dừng':'Kích hoạt'}</button>
        <button class="btn btn-sm btn-ghost" onclick="showUsage('\${t.id}','\${esc(t.name)}')">Chi tiết</button>
      </div></td>
    </tr>\`).join('');
}

async function tPage(dir) {
  const newOffset = tOffset + dir * T_LIMIT;
  if (newOffset < 0 || newOffset >= tTotal) return;
  tOffset = newOffset;
  const search = document.getElementById('t-search').value.trim();
  const active = document.getElementById('t-active').value;
  const params = new URLSearchParams({ limit: T_LIMIT, offset: tOffset });
  if (search) params.set('search', search);
  if (active === 'true') params.set('activeOnly', 'true');
  const { items, total } = await apiFetch('/admin/tenants?' + params);
  tTotal = total;
  renderTenants(items);
}

function onTChk(cb) {
  if (cb.checked) tSel.add(cb.value); else tSel.delete(cb.value);
  updateTBulk();
}
function toggleAllTenants(cb) {
  document.querySelectorAll('.t-chk').forEach(c => {
    c.checked = cb.checked;
    if (cb.checked) tSel.add(c.value); else tSel.delete(c.value);
  });
  updateTBulk();
}
function updateTBulk() {
  const bar = document.getElementById('t-bulk');
  const n = tSel.size;
  bar.classList.toggle('on', n > 0);
  document.getElementById('t-bulk-label').textContent = n + ' được chọn';
}
async function bulkTenants(action) {
  if (!tSel.size || !confirm('Xác nhận ' + action + ' ' + tSel.size + ' tenant?')) return;
  try {
    const r = await apiFetch('/admin/tenants/bulk', { method:'POST', body: JSON.stringify({ action, ids: [...tSel] }) });
    alert('Đã ' + action + ' ' + r.affected + ' tenant');
    tSel.clear(); loadTenants();
  } catch(e) { alert(e.message); }
}
async function toggleTenant(id, isActive) {
  try {
    await apiFetch('/admin/tenants/' + id, { method:'PATCH', body: JSON.stringify({ is_active: !isActive }) });
    loadTenants();
  } catch(e) { alert(e.message); }
}

// ── USERS ────────────────────────────────────────────────────────────────────
let uOffset = 0, uTotal = 0, uSel = new Set();
const U_LIMIT = 20;
let uDebounce;
function debounceUsers() { clearTimeout(uDebounce); uDebounce = setTimeout(loadUsers, 350); }

async function loadUsers() {
  uOffset = 0; uSel.clear(); updateUBulk();
  const search = document.getElementById('u-search').value.trim();
  const role   = document.getElementById('u-role').value;
  const active = document.getElementById('u-active').value;
  const params = new URLSearchParams({ limit: U_LIMIT, offset: 0 });
  if (search) params.set('search', search);
  if (role)   params.set('role', role);
  if (active) params.set('activeOnly', 'true');
  document.getElementById('u-body').innerHTML = '<tr><td colspan="7" class="loading">Đang tải...</td></tr>';
  try {
    const { items, total } = await apiFetch('/admin/users?' + params);
    uTotal = total;
    renderUsers(items);
  } catch(e) {
    document.getElementById('u-body').innerHTML = '<tr><td colspan="7" style="color:var(--danger);padding:16px">' + e.message + '</td></tr>';
  }
}

function renderUsers(items) {
  document.getElementById('u-chk-all').checked = false;
  document.getElementById('u-count').textContent = fmtNum(uTotal) + ' users';
  document.getElementById('u-page-info').textContent = (uOffset + 1) + '–' + Math.min(uOffset + U_LIMIT, uTotal) + ' / ' + uTotal;
  document.getElementById('u-prev').disabled = uOffset === 0;
  document.getElementById('u-next').disabled = uOffset + U_LIMIT >= uTotal;
  if (!items.length) {
    document.getElementById('u-body').innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--muted)">Không tìm thấy</td></tr>';
    return;
  }
  const roleBadge = r => {
    const m = { super_admin:'b-danger', partner_admin:'b-blue', client_admin:'b-warn', employee:'b-off' };
    return '<span class="badge ' + (m[r]||'b-off') + '">' + r + '</span>';
  };
  document.getElementById('u-body').innerHTML = items.map(u => \`
    <tr>
      <td><input type="checkbox" class="u-chk" value="\${u.id}" onchange="onUChk(this)" \${uSel.has(u.id)?'checked':''}></td>
      <td>\${esc(u.email)}</td>
      <td>\${roleBadge(u.role)}</td>
      <td style="font-size:12px">\${esc(u.tenant_name||'—')}</td>
      <td><span class="badge \${u.is_active?'b-ok':'b-off'}">\${u.is_active?'Active':'Inactive'}</span></td>
      <td style="font-size:12px">\${fmtDate(u.created_at)}</td>
      <td><div class="gap-r">
        <button class="btn btn-sm btn-ghost" onclick="toggleUser('\${u.id}',\${u.is_active})">\${u.is_active?'Dừng':'Kích hoạt'}</button>
        <button class="btn btn-sm btn-ghost" onclick="promptResetPwd('\${u.id}','\${esc(u.email)}')">Đặt lại mật khẩu</button>
      </div></td>
    </tr>\`).join('');
}

async function uPage(dir) {
  const newOffset = uOffset + dir * U_LIMIT;
  if (newOffset < 0 || newOffset >= uTotal) return;
  uOffset = newOffset;
  const params = new URLSearchParams({ limit: U_LIMIT, offset: uOffset });
  const s = document.getElementById('u-search').value.trim();
  const r = document.getElementById('u-role').value;
  if (s) params.set('search', s);
  if (r) params.set('role', r);
  const { items, total } = await apiFetch('/admin/users?' + params);
  uTotal = total;
  renderUsers(items);
}

function onUChk(cb) { if (cb.checked) uSel.add(cb.value); else uSel.delete(cb.value); updateUBulk(); }
function toggleAllUsers(cb) {
  document.querySelectorAll('.u-chk').forEach(c => { c.checked = cb.checked; if (cb.checked) uSel.add(c.value); else uSel.delete(c.value); });
  updateUBulk();
}
function updateUBulk() {
  document.getElementById('u-bulk').classList.toggle('on', uSel.size > 0);
  document.getElementById('u-bulk-label').textContent = uSel.size + ' được chọn';
}
async function bulkUsers(action) {
  if (!uSel.size || !confirm('Xác nhận ' + action + ' ' + uSel.size + ' user?')) return;
  try {
    const r = await apiFetch('/admin/users/bulk', { method:'POST', body: JSON.stringify({ action, ids: [...uSel] }) });
    alert('Đã ' + action + ' ' + r.affected + ' user');
    uSel.clear(); loadUsers();
  } catch(e) { alert(e.message); }
}
async function toggleUser(id, isActive) {
  try {
    await apiFetch('/admin/users/' + id, { method:'PATCH', body: JSON.stringify({ is_active: !isActive }) });
    loadUsers();
  } catch(e) { alert(e.message); }
}
async function promptResetPwd(id, email) {
  const pwd = prompt('Mật khẩu mới cho ' + email + ' (min 8 ký tự):');
  if (!pwd || pwd.length < 8) return;
  try {
    await apiFetch('/admin/users/' + id + '/reset-password', { method:'POST', body: JSON.stringify({ newPassword: pwd }) });
    alert('Đã đặt lại mật khẩu');
  } catch(e) { alert(e.message); }
}

// ── BILLING ─────────────────────────────────────────────────────────────────
let bOffset = 0, bTotal = 0;
let bDebounce;
function debounceBilling() { clearTimeout(bDebounce); bDebounce = setTimeout(loadBilling, 350); }
async function loadBilling() {
  bOffset = 0;
  const search = document.getElementById('b-search').value.trim();
  const params = new URLSearchParams({ limit: 20, offset: 0 });
  if (search) params.set('search', search);
  document.getElementById('b-body').innerHTML = '<tr><td colspan="7" class="loading">Đang tải...</td></tr>';
  try {
    const { items, total } = await apiFetch('/admin/tenants?' + params);
    bTotal = total;
    document.getElementById('b-count').textContent = fmtNum(total) + ' tenants';
    document.getElementById('b-page-info').textContent = (bOffset+1) + '–' + Math.min(bOffset+20, total) + ' / ' + total;
    document.getElementById('b-prev').disabled = bOffset === 0;
    document.getElementById('b-next').disabled = bOffset + 20 >= total;
    const subMap = {};
    document.getElementById('b-body').innerHTML = items.map(t => \`
      <tr>
        <td>\${esc(t.name)}</td>
        <td><span class="badge b-blue">\${t.subscription_tier||'—'}</span></td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>\${t.client_count}</td>
        <td><a class="text-link" href="/api/subscription/billing" target="_blank">Billing</a></td>
      </tr>\`).join('');
  } catch(e) {
    document.getElementById('b-body').innerHTML = '<tr><td colspan="7" style="color:var(--danger);padding:16px">' + e.message + '</td></tr>';
  }
}
async function bPage(dir) {
  const no = bOffset + dir * 20;
  if (no < 0 || no >= bTotal) return;
  bOffset = no;
  const params = new URLSearchParams({ limit: 20, offset: bOffset });
  const { items, total } = await apiFetch('/admin/tenants?' + params);
  bTotal = total;
  document.getElementById('b-page-info').textContent = (bOffset+1) + '–' + Math.min(bOffset+20, total) + ' / ' + total;
  document.getElementById('b-prev').disabled = bOffset === 0;
  document.getElementById('b-next').disabled = bOffset + 20 >= total;
  document.getElementById('b-body').innerHTML = items.map(t => \`
    <tr>
      <td>\${esc(t.name)}</td><td><span class="badge b-blue">\${t.subscription_tier||'—'}</span></td>
      <td>—</td><td>—</td><td>—</td><td>\${t.client_count}</td>
      <td><a class="text-link" href="/api/subscription/billing" target="_blank">Billing</a></td>
    </tr>\`).join('');
}

// ── AUDIT ────────────────────────────────────────────────────────────────────
let alOffset = 0, alTotal = 0;
let alDebounce;
function debounceAudit() { clearTimeout(alDebounce); alDebounce = setTimeout(loadAudit, 350); }
async function loadAudit() {
  alOffset = 0;
  const action = document.getElementById('al-action').value.trim();
  const from   = document.getElementById('al-from').value;
  const to     = document.getElementById('al-to').value;
  const params = new URLSearchParams({ limit: 50, offset: 0 });
  if (action) params.set('action', action);
  if (from)   params.set('from', from);
  if (to)     params.set('to', to + 'T23:59:59Z');
  document.getElementById('al-body').innerHTML = '<tr><td colspan="6" class="loading">Đang tải...</td></tr>';
  try {
    const { items, total } = await apiFetch('/admin/audit-logs?' + params);
    alTotal = total;
    renderAudit(items);
  } catch(e) {
    document.getElementById('al-body').innerHTML = '<tr><td colspan="6" style="color:var(--danger);padding:16px">' + e.message + '</td></tr>';
  }
}
function renderAudit(items) {
  document.getElementById('al-count').textContent = fmtNum(alTotal) + ' events';
  document.getElementById('al-page-info').textContent = (alOffset+1) + '–' + Math.min(alOffset+50, alTotal) + ' / ' + alTotal;
  document.getElementById('al-prev').disabled = alOffset === 0;
  document.getElementById('al-next').disabled = alOffset + 50 >= alTotal;
  if (!items.length) { document.getElementById('al-body').innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--muted)">Không có dữ liệu</td></tr>'; return; }
  document.getElementById('al-body').innerHTML = items.map(r => \`
    <tr>
      <td style="font-size:11px;white-space:nowrap">\${new Date(r.created_at).toLocaleString('vi-VN')}</td>
      <td style="font-size:11px;font-family:monospace">\${(r.tenant_id||'—').slice(0,8)}</td>
      <td style="font-size:11px;font-family:monospace">\${(r.user_id||'—').slice(0,8)}</td>
      <td><span class="badge b-blue">\${esc(r.action)}</span></td>
      <td style="font-size:11px">\${esc(r.resource_type||'—')} \${r.resource_id ? '(' + r.resource_id.slice(0,8) + ')' : ''}</td>
      <td style="font-size:11px">\${esc(r.ip_address||'—')}</td>
    </tr>\`).join('');
}
async function alPage(dir) {
  const no = alOffset + dir * 50;
  if (no < 0 || no >= alTotal) return;
  alOffset = no;
  const action = document.getElementById('al-action').value.trim();
  const from   = document.getElementById('al-from').value;
  const to     = document.getElementById('al-to').value;
  const params = new URLSearchParams({ limit: 50, offset: alOffset });
  if (action) params.set('action', action);
  if (from)   params.set('from', from);
  if (to)     params.set('to', to + 'T23:59:59Z');
  const { items, total } = await apiFetch('/admin/audit-logs?' + params);
  alTotal = total;
  renderAudit(items);
}

// ── ANALYTICS ────────────────────────────────────────────────────────────────
async function loadAnalytics() {
  const from = document.getElementById('an-from') && document.getElementById('an-from').value;
  const to   = document.getElementById('an-to') && document.getElementById('an-to').value;
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to)   params.set('to', to);
  document.getElementById('an-metrics').innerHTML = '<div class="loading" style="grid-column:1/-1">Đang tải...</div>';
  try {
    const d = await apiFetch('/admin/analytics?' + params);
    document.getElementById('an-metrics').innerHTML = [
      ['Tổng Tenants', d.total_tenants, d.active_tenants + ' hoạt động'],
      ['Tổng Users', d.total_users, d.active_users + ' hoạt động'],
      ['Events (kỳ)', d.events_in_period, 'Trong khoảng đã chọn'],
      ['Tenants mới', d.new_tenants_in_period, 'Trong khoảng đã chọn'],
    ].map(([l,v,s]) => \`<div class="metric-card"><div class="label">\${l}</div><div class="value">\${fmtNum(v)}</div><div class="sub">\${s}</div></div>\`).join('');
    const max = d.top_actions[0]?.count || 1;
    document.getElementById('an-actions').innerHTML = d.top_actions.length
      ? d.top_actions.map(a => \`<li><span style="min-width:160px;font-size:13px">\${esc(a.action)}</span><div class="ta-bar"><div class="ta-fill" style="width:\${Math.round(a.count/max*100)}%"></div></div><span class="ta-count">\${fmtNum(a.count)}</span></li>\`).join('')
      : '<li style="color:var(--muted);font-size:13px">Không có dữ liệu</li>';
  } catch(e) {
    document.getElementById('an-metrics').innerHTML = '<div style="color:var(--danger);padding:16px;grid-column:1/-1">' + e.message + '</div>';
  }
}

// ── USAGE MODAL ───────────────────────────────────────────────────────────────
async function showUsage(id, name) {
  document.getElementById('usage-title').textContent = 'Chi tiết: ' + name;
  document.getElementById('usage-grid').innerHTML = '<div class="loading">Đang tải...</div>';
  document.getElementById('usage-modal').classList.add('on');
  try {
    const d = await apiFetch('/admin/tenants/' + id + '/usage');
    document.getElementById('usage-grid').innerHTML = [
      ['Tổng chi phí', fmtNum(d.total_expenses)],
      ['Chi phí tháng này', fmtNum(d.expenses_this_month)],
      ['Chờ duyệt', fmtNum(d.pending_expenses)],
      ['Đã duyệt', fmtNum(d.approved_expenses)],
      ['Tổng tiền (VND)', fmtNum(d.total_amount_vnd)],
      ['Tổng users', fmtNum(d.total_users)],
      ['Users hoạt động', fmtNum(d.active_users)],
      ['Subscription', d.subscription_status || '—'],
      ['Tier', d.subscription_tier || '—'],
      ['Hoạt động gần nhất', fmtDate(d.last_activity)],
    ].map(([l,v]) => \`<div class="usage-item"><div class="u-label">\${l}</div><div class="u-val">\${v}</div></div>\`).join('');
  } catch(e) {
    document.getElementById('usage-grid').innerHTML = '<div style="color:var(--danger)">' + e.message + '</div>';
  }
}

// ── MODALS ─────────────────────────────────────────────────────────────────
function openProvisionModal() {
  ['prov-name','prov-tax','prov-email','prov-pass'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('prov-err').textContent = '';
  document.getElementById('prov-modal').classList.add('on');
}
async function provisionTenant() {
  const name  = document.getElementById('prov-name').value.trim();
  const tax   = document.getElementById('prov-tax').value.trim();
  const email = document.getElementById('prov-email').value.trim();
  const pass  = document.getElementById('prov-pass').value;
  document.getElementById('prov-err').textContent = '';
  try {
    const r = await apiFetch('/admin/tenants/provision', { method:'POST', body: JSON.stringify({ name, tax_code: tax, admin_email: email, admin_password: pass }) });
    closeModal('prov-modal');
    alert('Đã tạo tenant: ' + r.partner.name + '\\nAdmin: ' + r.admin_user.email);
    loadTenants();
  } catch(e) { document.getElementById('prov-err').textContent = e.message; }
}
function openCreateAdminModal() {
  ['ca-email','ca-pass'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ca-err').textContent = '';
  document.getElementById('cadmin-modal').classList.add('on');
}
async function createAdminUser() {
  const email = document.getElementById('ca-email').value.trim();
  const pass  = document.getElementById('ca-pass').value;
  document.getElementById('ca-err').textContent = '';
  try {
    const r = await apiFetch('/admin/users/admin', { method:'POST', body: JSON.stringify({ email, password: pass }) });
    closeModal('cadmin-modal');
    alert('Đã tạo super admin: ' + r.email);
  } catch(e) { document.getElementById('ca-err').textContent = e.message; }
}
function closeModal(id) { document.getElementById(id).classList.remove('on'); }
document.querySelectorAll('.modal-overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('on'); }));

function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Init ───────────────────────────────────────────────────────────────────
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role === 'super_admin' && payload.exp * 1000 > Date.now()) {
      document.getElementById('admin-email').textContent = payload.sub || 'admin';
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app-screen').style.display = 'block';
      loadTenants(); loadAnalytics();
    } else { localStorage.removeItem('admin_token'); token = ''; }
  } catch { localStorage.removeItem('admin_token'); token = ''; }
}
// Set default date range for analytics (last 30 days)
const today = new Date().toISOString().slice(0,10);
const monthAgo = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
if (document.getElementById('an-from')) { document.getElementById('an-from').value = monthAgo; document.getElementById('an-to').value = today; }
</script>
</body>
</html>`;
}
//# sourceMappingURL=admin.html.js.map