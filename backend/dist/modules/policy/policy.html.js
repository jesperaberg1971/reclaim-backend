"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPolicyHtml = buildPolicyHtml;
function buildPolicyHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — Policy Management</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --brand:#1a56db;--brand-lt:#eff6ff;
    --ok:#059669;--warn:#d97706;--danger:#dc2626;
    --bg:#f3f4f6;--card:#fff;--border:#e5e7eb;
    --text:#111827;--muted:#6b7280;
  }
  body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:var(--text);background:var(--bg)}

  /* ── Layout ── */
  .topbar{background:var(--brand);color:#fff;height:48px;padding:0 20px;
          display:flex;align-items:center;gap:12px}
  .topbar h1{font-size:15px;font-weight:600}
  .topbar .sep{opacity:.3}
  .topbar .spacer{flex:1}
  .topbar .badge{background:rgba(255,255,255,.2);border-radius:10px;padding:2px 10px;font-size:12px}
  .logout-btn{font-size:12px;opacity:.8;cursor:pointer;padding:4px 10px;border-radius:4px;
              border:none;background:transparent;color:#fff}
  .logout-btn:hover{background:rgba(255,255,255,.15)}

  .page{max-width:860px;margin:28px auto;padding:0 20px}

  /* ── Policy cards ── */
  .section-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
                 color:var(--muted);margin-bottom:14px}
  .policy-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-bottom:24px}
  .policy-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:16px}
  .pc-label{font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;
            letter-spacing:.4px;margin-bottom:6px}
  .pc-gate{display:inline-block;font-size:10px;font-weight:700;padding:1px 7px;border-radius:8px;
           margin-bottom:8px}
  .gate-1{background:#dbeafe;color:#1d4ed8}
  .gate-2{background:#d1fae5;color:#065f46}
  .gate-3{background:#ede9fe;color:#5b21b6}
  .gate-all{background:#f3f4f6;color:#374151}
  .pc-input{width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;
            font-size:15px;font-weight:600;font-family:inherit;color:var(--text)}
  .pc-input:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 2px #bfdbfe}
  .pc-unit{font-size:11px;color:var(--muted);margin-top:4px}

  /* ── Actions ── */
  .action-bar{display:flex;gap:10px;align-items:center;margin-bottom:28px;flex-wrap:wrap}
  .btn{padding:8px 18px;border:none;border-radius:6px;font-size:13px;font-weight:600;
       cursor:pointer;transition:opacity .1s}
  .btn:hover{opacity:.85}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .btn-primary{background:var(--brand);color:#fff}
  .btn-ghost{background:#e5e7eb;color:var(--text)}
  .btn-ok{background:var(--ok);color:#fff}
  .btn-warn{background:var(--warn);color:#fff}
  .spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);
           border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  .save-note{font-size:12px;color:var(--muted)}

  /* ── Change history ── */
  .history-card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:28px}
  .history-empty{color:var(--muted);font-size:13px;padding:12px 0}
  .hist-row{border-bottom:1px solid #f3f4f6;padding:10px 0}
  .hist-row:last-child{border-bottom:none}
  .hist-meta{font-size:12px;color:var(--muted);margin-bottom:4px}
  .hist-changes{display:flex;flex-wrap:wrap;gap:6px}
  .hist-field{background:#f9fafb;border:1px solid var(--border);border-radius:4px;
              padding:3px 8px;font-size:12px}
  .hist-field .arrow{color:var(--muted);margin:0 4px}
  .hist-field .new-val{color:var(--ok);font-weight:600}

  /* ── Login ── */
  #login-screen{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg)}
  .login-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:32px;width:380px}
  .login-card h2{font-size:20px;font-weight:700;margin-bottom:4px}
  .login-card p{color:var(--muted);font-size:13px;margin-bottom:20px}
  .field-group{margin-bottom:12px}
  .field-group label{display:block;font-size:11px;font-weight:600;color:var(--muted);
                     margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px}
  .field-group input{width:100%;padding:8px 10px;border:1px solid var(--border);
                     border-radius:6px;font-size:13px;font-family:inherit}
  .field-group input:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 2px #bfdbfe}
  .err-msg{color:var(--danger);font-size:12px;margin-top:8px;min-height:18px}

  /* ── Toast ── */
  #toast-container{position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px}
  .toast{padding:12px 16px;border-radius:8px;font-size:13px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.14);
         max-width:360px;display:flex;align-items:flex-start;gap:10px;animation:toast-in .2s ease}
  @keyframes toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .toast-error{background:#fef2f2;border:1px solid #fca5a5;color:#7f1d1d}
  .toast-ok{background:#f0fdf4;border:1px solid #86efac;color:#14532d}
  .toast-info{background:#eff6ff;border:1px solid #93c5fd;color:#1e3a5f}
  .toast-close{margin-left:auto;cursor:pointer;opacity:.5;font-size:16px;background:none;border:none;padding:0 0 0 6px;color:inherit}

  /* ── Print ── */
  @media print {
    body{background:#fff}
    .topbar,.action-bar,#login-screen,.history-card{display:none!important}
    .page{margin:0;padding:0;max-width:100%}
    .policy-card{border:1px solid #ccc;break-inside:avoid}
    .pc-input{border:none;padding:0;font-size:16px}
    .print-header{display:block!important}
  }
  .print-header{display:none;margin-bottom:20px}
  .print-header h2{font-size:18px;font-weight:700}
  .print-header p{font-size:12px;color:#666;margin-top:4px}
</style>
</head>
<body>

<div id="toast-container"></div>

<!-- LOGIN -->
<div id="login-screen" style="display:none">
  <div class="login-card">
    <h2>Reclaim! Policy</h2>
    <p>Đăng nhập bằng tài khoản <strong>partner_admin</strong></p>
    <div class="field-group">
      <label>Email</label>
      <input id="l-email" type="email" placeholder="admin@firm.vn" autocomplete="username">
    </div>
    <div class="field-group">
      <label>Mật khẩu</label>
      <input id="l-pass" type="password" placeholder="••••••••" autocomplete="current-password"
             onkeydown="if(event.key==='Enter')doLogin()">
    </div>
    <button class="btn btn-primary" id="l-btn" onclick="doLogin()" style="width:100%">Đăng nhập</button>
    <div id="l-err" class="err-msg"></div>
  </div>
</div>

<!-- MAIN APP -->
<div id="app" style="display:none">
  <div class="topbar">
    <h1>Reclaim!</h1>
    <span class="sep">|</span>
    <span style="font-size:13px;opacity:.85">Policy Management</span>
    <span class="badge" id="hdr-partner"></span>
    <div class="spacer"></div>
    <button class="logout-btn" onclick="logout()">Đăng xuất</button>
  </div>

  <div class="page">

    <div class="print-header">
      <h2 id="print-partner-name">Chính sách chi phí</h2>
      <p id="print-date"></p>
    </div>

    <div style="margin-bottom:14px">
      <div class="section-title">Chính sách chi phí hiện hành</div>
    </div>

    <div class="policy-grid">
      <div class="policy-card">
        <div class="pc-label">Trần chi bữa ăn / biên lai</div>
        <span class="pc-gate gate-all">Gate 1 &amp; 2</span>
        <input class="pc-input" id="f-meal" type="number" min="0" max="5000000" step="1000">
        <div class="pc-unit">VND / biên lai</div>
      </div>
      <div class="policy-card">
        <div class="pc-label">Phụ cấp công tác / ngày</div>
        <span class="pc-gate gate-1">Gate 1</span>
        <input class="pc-input" id="f-perdiem" type="number" min="0" max="10000000" step="1000">
        <div class="pc-unit">VND / ngày (mặc định khi tạo quyết định)</div>
      </div>
      <div class="policy-card">
        <div class="pc-label">Hạn mức phúc lợi / tháng</div>
        <span class="pc-gate gate-2">Gate 2</span>
        <input class="pc-input" id="f-welfare" type="number" min="0" max="100000000" step="10000">
        <div class="pc-unit">VND / nhân viên / tháng</div>
      </div>
      <div class="policy-card">
        <div class="pc-label">Hạn mức thẻ cá nhân</div>
        <span class="pc-gate gate-3">Gate 3</span>
        <input class="pc-input" id="f-card" type="number" min="0" max="500000000" step="10000">
        <div class="pc-unit">VND / lần hoàn ứng</div>
      </div>
    </div>

    <div style="margin-bottom:14px">
      <div class="section-title">Quy tắc kiểm soát</div>
    </div>
    <div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:24px">
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">Loại chi phí được phép</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="cat-travel" value="travel_allowance">
            <span>Công tác phí (Gate 1)</span>
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="cat-welfare" value="welfare_allowance">
            <span>Phúc lợi nhân viên (Gate 2)</span>
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="cat-card" value="personal_card_reimbursement">
            <span>Hoàn ứng thẻ cá nhân (Gate 3)</span>
          </label>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:6px">Không chọn = tất cả loại được phép</div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">Yêu cầu biên lai gốc</div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="f-require-receipt">
          <span>Bắt buộc có ảnh biên lai — nếu thiếu sẽ chuyển sang hàng chờ duyệt thủ công</span>
        </label>
      </div>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
        <div style="font-size:12px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px">Phê duyệt quản lý</div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;margin-bottom:10px">
          <input type="checkbox" id="f-manager-approval" onchange="toggleEscalation()">
          <span>Yêu cầu quản lý đơn vị duyệt trước khi kế toán xử lý</span>
        </label>
        <div id="escalation-row" style="display:none;margin-left:24px;display:none">
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;flex-wrap:wrap">
            <span style="color:var(--muted);white-space:nowrap">Leo thang sau</span>
            <input type="number" id="f-escalation-hours" min="0" max="168" step="1"
                   style="width:70px;padding:5px 8px;border:1px solid var(--border);border-radius:5px;font-size:13px;font-family:inherit">
            <span style="color:var(--muted)">giờ không phản hồi (0 = không leo thang)</span>
          </label>
        </div>
      </div>
    </div>

    <div class="action-bar">
      <button class="btn btn-primary" id="save-btn" onclick="savePolicy()">Lưu thay đổi</button>
      <button class="btn btn-ghost" onclick="reloadPolicy()">Đặt lại</button>
      <button class="btn btn-ghost" onclick="window.print()">🖨️ In</button>
      <button class="btn btn-ghost" onclick="exportJson()">⬇️ Xuất JSON</button>
      <span class="save-note" id="save-note"></span>
    </div>

    <!-- Change history -->
    <div class="section-title">Lịch sử thay đổi (10 lần gần nhất)</div>
    <div class="history-card">
      <div id="history-body"><div class="history-empty">Đang tải…</div></div>
    </div>

    <!-- Version snapshots -->
    <div class="section-title" style="margin-top:8px">Lịch sử phiên bản</div>
    <div class="history-card">
      <div id="versions-body"><div class="history-empty">Đang tải…</div></div>
    </div>

  </div>
</div>

<script>
const FIELD_LABELS = {
  meal_cap_vnd:               'Trần bữa ăn',
  per_diem_daily_vnd:         'Phụ cấp / ngày',
  welfare_monthly_cap_vnd:    'Hạn mức phúc lợi',
  personal_card_limit_vnd:    'Hạn mức thẻ',
  allowed_categories:         'Loại được phép',
  require_original_receipt:   'Yêu cầu biên lai',
  require_manager_approval:   'Duyệt quản lý',
  approval_escalation_hours:  'Leo thang (giờ)',
};

let token = sessionStorage.getItem('policy_token');

window.onload = () => token ? bootApp() : bootLogin();

function bootLogin() {
  document.getElementById('login-screen').style.display = '';
  document.getElementById('app').style.display = 'none';
}
function bootApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = '';
  try {
    const p = JSON.parse(atob(token.split('.')[1]));
    document.getElementById('hdr-partner').textContent = p.role || '';
  } catch {}
  reloadPolicy();
  loadHistory();
  loadVersions();
}
function logout() {
  sessionStorage.removeItem('policy_token');
  token = null;
  bootLogin();
}

async function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  const err   = document.getElementById('l-err');
  const btn   = document.getElementById('l-btn');
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
    sessionStorage.setItem('policy_token', token);
    bootApp();
  } catch(e) {
    err.textContent = e.message;
  } finally { btn.disabled = false; btn.textContent = 'Đăng nhập'; }
}

async function api(path, opts = {}) {
  const r = await fetch('/api' + path, {
    ...opts,
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const d = await r.json();
  if (r.status === 401) { logout(); throw new Error('Session expired'); }
  if (!r.ok) throw new Error(d.message || 'HTTP ' + r.status);
  return d;
}

async function reloadPolicy() {
  try {
    const { partner_name, policy } = await api('/policy');
    document.getElementById('hdr-partner').textContent = partner_name || '';
    document.getElementById('print-partner-name').textContent = 'Chính sách chi phí — ' + partner_name;
    document.getElementById('print-date').textContent = 'Xuất lúc: ' + new Date().toLocaleString('vi-VN');
    document.getElementById('f-meal').value    = policy.meal_cap_vnd;
    document.getElementById('f-perdiem').value = policy.per_diem_daily_vnd;
    document.getElementById('f-welfare').value = policy.welfare_monthly_cap_vnd;
    document.getElementById('f-card').value    = policy.personal_card_limit_vnd;
    // Allowed categories checkboxes
    ['travel', 'welfare', 'card'].forEach(id => {
      document.getElementById('cat-' + id).checked = false;
    });
    (policy.allowed_categories || []).forEach(c => {
      const map = { travel_allowance: 'cat-travel', welfare_allowance: 'cat-welfare', personal_card_reimbursement: 'cat-card' };
      if (map[c]) document.getElementById(map[c]).checked = true;
    });
    document.getElementById('f-require-receipt').checked = !!policy.require_original_receipt;
    document.getElementById('f-manager-approval').checked = !!policy.require_manager_approval;
    document.getElementById('f-escalation-hours').value = policy.approval_escalation_hours ?? 0;
    toggleEscalation();
  } catch(e) {
    showToast('Lỗi tải policy: ' + e.message, 'error');
  }
}

async function savePolicy() {
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang lưu…';
  try {
    const catMap = { 'cat-travel': 'travel_allowance', 'cat-welfare': 'welfare_allowance', 'cat-card': 'personal_card_reimbursement' };
    const allowed_categories = Object.entries(catMap)
      .filter(([id]) => document.getElementById(id).checked)
      .map(([, v]) => v);
    const body = {
      meal_cap_vnd:             Number(document.getElementById('f-meal').value),
      per_diem_daily_vnd:       Number(document.getElementById('f-perdiem').value),
      welfare_monthly_cap_vnd:  Number(document.getElementById('f-welfare').value),
      personal_card_limit_vnd:  Number(document.getElementById('f-card').value),
      allowed_categories,
      require_original_receipt:  document.getElementById('f-require-receipt').checked,
      require_manager_approval:  document.getElementById('f-manager-approval').checked,
      approval_escalation_hours: Number(document.getElementById('f-escalation-hours').value) || 0,
    };
    await api('/policy', { method: 'PATCH', body: JSON.stringify(body) });
    document.getElementById('save-note').textContent =
      '✓ Đã lưu lúc ' + new Date().toLocaleTimeString('vi-VN');
    showToast('Chính sách đã được cập nhật', 'ok', 3000);
    loadHistory();
    loadVersions();
  } catch(e) {
    showToast('Lỗi lưu: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Lưu thay đổi';
  }
}

async function loadHistory() {
  try {
    const history = await api('/policy/history');
    const el = document.getElementById('history-body');
    if (!history.length) {
      el.innerHTML = '<div class="history-empty">Chưa có lịch sử thay đổi.</div>';
      return;
    }
    el.innerHTML = history.map(h => {
      const when = new Date(h.changed_at).toLocaleString('vi-VN');
      const who  = h.user_id ? h.user_id.slice(0, 8) + '…' : 'Hệ thống';
      const fieldHtml = Object.entries(h.changes).map(([k, v]) => {
        const label = FIELD_LABELS[k] || k;
        const prev  = h.previous[k] !== undefined ? fmtVal(h.previous[k]) : '?';
        return '<span class="hist-field">' + esc(label)
          + ': <span style="color:var(--muted)">' + esc(prev) + '</span>'
          + '<span class="arrow">→</span>'
          + '<span class="new-val">' + esc(fmtVal(v)) + '</span></span>';
      }).join('');
      return '<div class="hist-row">'
        + '<div class="hist-meta">' + esc(when) + ' — ' + esc(who) + '</div>'
        + '<div class="hist-changes">' + fieldHtml + '</div>'
        + '</div>';
    }).join('');
  } catch {}
}

async function loadVersions() {
  try {
    const versions = await api('/policy/versions');
    const el = document.getElementById('versions-body');
    if (!versions.length) {
      el.innerHTML = '<div class="history-empty">Chưa có phiên bản nào.</div>';
      return;
    }
    el.innerHTML = versions.map(v => {
      const when = new Date(v.created_at).toLocaleString('vi-VN');
      const who  = v.changed_by ? v.changed_by.slice(0, 8) + '…' : 'Hệ thống';
      const snap = v.snapshot;
      return '<div class="hist-row" style="display:flex;align-items:center;justify-content:space-between">'
        + '<div>'
        + '<div class="hist-meta">v' + v.version_number + ' — ' + esc(when) + ' — ' + esc(who) + '</div>'
        + '<div style="font-size:12px;color:var(--text);margin-top:2px">'
        + 'Bữa ăn: ' + fmtVnd(snap.meal_cap_vnd)
        + ' &nbsp;|&nbsp; Công tác: ' + fmtVnd(snap.per_diem_daily_vnd)
        + ' &nbsp;|&nbsp; Phúc lợi: ' + fmtVnd(snap.welfare_monthly_cap_vnd)
        + '</div>'
        + '</div>'
        + '<button class="btn btn-ghost" style="font-size:11px;padding:4px 12px" '
        + 'onclick="restoreVersion(' + v.version_number + ')">Khôi phục</button>'
        + '</div>';
    }).join('');
  } catch {}
}

async function restoreVersion(n) {
  if (!confirm('Khôi phục về phiên bản v' + n + '?')) return;
  try {
    await api('/policy/version/' + n + '/restore', { method: 'POST', body: '{}' });
    showToast('Đã khôi phục phiên bản v' + n, 'ok', 3000);
    reloadPolicy();
    loadHistory();
    loadVersions();
  } catch(e) {
    showToast('Lỗi khôi phục: ' + e.message, 'error');
  }
}

async function exportJson() {
  try {
    const data = await api('/policy/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'reclaim-policy-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch(e) {
    showToast('Lỗi xuất: ' + e.message, 'error');
  }
}

function toggleEscalation() {
  const on = document.getElementById('f-manager-approval').checked;
  document.getElementById('escalation-row').style.display = on ? '' : 'none';
}

function fmtVnd(n) { return Number(n).toLocaleString('vi-VN') + ' VND'; }
function fmtVal(v) {
  if (Array.isArray(v)) return v.length ? v.join(', ') : '(tất cả)';
  if (typeof v === 'boolean') return v ? 'Bật' : 'Tắt';
  return fmtVnd(v);
}
function fmt(v) { return fmtVnd(v); }
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(message, type = 'error', durationMs = 5000) {
  const icons = { error: '⛔', ok: '✅', info: 'ℹ️' };
  const div = document.createElement('div');
  div.className = 'toast toast-' + type;
  div.innerHTML = '<span>' + (icons[type] || '') + '</span>'
    + '<span style="flex:1">' + esc(message) + '</span>'
    + '<button class="toast-close" onclick="this.closest(\'.toast\').remove()">✕</button>';
  document.getElementById('toast-container').appendChild(div);
  if (durationMs > 0) setTimeout(() => div.remove(), durationMs);
}
</script>
</body>
</html>`;
}
//# sourceMappingURL=policy.html.js.map