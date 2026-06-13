"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAdminHtml = buildAdminHtml;
function buildAdminHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — HITL Review</title>
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
    --sidebar:  300px;
  }
  body { font-family: system-ui,-apple-system,sans-serif; font-size:14px; color:var(--text); background:var(--bg); }

  /* ── Layout ── */
  #app { display:flex; flex-direction:column; height:100vh; }
  .topbar { background:var(--brand); color:#fff; padding:0 20px; height:48px;
            display:flex; align-items:center; gap:12px; flex-shrink:0; }
  .topbar h1 { font-size:15px; font-weight:600; }
  .topbar .sep { opacity:.3; }
  .topbar .hdr-badge { background:rgba(255,255,255,.2); border-radius:10px;
                       padding:2px 10px; font-size:12px; font-weight:600; }
  .topbar .spacer { flex:1; }
  .topbar .logout-btn { font-size:12px; opacity:.8; cursor:pointer; padding:4px 10px;
                        border-radius:4px; transition:background .15s; border:none;
                        background:transparent; color:#fff; }
  .topbar .logout-btn:hover { background:rgba(255,255,255,.15); }
  .content { display:flex; flex:1; overflow:hidden; }

  /* ── Queue panel ── */
  .queue-panel { width:var(--sidebar); display:flex; flex-direction:column;
                 background:var(--card); border-right:1px solid var(--border); flex-shrink:0; }

  .filter-bar { padding:10px 12px; border-bottom:1px solid var(--border); background:var(--bg); }
  .filter-row { display:flex; gap:5px; margin-bottom:6px; align-items:center; }
  .filter-row:last-child { margin-bottom:0; }
  .filter-label { font-size:11px; color:var(--muted); white-space:nowrap; width:46px; flex-shrink:0; }
  .f-in  { flex:1; padding:5px 7px; border:1px solid var(--border); border-radius:5px;
           font-size:12px; background:var(--card); min-width:0; }
  .f-in:focus { outline:none; border-color:var(--brand); }
  .f-sel { padding:5px 6px; border:1px solid var(--border); border-radius:5px;
           font-size:12px; background:var(--card); flex:1; }
  .f-reset { font-size:11px; color:var(--brand); cursor:pointer; padding:3px 6px;
             border-radius:4px; white-space:nowrap; }
  .f-reset:hover { background:var(--brand-lt); }

  .queue-sel-bar { padding:6px 12px; display:flex; align-items:center; gap:7px;
                   border-bottom:1px solid var(--border); font-size:12px; color:var(--muted);
                   background:var(--bg); }
  .queue-sel-bar label { cursor:pointer; }

  .queue-list { flex:1; overflow-y:auto; }
  .queue-item { padding:10px 12px; border-bottom:1px solid var(--border);
                cursor:pointer; display:flex; gap:8px; align-items:flex-start; transition:background .1s; }
  .queue-item:hover  { background:#f9fafb; }
  .queue-item.active { background:var(--brand-lt); border-left:3px solid var(--brand); padding-left:9px; }
  .qi-check { margin-top:2px; flex-shrink:0; cursor:pointer; }
  .qi-body  { flex:1; min-width:0; }
  .qi-top   { display:flex; justify-content:space-between; align-items:center; gap:4px; }
  .qi-id    { font-size:10px; font-family:monospace; color:var(--muted); }
  .qi-conf  { font-size:10px; font-weight:700; padding:1px 6px; border-radius:8px; flex-shrink:0; }
  .c-lo { background:#fee2e2; color:#b91c1c; }
  .c-md { background:#fef3c7; color:#92400e; }
  .c-ok { background:#d1fae5; color:#065f46; }
  .qi-vendor { font-size:13px; font-weight:500; margin:2px 0;
               white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .qi-meta { font-size:11px; color:var(--muted); }
  .qi-tags { display:flex; flex-wrap:wrap; gap:3px; margin-top:4px; }
  .rtag { font-size:10px; padding:1px 5px; border-radius:4px;
          background:#fee2e2; color:#991b1b; font-weight:500; }
  .empty-q { text-align:center; padding:40px 16px; color:var(--muted); font-size:13px; }
  .empty-q .eq-icon { font-size:32px; display:block; margin-bottom:10px; }
  .empty-q .eq-title { font-size:15px; font-weight:700; color:#1f2937; margin-bottom:6px; }
  .empty-q .eq-sub   { font-size:13px; margin-bottom:14px; }
  .empty-q .eq-links { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
  .empty-q a.eq-cta  { display:inline-block; padding:8px 16px; border-radius:6px;
                        font-size:13px; font-weight:600; text-decoration:none;
                        background:#1a56db; color:#fff; }
  .empty-q a.eq-cta-ghost { background:#f3f4f6; color:#374151; }

  .bulk-bar { border-top:2px solid #1e3a5f; padding:10px 12px;
              background:#1e3a5f; color:#fff; display:none; flex-shrink:0; }
  .bulk-bar.on { display:block; }
  .bulk-lbl  { font-size:12px; margin-bottom:8px; opacity:.9; }
  .bulk-acts { display:flex; gap:6px; }

  /* ── Detail panel ── */
  .detail-panel { flex:1; overflow-y:auto; display:flex; flex-direction:column; min-width:0; }
  .metrics-strip { background:var(--card); border-bottom:1px solid var(--border);
                   padding:8px 20px; font-size:12px; display:flex; gap:16px; flex-wrap:wrap; align-items:center; }
  .m-refresh { margin-left:auto; color:var(--brand); cursor:pointer; }
  .m-refresh:hover { text-decoration:underline; }

  .detail-ph { display:flex; flex-direction:column; align-items:center;
               justify-content:center; flex:1; color:var(--muted); padding:60px 20px; text-align:center; }
  .detail-ph .ph-icon { font-size:48px; margin-bottom:12px; }
  .detail-body { padding:20px; }

  /* Expense header */
  .exp-hdr { display:flex; align-items:flex-start; justify-content:space-between;
             margin-bottom:16px; gap:12px; }
  .exp-title { font-size:16px; font-weight:700; }
  .exp-sub   { font-size:12px; color:var(--muted); margin-top:3px; }
  .s-chip { font-size:11px; font-weight:600; padding:3px 10px; border-radius:10px; white-space:nowrap; }
  .s-needs_review { background:#fef3c7; color:#92400e; }
  .s-complete     { background:#d1fae5; color:#065f46; }
  .s-approved     { background:#d1fae5; color:#065f46; }
  .s-rejected     { background:#fee2e2; color:#991b1b; }

  /* Two-column comparison */
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
  @media (max-width:960px) { .two-col { grid-template-columns:1fr; } }

  .card { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:14px; }
  .card-title { font-size:11px; font-weight:700; text-transform:uppercase;
                letter-spacing:.5px; color:var(--muted); margin-bottom:12px; }
  .ocr-row { display:flex; gap:8px; margin-bottom:8px; font-size:13px; align-items:baseline; }
  .ocr-row .k { color:var(--muted); font-size:11px; width:100px; flex-shrink:0; }
  .ocr-row .v { font-weight:500; }
  .conf-bar { height:6px; border-radius:3px; background:#e5e7eb; margin-top:5px; }
  .conf-fill { height:100%; border-radius:3px; }
  .f-chips { display:flex; flex-wrap:wrap; gap:4px; margin-top:10px; }
  .f-chip  { font-size:11px; padding:2px 7px; border-radius:4px;
             font-weight:500; background:#fee2e2; color:#991b1b; }
  .m-chip  { background:#fef3c7; color:#92400e; }

  .field-group { margin-bottom:12px; }
  .field-group label { display:block; font-size:11px; font-weight:600; color:var(--muted);
                       margin-bottom:4px; text-transform:uppercase; letter-spacing:.4px; }
  .field-group input { width:100%; padding:7px 10px; border:1px solid var(--border);
                       border-radius:6px; font-size:13px; font-family:inherit; }
  .field-group input:focus { outline:none; border-color:var(--brand); box-shadow:0 0 0 2px #bfdbfe; }

  .action-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:16px; }
  .btn { padding:8px 16px; border:none; border-radius:6px; font-size:13px; font-weight:500;
         cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:opacity .1s; }
  .btn:hover    { opacity:.85; }
  .btn:disabled { opacity:.45; cursor:not-allowed; }
  .btn-approve  { background:var(--ok);    color:#fff; }
  .btn-correct  { background:var(--brand); color:#fff; }
  .btn-reject   { background:var(--danger);color:#fff; }
  .btn-ghost    { background:#e5e7eb; color:var(--text); }
  .btn-sm       { padding:5px 11px; font-size:12px; }
  .btn-b-ok  { background:var(--ok);    color:#fff; }
  .btn-b-rej { background:var(--danger);color:#fff; }
  .btn-b-clr { background:rgba(255,255,255,.15); color:#fff; }

  .result-box  { padding:12px 14px; border-radius:8px; font-size:13px; line-height:1.7; margin-bottom:16px; }
  .r-approved  { background:#d1fae5; border:1px solid #6ee7b7; }
  .r-rejected  { background:#fef3c7; border:1px solid #fcd34d; }
  .r-error     { background:#fee2e2; border:1px solid #fca5a5; }

  details { border:1px solid var(--border); border-radius:6px; margin-bottom:12px; background:var(--card); }
  summary { padding:10px 14px; cursor:pointer; font-size:13px; font-weight:500;
            display:flex; align-items:center; gap:6px; user-select:none; }
  summary:hover { background:#f9fafb; border-radius:6px; }
  details[open] summary { border-bottom:1px solid var(--border); border-radius:6px 6px 0 0; }
  .raw-text { padding:12px 14px; font-size:12px; font-family:'Courier New',monospace;
              white-space:pre-wrap; max-height:220px; overflow-y:auto; color:#374151; border-radius:0 0 6px 6px; }
  .ent-table { width:100%; border-collapse:collapse; font-size:12px; }
  .ent-table th { text-align:left; padding:6px 14px; background:#f9fafb;
                  border-bottom:1px solid var(--border); font-weight:600; color:var(--muted); }
  .ent-table td { padding:5px 14px; border-bottom:1px solid #f3f4f6; }
  .ent-table tr:last-child td { border-bottom:none; }
  .dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:4px; }

  /* Receipt image states */
  .img-placeholder { padding:32px 20px; text-align:center; color:var(--muted);
                     background:var(--bg); border-radius:6px; font-size:13px; }
  .img-error { padding:14px 16px; background:#fee2e2; border:1px solid #fca5a5;
               border-radius:6px; font-size:13px; color:#991b1b; line-height:1.7; }

  /* Login */
  #login-screen { display:flex; align-items:center; justify-content:center;
                  min-height:100vh; background:var(--bg); }
  .login-card { background:var(--card); border:1px solid var(--border); border-radius:12px;
                padding:32px; width:380px; }
  .login-card h2 { font-size:20px; font-weight:700; margin-bottom:4px; }
  .login-card p  { color:var(--muted); font-size:13px; margin-bottom:20px; }
  .err-msg { color:var(--danger); font-size:12px; margin-top:8px; min-height:18px; }

  .spinner    { display:inline-block; width:14px; height:14px; border:2px solid #bfdbfe;
                border-top-color:var(--brand); border-radius:50%; animation:spin .6s linear infinite; }
  .spinner-lg { width:28px; height:28px; border-width:3px; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* ── Toasts ── */
  #toast-wrap{position:fixed;bottom:20px;right:20px;z-index:9999;
              display:flex;flex-direction:column;gap:8px;pointer-events:none}
  .toast{padding:11px 14px;border-radius:8px;font-size:13px;font-weight:500;max-width:360px;
         box-shadow:0 4px 16px rgba(0,0,0,.14);pointer-events:all;
         display:flex;align-items:flex-start;gap:9px;line-height:1.4;
         animation:toast-in .18s ease}
  @keyframes toast-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
  .t-ok   {background:#f0fdf4;border:1px solid #86efac;color:#14532d}
  .t-err  {background:#fef2f2;border:1px solid #fca5a5;color:#7f1d1d}
  .t-warn {background:#fffbeb;border:1px solid #fcd34d;color:#78350f}
  .t-info {background:#eff6ff;border:1px solid #93c5fd;color:#1e3a5f}
  .t-x{margin-left:auto;cursor:pointer;opacity:.5;font-size:15px;
       background:none;border:none;padding:0 0 0 6px;color:inherit;flex-shrink:0}
  .t-x:hover{opacity:1}

  /* ── Inline confirm dialog ── */
  .confirm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:500;
                   display:flex;align-items:center;justify-content:center}
  .confirm-card{background:var(--card);border-radius:10px;padding:24px;width:360px;
                box-shadow:0 8px 32px rgba(0,0,0,.18)}
  .confirm-title{font-size:15px;font-weight:700;margin-bottom:8px}
  .confirm-msg{font-size:13px;color:var(--muted);margin-bottom:16px;line-height:1.5}
  .confirm-input{width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;
                 font-size:13px;font-family:inherit;margin-bottom:14px}
  .confirm-input:focus{outline:none;border-color:var(--brand)}
  .confirm-btns{display:flex;gap:8px;justify-content:flex-end}
</style>
</head>
<body>
<div id="toast-wrap"></div>

<!-- LOGIN -->
<div id="login-screen" style="display:none">
  <div class="login-card">
    <h2>Reclaim! HITL Review</h2>
    <p>Đăng nhập bằng tài khoản <strong>partner_admin</strong></p>
    <div class="field-group">
      <label>Email</label>
      <input id="login-email" type="email" placeholder="admin@example.vn" autocomplete="username">
    </div>
    <div class="field-group">
      <label>Mật khẩu</label>
      <input id="login-pass" type="password" placeholder="••••••••" autocomplete="current-password"
             onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <button class="btn btn-correct" id="login-btn" onclick="doLogin()" style="width:100%">Đăng nhập</button>
    <div id="login-err" class="err-msg"></div>
  </div>
</div>

<!-- MAIN APP -->
<div id="app" style="display:none;flex-direction:column;height:100vh">

  <div class="topbar">
    <h1>Reclaim! HITL</h1>
    <span class="sep">|</span>
    <span style="font-size:13px;opacity:.85">Review Queue</span>
    <span class="hdr-badge" id="hdr-count">0</span>
    <div class="spacer"></div>
    <span id="hdr-role" style="font-size:12px;opacity:.7"></span>
    <button class="logout-btn" onclick="logout()">Đăng xuất</button>
  </div>

  <div class="content">

    <!-- QUEUE PANEL -->
    <div class="queue-panel">

      <!-- Filters -->
      <div class="filter-bar">
        <div class="filter-row">
          <span class="filter-label">Ngày</span>
          <input type="date" class="f-in" id="f-d0" oninput="applyFilters()" title="Từ ngày">
          <span style="font-size:11px;color:var(--muted)">–</span>
          <input type="date" class="f-in" id="f-d1" oninput="applyFilters()" title="Đến ngày">
        </div>
        <div class="filter-row">
          <span class="filter-label">Tin cậy</span>
          <input type="number" class="f-in" id="f-cmin" min="0" max="100" placeholder="0%"
                 style="width:46px;flex:none" oninput="applyFilters()">
          <span style="font-size:11px;color:var(--muted)">–</span>
          <input type="number" class="f-in" id="f-cmax" min="0" max="100" placeholder="100%"
                 style="width:46px;flex:none" oninput="applyFilters()">
          <select class="f-sel" id="f-sort" onchange="applyFilters()">
            <option value="date_desc">Mới nhất</option>
            <option value="date_asc">Cũ nhất</option>
            <option value="conf_asc">Tin cậy ↑</option>
            <option value="amt_desc">Số tiền ↓</option>
          </select>
        </div>
        <div class="filter-row">
          <span class="filter-label">Đơn vị</span>
          <input type="text" class="f-in" id="f-cli" placeholder="Tên công ty…" oninput="applyFilters()">
          <span class="f-reset" onclick="resetFilters()">✕ Xóa</span>
        </div>
      </div>

      <!-- Select-all bar -->
      <div class="queue-sel-bar">
        <input type="checkbox" id="sel-all" onchange="toggleAll(this.checked)">
        <label for="sel-all">Chọn tất cả</label>
        <span style="flex:1"></span>
        <span id="sel-lbl" style="display:none;color:var(--brand);font-weight:600"></span>
        <span id="q-spin" class="spinner" style="display:none;margin-left:4px"></span>
      </div>

      <div class="queue-list" id="q-list"></div>

      <!-- Bulk action bar -->
      <div class="bulk-bar" id="bulk-bar">
        <div class="bulk-lbl" id="bulk-lbl">0 đã chọn</div>
        <div class="bulk-acts">
          <button class="btn btn-sm btn-b-ok"  onclick="bulkApprove()">✅ Duyệt tất cả</button>
          <button class="btn btn-sm btn-b-rej" onclick="bulkReject()">❌ Từ chối tất cả</button>
          <button class="btn btn-sm btn-b-clr" onclick="clearSel()">Bỏ chọn</button>
        </div>
      </div>
    </div>

    <!-- DETAIL PANEL -->
    <div class="detail-panel" id="detail-panel">

      <div class="metrics-strip">
        <span id="m-total" style="color:var(--muted)">…</span>
        <span id="m-ok"   style="color:var(--ok)"></span>
        <span id="m-hitl" style="color:var(--warn)"></span>
        <span id="m-fail" style="color:var(--danger)"></span>
        <span id="m-rsn"  style="color:var(--muted)"></span>
        <span class="m-refresh" onclick="loadMetrics()">↻ Làm mới</span>
      </div>

      <div class="detail-ph" id="det-ph">
        <div class="ph-icon">📋</div>
        <p style="font-size:15px;font-weight:500;margin-bottom:6px">Chọn biên lai để bắt đầu</p>
        <p style="font-size:13px">Nhấn vào một mục trong hàng đợi để xem chi tiết và hiệu chỉnh.</p>
      </div>

      <div id="det-body" style="display:none" class="detail-body"></div>
    </div>

  </div>
</div>

<script>
// ── State ──────────────────────────────────────────────────────────────────
let token        = sessionStorage.getItem('hitl_token');
let allItems     = [];
let filtered     = [];
let selected     = new Set();
let currentId    = null;

// ── Boot ───────────────────────────────────────────────────────────────────
window.onload = () => token ? bootApp() : bootLogin();

function bootLogin() {
  document.getElementById('login-screen').style.display = '';
  document.getElementById('app').style.display = 'none';
}
function bootApp() {
  document.getElementById('login-screen').style.display = 'none';
  const app = document.getElementById('app');
  app.style.display = 'flex';
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('hdr-role').textContent = p.role || '';
  } catch {}
  loadQueue();
  loadMetrics();
}

// ── Auth ───────────────────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  const err   = document.getElementById('login-err');
  const btn   = document.getElementById('login-btn');
  err.textContent = '';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang đăng nhập…';
  try {
    const r    = await fetch('/api/auth/login', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password: pass }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || 'Đăng nhập thất bại');
    token = data.accessToken;
    sessionStorage.setItem('hitl_token', token);
    bootApp();
  } catch(e) {
    err.textContent = e.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Đăng nhập';
  }
}

function logout() {
  sessionStorage.removeItem('hitl_token');
  token = null; allItems = []; filtered = []; selected.clear(); currentId = null;
  bootLogin();
}

// ── API ────────────────────────────────────────────────────────────────────
async function api(path, opts={}) {
  const r = await fetch('/api' + path, {
    ...opts,
    headers: { Authorization:'Bearer '+token, 'Content-Type':'application/json', ...(opts.headers||{}) },
  });
  const d = await r.json();
  if (r.status===401) { logout(); throw new Error('Session expired'); }
  if (!r.ok) throw new Error(d.message || 'HTTP '+r.status);
  return d;
}

// ── Metrics ────────────────────────────────────────────────────────────────
async function loadMetrics() {
  try {
    const m = await api('/admin/ocr-metrics');
    document.getElementById('m-total').textContent = \`Tháng này — Tổng: \${m.total}\`;
    document.getElementById('m-ok').textContent   = m.outcomes.complete     ? \`✅ \${m.outcomes.complete} (\${(m.success_rate*100).toFixed(0)}%)\` : '';
    document.getElementById('m-hitl').textContent = m.outcomes.needs_review ? \`⚠️ HITL: \${m.outcomes.needs_review}\` : '';
    document.getElementById('m-fail').textContent = m.outcomes.failed       ? \`❌ Lỗi: \${m.outcomes.failed}\` : '';
    const top = Object.entries(m.failure_reasons||{}).sort((a,b)=>b[1]-a[1]).slice(0,2)
      .map(([k,v])=>\`\${k}:\${v}\`).join(' · ');
    document.getElementById('m-rsn').textContent  = top ? \`Nguyên nhân: \${top}\` : '';
  } catch { document.getElementById('m-total').textContent = 'Metrics N/A'; }
}

// ── Queue ──────────────────────────────────────────────────────────────────
async function loadQueue() {
  document.getElementById('q-spin').style.display = '';
  try {
    allItems = await api('/admin/queue');
    applyFilters();
  } catch(e) {
    document.getElementById('q-list').innerHTML =
      '<div class="empty-q" style="color:var(--danger)">Lỗi: '+esc(e.message)+'</div>';
  } finally { document.getElementById('q-spin').style.display='none'; }
}

function applyFilters() {
  const d0   = document.getElementById('f-d0').value;
  const d1   = document.getElementById('f-d1').value;
  const cmin = (parseFloat(document.getElementById('f-cmin').value)||0)/100;
  const cmax = (parseFloat(document.getElementById('f-cmax').value)||100)/100;
  const cli  = document.getElementById('f-cli').value.toLowerCase();
  const srt  = document.getElementById('f-sort').value;

  filtered = allItems.filter(it => {
    const ts = new Date(it.created_at);
    if (d0 && ts < new Date(d0)) return false;
    if (d1 && ts > new Date(d1+'T23:59:59')) return false;
    if (it.ocr_confidence < cmin || it.ocr_confidence > cmax) return false;
    if (cli && !(it.client_name||'').toLowerCase().includes(cli)) return false;
    return true;
  });

  filtered.sort((a,b) => {
    if (srt==='date_asc')  return new Date(a.created_at)-new Date(b.created_at);
    if (srt==='conf_asc')  return a.ocr_confidence-b.ocr_confidence;
    if (srt==='amt_desc')  return Number(b.original_amount)-Number(a.original_amount);
    return new Date(b.created_at)-new Date(a.created_at);
  });

  renderQueue();
}

function resetFilters() {
  ['f-d0','f-d1','f-cmin','f-cmax','f-cli'].forEach(id => document.getElementById(id).value='');
  document.getElementById('f-sort').value='date_desc';
  applyFilters();
}

function renderQueue() {
  document.getElementById('hdr-count').textContent = filtered.length;
  const el = document.getElementById('q-list');

  if (!filtered.length) {
    if (allItems.length) {
      // Items exist but nothing matches the active filters
      el.innerHTML = '<div class="empty-q">'
        +'<span class="eq-icon">🔍</span>'
        +'<div class="eq-title">Không có kết quả phù hợp</div>'
        +'<div class="eq-sub">Thử bỏ bớt bộ lọc hoặc mở rộng khoảng thời gian.</div>'
        +'<div class="eq-links">'
        +'<a class="eq-cta eq-cta-ghost" href="#" onclick="resetFilters();return false">Xóa bộ lọc</a>'
        +'</div></div>';
    } else {
      // Queue is genuinely empty
      el.innerHTML = '<div class="empty-q">'
        +'<span class="eq-icon">✅</span>'
        +'<div class="eq-title">Hàng đợi trống</div>'
        +'<div class="eq-sub">Tất cả biên lai đã được xử lý. Nhân viên có thể nộp biên lai mới qua trang di động.</div>'
        +'<div class="eq-links">'
        +'<a class="eq-cta" href="/api/mobile/guide" target="_blank">Hướng dẫn nhân viên →</a>'
        +'<a class="eq-cta eq-cta-ghost" href="/api/accounting/dashboard" target="_blank">Trang kế toán</a>'
        +'</div></div>';
    }
    return;
  }

  el.innerHTML = filtered.map(it => {
    const c   = it.ocr_confidence;
    const pct = Math.round(c*100);
    const cls = c<.35?'c-lo':c<.65?'c-md':'c-ok';
    const amt = Number(it.original_amount).toLocaleString('vi-VN');
    const dt  = new Date(it.created_at).toLocaleDateString('vi-VN');
    const chk = selected.has(it.id)?'checked':'';
    const act = currentId===it.id?'active':'';
    const tags= (it.failure_reasons||[]).slice(0,3)
      .map(r=>'<span class="rtag">'+r.replace(/_/g,' ')+'</span>').join('');

    return '<div class="queue-item '+act+'" id="qi-'+it.id+'" onclick="itemClick(event,\''+it.id+'\')">'
      +'<input type="checkbox" class="qi-check" '+chk+' onclick="event.stopPropagation();toggleOne(\''+it.id+'\',this.checked)">'
      +'<div class="qi-body">'
        +'<div class="qi-top"><span class="qi-id">'+it.id.slice(0,8)+'…</span>'
        +'<span class="qi-conf '+cls+'">'+pct+'%</span></div>'
        +'<div class="qi-vendor">'+esc(it.vendor||'Không rõ vendor')+'</div>'
        +'<div class="qi-meta">'+amt+' VND · '+dt+' · '+esc(it.client_name||'?')+'</div>'
        +(tags?'<div class="qi-tags">'+tags+'</div>':'')
      +'</div></div>';
  }).join('');
}

function itemClick(e, id) { if(e.target.type!=='checkbox') selectExpense(id); }

// ── Selection ──────────────────────────────────────────────────────────────
function toggleOne(id, on) {
  on ? selected.add(id) : selected.delete(id);
  syncBulkBar();
}
function toggleAll(on) {
  filtered.forEach(it => on ? selected.add(it.id) : selected.delete(it.id));
  syncBulkBar(); renderQueue();
}
function clearSel() {
  selected.clear();
  document.getElementById('sel-all').checked=false;
  syncBulkBar(); renderQueue();
}
function syncBulkBar() {
  const n = selected.size;
  document.getElementById('bulk-bar').classList.toggle('on', n>0);
  document.getElementById('bulk-lbl').textContent = n+' mục đã chọn';
  const lbl = document.getElementById('sel-lbl');
  if (n>0) { lbl.style.display=''; lbl.textContent=n+' đã chọn'; }
  else      { lbl.style.display='none'; }
}

// ── Bulk actions ───────────────────────────────────────────────────────────
async function bulkApprove() {
  if (!selected.size) return;
  showConfirm({
    title:      'Duyệt hàng loạt',
    message:    'Duyệt ' + selected.size + ' biên lai với dữ liệu OCR hiện tại?',
    confirmLabel: '✅ Duyệt tất cả',
    confirmClass: 'btn-approve',
    onConfirm:  () => runBulk('approve', ''),
  });
}
async function bulkReject() {
  if (!selected.size) return;
  showConfirm({
    title:       'Từ chối hàng loạt',
    message:     'Từ chối ' + selected.size + ' biên lai đã chọn?',
    inputLabel:  'Lý do (tuỳ chọn)',
    inputPlaceholder: 'Nhập lý do từ chối…',
    confirmLabel: '❌ Từ chối tất cả',
    confirmClass: 'btn-reject',
    onConfirm:   (notes) => runBulk('reject', notes || ''),
  });
}
async function runBulk(action, notes) {
  const ids = Array.from(selected);
  try {
    const res = await api('/admin/bulk-action', {
      method:'POST',
      body: JSON.stringify({ expenseIds:ids, action, reviewer_notes:notes }),
    });
    const s=res.succeeded?.length??0, f=res.failed?.length??0;
    if (f===0) {
      showToast('✅ Hoàn tất: '+s+' biên lai đã '+( action==='approve'?'duyệt':'từ chối')+'.', 'ok');
    } else {
      showToast('⚠️ '+s+' thành công, '+f+' thất bại. Xem lại hàng đợi.', 'warn');
    }
  } catch(e) { showToast('Lỗi: '+e.message, 'err'); }
  clearSel();
  await loadQueue();
  if (currentId && ids.includes(currentId)) {
    currentId=null;
    document.getElementById('det-ph').style.display='';
    document.getElementById('det-body').style.display='none';
  }
}

// ── Detail ─────────────────────────────────────────────────────────────────
async function selectExpense(id) {
  currentId = id;
  document.querySelectorAll('.queue-item').forEach(el=>el.classList.remove('active'));
  const qi = document.getElementById('qi-'+id);
  if (qi) qi.classList.add('active');
  document.getElementById('det-ph').style.display='none';
  const body = document.getElementById('det-body');
  body.style.display='';
  body.innerHTML='<div style="display:flex;align-items:center;justify-content:center;padding:60px;gap:10px">'
    +'<span class="spinner spinner-lg"></span></div>';
  try {
    const exp = await api('/admin/queue/'+id);
    renderDetail(exp);
  } catch(e) {
    body.innerHTML='<div class="empty-q" style="color:var(--danger)">Lỗi: '+esc(e.message)+'</div>';
  }
}

function renderDetail(exp) {
  const ocr   = exp.ocr_raw_json||{};
  const conf  = ocr.confidence??0;
  const pct   = Math.round(conf*100);
  const bc    = conf<.35?'#f87171':conf<.65?'#fbbf24':'#34d399';
  const amt   = Number(exp.original_amount).toLocaleString('vi-VN');
  const sub   = esc(exp.employee_name||'—')+' · '+esc(exp.client_name||'—')
              +' · Nộp: '+new Date(exp.created_at).toLocaleString('vi-VN');
  const iso   = ocr.date ? new Date(ocr.date).toISOString().slice(0,10) : '';
  const sCls  = 's-'+(exp.status||'needs_review');

  const fchips = (ocr.diagnostics?.failure_reasons||[])
    .map(r=>'<span class="f-chip">'+r.replace(/_/g,' ')+'</span>').join('');
  const mchips = (ocr.diagnostics?.missing_fields||[])
    .map(f=>'<span class="f-chip m-chip">'+f+'</span>').join('');

  const ents   = ocr.entities||[];
  const eRows  = ents.slice(0,20).map(e => {
    const dc = (e.confidence??0)>.8?'#10b981':(e.confidence??0)>.5?'#f59e0b':'#ef4444';
    return '<tr><td><span class="dot" style="background:'+dc+'"></span>'+esc(e.type||'?')+'</td>'
          +'<td>'+esc(e.mention||'—')+'</td>'
          +'<td>'+Math.round((e.confidence??0)*100)+'%</td></tr>';
  }).join('');

  const alreadyBanner = exp.already_processed
    ? '<div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px 14px;'
      +'margin-bottom:16px;font-size:13px">ℹ️ <strong>This item has already been processed</strong>'
      +' — Status: <strong>'+esc(exp.status||'')+'</strong>. Actions below will re-process it.</div>'
    : '';

  // ── Trip Decision PDF section (Gate 1 only) ──────────────────────────────
  const docs = exp.supporting_documents || [];
  const tripPdfEntry = docs.find(d => d.type === 'trip_decision_pdf');
  const pdfGenerated = tripPdfEntry?.status === 'generated' ? tripPdfEntry : null;
  const pdfQueued    = tripPdfEntry?.status === 'queued'    ? tripPdfEntry : null;
  const pdfFailed    = tripPdfEntry?.status === 'failed'    ? tripPdfEntry : null;
  const pdfHref      = pdfGenerated ? (pdfGenerated.signed_url || pdfGenerated.url) : null;

  const BADGE_BASE = 'font-size:11px;font-weight:700;padding:2px 9px;border-radius:10px;';
  const pdfBadge = pdfGenerated
    ? '<span style="'+BADGE_BASE+'background:#dcfce7;color:#166534">✓ Generated</span>'
    : pdfQueued
      ? '<span style="'+BADGE_BASE+'background:#dbeafe;color:#1e40af">⏳ In Progress</span>'
      : pdfFailed
        ? '<span style="'+BADGE_BASE+'background:#fee2e2;color:#991b1b">✗ Failed</span>'
        : '<span style="'+BADGE_BASE+'background:#fef9c3;color:#854d0e">⏳ Pending</span>';

  const pdfBody = pdfGenerated
    ? '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px">'
      +'<a href="'+escA(pdfHref)+'" target="_blank" '
      +'style="display:inline-flex;align-items:center;gap:6px;padding:7px 14px;'
      +'background:#1a56db;color:#fff;border-radius:6px;font-size:13px;font-weight:600;'
      +'text-decoration:none">⬇ Download PDF</a>'
      +(pdfGenerated.filename
        ? '<span style="font-size:12px;color:var(--muted)">'+esc(pdfGenerated.filename)+'</span>'
        : '')
      +'<span style="font-size:12px;color:var(--muted)">'
      +(pdfGenerated.generated_at ? 'Generated '+new Date(pdfGenerated.generated_at).toLocaleString('vi-VN') : '')
      +'</span>'
      +'</div>'
    : pdfQueued
      ? '<div style="margin-top:8px;font-size:12px;color:#1e40af">'
        +'PDF generation is in progress. Refresh in a few moments.'
        +'</div>'
      : pdfFailed
        ? '<div style="margin-top:8px;font-size:12px">'
          +'<div style="color:#7f1d1d"><strong>Error:</strong> '+esc(pdfFailed.error_message ?? 'Unknown error')+'</div>'
          +(pdfFailed.failed_at
            ? '<div style="color:#991b1b;margin-top:3px">Failed at '
              +new Date(pdfFailed.failed_at).toLocaleString('vi-VN')+'</div>'
            : '')
          +'<div style="color:#92400e;margin-top:4px">Will retry automatically.</div>'
          +'</div>'
        : '<div style="margin-top:8px;font-size:12px;color:#92400e">'
          +'Will be generated automatically when this expense passes Gate 1 processing.'
          +'</div>';

  const pdfSection = exp.gate_applied === 1
    ? '<div class="card" style="margin-bottom:16px">'
      +'<div style="display:flex;align-items:center;gap:10px">'
      +'<span class="card-title" style="margin:0">📄 Trip Decision PDF</span>'
      +pdfBadge
      +'</div>'
      +pdfBody
      +'</div>'
    : '';

  const imgUrl = exp.receipt_image_signed_url || exp.receipt_image_url || '';
  const imageSection = '<div class="card" style="margin-bottom:16px">'
    +'<div class="card-title">🧾 Original Receipt</div>'
    +(imgUrl
      ? '<img src="'+escA(imgUrl)+'" data-src="'+escA(imgUrl)+'" onerror="handleImgError(this)"'
        +' style="width:100%;max-width:600px;border-radius:6px;border:1px solid var(--border);display:block;cursor:zoom-in"'
        +' alt="Receipt image">'
        +'<div style="margin-top:10px">'
        +'<a href="'+escA(imgUrl)+'" target="_blank" class="btn btn-ghost btn-sm" style="text-decoration:none;font-size:12px">↗ Open in new tab</a>'
        +'</div>'
      : '<div class="img-placeholder">📎 No receipt image available</div>'
    )
    +'</div>';

  document.getElementById('det-body').innerHTML =
    alreadyBanner + pdfSection + imageSection +

    // Header
    '<div class="exp-hdr">'
      +'<div><div class="exp-title">Biên lai <span style="font-family:monospace;font-weight:400">'+exp.id.slice(0,8)+'…</span></div>'
      +'<div class="exp-sub">'+sub+'</div></div>'
      +'<span class="s-chip '+sCls+'">'+(exp.status||'').replace(/_/g,' ')+'</span>'
    +'</div>'

    // Two-column: OCR card + Correction form
    +'<div class="two-col">'

      // OCR card
      +'<div class="card"><div class="card-title">📊 Dữ liệu OCR gốc</div>'
      +'<div class="ocr-row"><span class="k">Độ tin cậy</span>'
        +'<span class="v" style="flex:1">'+pct+'%'
        +'<div class="conf-bar"><div class="conf-fill" style="width:'+pct+'%;background:'+bc+'"></div></div>'
        +'</span></div>'
      +'<div class="ocr-row"><span class="k">Vendor</span><span class="v">'+esc(ocr.vendor||'—')+'</span></div>'
      +'<div class="ocr-row"><span class="k">Số tiền</span><span class="v">'+amt+' '+(ocr.currency||'VND')+'</span></div>'
      +'<div class="ocr-row"><span class="k">Ngày</span><span class="v">'+(iso||'—')+'</span></div>'
      +'<div class="ocr-row"><span class="k">Xử lý</span><span class="v">'+(ocr.diagnostics?.processing_ms??'—')+' ms</span></div>'
      +((fchips||mchips)?'<div class="f-chips">'+fchips+mchips+'</div>':'')
      +'</div>'

      // Correction form
      +'<div class="card"><div class="card-title">✏️ Hiệu chỉnh</div>'
      +'<div class="field-group"><label>Vendor / Nhà cung cấp</label>'
        +'<input id="c-vendor" value="'+escA(ocr.vendor||'')+'" placeholder="Tên nhà cung cấp"></div>'
      +'<div class="field-group"><label>Số tiền (VND)</label>'
        +'<input id="c-amount" type="number" value="'+(ocr.amount||exp.original_amount||'')+'" placeholder="150000"></div>'
      +'<div class="field-group"><label>Ngày biên lai</label>'
        +'<input id="c-date" type="date" value="'+iso+'"></div>'
      +'<div class="field-group"><label>Ghi chú người duyệt</label>'
        +'<input id="c-notes" placeholder="Lý do hiệu chỉnh…"></div>'
      +'</div>'
    +'</div>'

    // Actions
    +'<div class="action-row">'
      +'<button class="btn btn-approve" onclick="quickApprove()">✅ Duyệt nhanh</button>'
      +'<button class="btn btn-correct" onclick="saveCorrection()">💾 Lưu &amp; xử lý</button>'
      +'<button class="btn btn-reject"  onclick="rejectOne()">❌ Từ chối</button>'
      +'<button class="btn btn-ghost btn-sm" onclick="loadQueue()" style="margin-left:auto">↩ Làm mới</button>'
    +'</div>'

    +'<div id="act-result"></div>'

    // Raw text
    +(ocr.rawText
      ?'<details><summary>📄 Văn bản thô ('+ocr.rawText.length+' ký tự)</summary>'
        +'<div class="raw-text">'+esc(ocr.rawText)+'</div></details>' : '')

    // Entities
    +(ents.length
      ?'<details><summary>🔍 Entities từ Document AI ('+ents.length+')</summary>'
        +'<table class="ent-table"><thead><tr><th>Loại</th><th>Giá trị</th><th>Tin cậy</th></tr></thead>'
        +'<tbody>'+eRows+(ents.length>20
          ?'<tr><td colspan="3" style="text-align:center;color:var(--muted)">… và '+(ents.length-20)+' nữa</td></tr>':'')
        +'</tbody></table></details>' : '')

    // Audit trail
    +(ocr.human_reviewed
      ?'<details><summary>🕵️ Lịch sử duyệt</summary>'
        +'<div style="padding:12px 14px;font-size:13px">'
        +'<div>Đã duyệt lúc: '+(ocr.reviewed_at||'—')+'</div>'
        +(ocr.reviewer_notes?'<div>Ghi chú: '+esc(ocr.reviewer_notes)+'</div>':'')
        +'</div></details>' : '');
}

// ── Image error handler ────────────────────────────────────────────────────
function handleImgError(img) {
  const url = img.getAttribute('data-src') || img.src;
  const div = document.createElement('div');
  div.className = 'img-error';
  div.innerHTML = '⚠️ Failed to load receipt image<br>'
    +'<small style="word-break:break-all;opacity:.8">'+esc(url)+'</small><br>'
    +'<a href="'+escA(url)+'" target="_blank" style="color:var(--danger);font-size:12px">Try opening directly →</a>';
  img.parentNode.replaceChild(div, img);
}

// ── Actions ────────────────────────────────────────────────────────────────
async function quickApprove() {
  if (!currentId) return;
  showConfirm({
    title:        'Duyệt nhanh',
    message:      'Duyệt biên lai này với dữ liệu OCR hiện tại (không hiệu chỉnh)?',
    confirmLabel: '✅ Duyệt',
    confirmClass: 'btn-approve',
    onConfirm:    () => postAction({}),
  });
}

async function saveCorrection() {
  if (!currentId) return;
  const vendor = document.getElementById('c-vendor').value.trim();
  const amount = parseFloat(document.getElementById('c-amount').value);
  const date   = document.getElementById('c-date').value;
  const notes  = document.getElementById('c-notes').value.trim();
  const body   = {};
  if (vendor)     body.vendor         = vendor;
  if (amount > 0) body.amount         = amount;
  if (date)       body.date           = new Date(date).toISOString();
  if (notes)      body.reviewer_notes = notes;
  await postAction(body);
}

async function rejectOne() {
  if (!currentId) return;
  showConfirm({
    title:       'Từ chối biên lai',
    message:     'Biên lai sẽ được đánh dấu từ chối và ghi nhận lý do.',
    inputLabel:  'Lý do từ chối (tuỳ chọn)',
    inputPlaceholder: 'Ví dụ: Không hợp lệ, trùng lặp…',
    confirmLabel: '❌ Từ chối',
    confirmClass: 'btn-reject',
    onConfirm: async (reason) => {
      setResult('<div style="display:flex;gap:8px;align-items:center"><span class="spinner"></span> Đang xử lý…</div>', '');
      try {
        await api('/admin/queue/'+currentId+'/reject', { method:'POST', body:JSON.stringify({reason:reason||''}) });
        setResult('<strong>❌ Đã từ chối.</strong>', 'r-rejected');
        await loadQueue();
        currentId=null;
        setTimeout(()=>{
          document.getElementById('det-ph').style.display='';
          document.getElementById('det-body').style.display='none';
        }, 1500);
      } catch(e) {
        setResult('<strong>Lỗi:</strong> '+esc(e.message), 'r-error');
      }
    },
  });
}

async function postAction(body) {
  setResult('<div style="display:flex;gap:8px;align-items:center"><span class="spinner"></span> Đang xử lý…</div>', '');
  try {
    const r  = await api('/admin/queue/'+currentId+'/correct', { method:'POST', body:JSON.stringify(body) });
    const ok = r.status==='approved'||r.status==='erp_exported';
    const gl = ['','Gate 1 — Công tác phí','Gate 2 — Phúc lợi','Gate 3 — Chi hộ'][r.gate]||'Gate '+r.gate;
    setResult(
      '<strong>'+(ok?'✅':'⚠️')+' '+gl+'</strong><br>'
      +Number(r.deductible_vnd).toLocaleString('vi-VN')+' VND khấu trừ<br>'
      +'Trạng thái: <strong>'+r.status+'</strong> · PIT: '+(r.pit_flag?'Có':'Không')+'<br>'
      +'<span style="font-size:12px;color:#6b7280">'+esc(r.reason)+'</span>',
      ok?'r-approved':'r-rejected'
    );
    await loadQueue();
  } catch(e) {
    setResult('<strong>❌ Lỗi:</strong> '+esc(e.message), 'r-error');
  }
}

function setResult(html, cls) {
  const el = document.getElementById('act-result');
  if (!el) return;
  el.innerHTML = cls
    ? '<div class="result-box '+cls+'" style="margin-top:0">'+html+'</div>'
    : '<div style="margin-top:12px">'+html+'</div>';
}

// ── Toasts ─────────────────────────────────────────────────────────────────
function showToast(message, type='info', ms=5000) {
  const icons = { ok:'✅', err:'⛔', warn:'⚠️', info:'ℹ️' };
  const div = document.createElement('div');
  div.className = 'toast t-'+(type==='error'?'err':type);
  div.innerHTML = '<span style="flex-shrink:0">'+icons[type]+'</span>'
    +'<span style="flex:1">'+esc(String(message))+'</span>'
    +'<button class="t-x" onclick="this.closest(\'.toast\').remove()">✕</button>';
  document.getElementById('toast-wrap').appendChild(div);
  if (ms>0) setTimeout(()=>div.remove(), ms);
}

// ── Inline confirm/prompt dialog ────────────────────────────────────────────
function showConfirm({ title, message, inputLabel, inputPlaceholder, confirmLabel, confirmClass, onConfirm }) {
  const ov = document.createElement('div');
  ov.className = 'confirm-overlay';
  const hasInput = Boolean(inputLabel);
  ov.innerHTML =
    '<div class="confirm-card">'
      +'<div class="confirm-title">'+esc(title)+'</div>'
      +'<div class="confirm-msg">'+esc(message)+'</div>'
      +(hasInput
        ? '<label style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:4px">'+esc(inputLabel)+'</label>'
          +'<input class="confirm-input" id="ci-input" placeholder="'+esc(inputPlaceholder||'')+'" autocomplete="off">'
        : '')
      +'<div class="confirm-btns">'
        +'<button id="ci-cancel" class="btn btn-ghost btn-sm">Huỷ</button>'
        +'<button id="ci-ok"     class="btn btn-sm '+esc(confirmClass||'btn-approve')+'">'+esc(confirmLabel||'Xác nhận')+'</button>'
      +'</div>'
    +'</div>';

  document.body.appendChild(ov);

  const close = () => ov.remove();
  ov.querySelector('#ci-cancel').onclick = close;
  ov.onclick = (e) => { if (e.target === ov) close(); };

  ov.querySelector('#ci-ok').onclick = async () => {
    const val = hasInput ? (ov.querySelector('#ci-input').value || '') : '';
    close();
    await onConfirm(val);
  };

  // Focus the input or the OK button
  const inp = ov.querySelector('#ci-input');
  if (inp) { inp.focus(); inp.onkeydown = (e) => { if (e.key==='Enter') ov.querySelector('#ci-ok').click(); }; }
  else ov.querySelector('#ci-ok').focus();
}

// ── Helpers ────────────────────────────────────────────────────────────────
function esc(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escA(s) { return String(s).replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
</script>
</body>
</html>`;
}
//# sourceMappingURL=admin.html.js.map