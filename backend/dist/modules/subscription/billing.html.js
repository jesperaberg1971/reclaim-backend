"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildBillingHtml = buildBillingHtml;
function buildBillingHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — Quản lý gói dịch vụ</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --brand:#1a56db;--brand-lt:#eff6ff;
    --ok:#059669;--warn:#d97706;--danger:#dc2626;--muted-bg:#f9fafb;
    --bg:#f3f4f6;--card:#fff;--border:#e5e7eb;
    --text:#111827;--muted:#6b7280;
  }
  body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:var(--text);background:var(--bg)}

  /* ── Topbar ── */
  .topbar{background:var(--brand);color:#fff;height:48px;padding:0 20px;
          display:flex;align-items:center;gap:12px}
  .topbar h1{font-size:15px;font-weight:600}
  .topbar .spacer{flex:1}
  .logout-btn{font-size:12px;opacity:.8;cursor:pointer;padding:4px 10px;border-radius:4px;
              border:none;background:transparent;color:#fff}
  .logout-btn:hover{background:rgba(255,255,255,.15)}

  /* ── Page layout ── */
  .page{max-width:860px;margin:28px auto;padding:0 20px}
  .page-title{font-size:20px;font-weight:700;margin-bottom:20px}

  /* ── Alert banners ── */
  .alert{border-radius:8px;padding:14px 18px;margin-bottom:20px;font-size:13px;line-height:1.6}
  .alert-warn{background:#fffbeb;border:1px solid #fde68a;color:#92400e}
  .alert-danger{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}
  .alert-ok{background:#f0fdf4;border:1px solid #bbf7d0;color:#065f46}
  .alert-info{background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af}
  .alert strong{font-weight:700}

  /* ── Cards ── */
  .card{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:20px;margin-bottom:20px}
  .card-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;
              color:var(--muted);margin-bottom:16px}

  /* ── Status badge ── */
  .status-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
  .s-trial{background:#dbeafe;color:#1e40af}
  .s-active{background:#d1fae5;color:#065f46}
  .s-grace{background:#fef3c7;color:#92400e}
  .s-overdue{background:#fee2e2;color:#991b1b}
  .s-cancelled{background:#f3f4f6;color:#6b7280}

  /* ── Plan info grid ── */
  .plan-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px;margin-bottom:20px}
  .plan-item label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;
                   color:var(--muted);display:block;margin-bottom:4px}
  .plan-item .value{font-size:16px;font-weight:700}
  .plan-item .sub{font-size:12px;color:var(--muted);margin-top:2px}

  /* ── Plan switcher ── */
  .plan-switch{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .plan-opt{display:flex;align-items:center;gap:8px;cursor:pointer;
            border:2px solid var(--border);border-radius:8px;padding:10px 16px;
            transition:border-color .15s,background .15s;user-select:none}
  .plan-opt.active{border-color:var(--brand);background:var(--brand-lt)}
  .plan-opt input{accent-color:var(--brand)}
  .plan-opt .label{font-weight:600;font-size:13px}
  .plan-opt .sub-label{font-size:11px;color:var(--muted)}

  /* ── Invoices table ── */
  table{width:100%;border-collapse:collapse}
  th{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;
     color:var(--muted);padding:8px 12px;text-align:left;border-bottom:2px solid var(--border)}
  td{padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px}
  .badge-pending{background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}
  .badge-paid{background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}
  .badge-void{background:#f3f4f6;color:#6b7280;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}
  .empty-row{text-align:center;color:var(--muted);padding:24px}

  /* ── Buttons ── */
  .btn{padding:8px 18px;border:none;border-radius:6px;font-size:13px;font-weight:600;
       cursor:pointer;transition:opacity .1s}
  .btn:hover:not(:disabled){opacity:.85}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .btn-primary{background:var(--brand);color:#fff}
  .btn-ghost{background:#e5e7eb;color:var(--text)}
  .btn-danger{background:var(--danger);color:#fff}
  .btn-ok{background:var(--ok);color:#fff}
  .btn-sm{padding:5px 12px;font-size:12px}
  .action-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:4px}

  /* ── Countdown ── */
  .countdown{font-size:24px;font-weight:800;color:var(--brand)}
  .countdown-label{font-size:12px;color:var(--muted);margin-top:2px}

  /* ── Login screen ── */
  #login-screen{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--bg)}
  .login-card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:32px;width:380px}
  .login-card h2{font-size:20px;font-weight:700;margin-bottom:4px}
  .login-card p{color:var(--muted);font-size:13px;margin-bottom:20px}
  .form-group{margin-bottom:14px}
  .form-group label{display:block;font-size:13px;font-weight:600;margin-bottom:4px}
  .form-group input{width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:6px;
                    font-size:14px;font-family:inherit}
  .form-group input:focus{outline:none;border-color:var(--brand);box-shadow:0 0 0 2px #bfdbfe}
  .err{color:var(--danger);font-size:12px;margin-top:8px}

  .spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);
           border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>

<!-- ── Login screen ─────────────────────────────────────────────── -->
<div id="login-screen" style="display:none">
  <div class="login-card">
    <h2>Đăng nhập</h2>
    <p>Quản lý gói dịch vụ Reclaim!</p>
    <div class="form-group">
      <label>Email</label>
      <input id="login-email" type="email" placeholder="admin@cty.vn" autocomplete="email">
    </div>
    <div class="form-group">
      <label>Mật khẩu</label>
      <input id="login-pwd" type="password" autocomplete="current-password">
    </div>
    <div class="err" id="login-err"></div>
    <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="doLogin()">Đăng nhập</button>
  </div>
</div>

<!-- ── Main app ─────────────────────────────────────────────────── -->
<div id="app" style="display:none">
  <div class="topbar">
    <h1>Reclaim! — Quản lý gói dịch vụ</h1>
    <div class="spacer"></div>
    <button class="logout-btn" onclick="doLogout()">Đăng xuất</button>
  </div>

  <div class="page">
    <div class="page-title">Gói dịch vụ &amp; Thanh toán</div>

    <!-- Alert banners (conditionally shown by JS) -->
    <div id="alert-trial" class="alert alert-info" style="display:none">
      <strong>Đang dùng thử.</strong> Gói dùng thử miễn phí còn <span id="trial-days"></span> ngày.
      Tạo hóa đơn ngay để tiếp tục sử dụng sau kỳ dùng thử.
    </div>
    <div id="alert-grace" class="alert alert-warn" style="display:none">
      <strong>⚠ Thời gian gia hạn.</strong> Gói dùng thử đã hết hạn. Bạn còn <span id="grace-days"></span> ngày
      trong thời gian gia hạn trước khi tài khoản bị khoá. Vui lòng thanh toán ngay.
    </div>
    <div id="alert-overdue" class="alert alert-danger" style="display:none">
      <strong>🔒 Tài khoản bị khoá.</strong> Gói dịch vụ đã quá hạn thanh toán.
      Liên hệ <a href="mailto:support@reclaim.vn">support@reclaim.vn</a> để kích hoạt lại.
    </div>
    <div id="alert-cancelled" class="alert alert-danger" style="display:none">
      <strong>Đã huỷ đăng ký.</strong> Gói dịch vụ đã bị huỷ.
      Nhấn "Kích hoạt lại" bên dưới để tiếp tục sử dụng.
    </div>

    <!-- Current plan card -->
    <div class="card">
      <div class="card-title">Thông tin gói hiện tại</div>
      <div class="plan-grid">
        <div class="plan-item">
          <label>Trạng thái</label>
          <div class="value" id="plan-status">—</div>
        </div>
        <div class="plan-item">
          <label>Gói</label>
          <div class="value" id="plan-tier">—</div>
          <div class="sub" id="plan-clients"></div>
        </div>
        <div class="plan-item">
          <label>Giá tháng</label>
          <div class="value" id="plan-price">—</div>
          <div class="sub" id="plan-discount" style="color:var(--ok)"></div>
        </div>
        <div class="plan-item">
          <label>Ngày thanh toán kế tiếp</label>
          <div class="value" id="plan-next-billing">—</div>
        </div>
      </div>

      <!-- Plan type switcher -->
      <div class="card-title" style="margin-top:16px">Chu kỳ thanh toán</div>
      <div class="plan-switch">
        <label class="plan-opt" id="opt-monthly" onclick="setPlan('monthly')">
          <input type="radio" name="plan" value="monthly">
          <div>
            <div class="label">Hằng tháng</div>
            <div class="sub-label" id="monthly-price">—/tháng</div>
          </div>
        </label>
        <label class="plan-opt" id="opt-annual" onclick="setPlan('annual')">
          <input type="radio" name="plan" value="annual">
          <div>
            <div class="label">Hằng năm <span style="background:#d1fae5;color:#065f46;padding:1px 6px;border-radius:8px;font-size:10px">Tiết kiệm 16%</span></div>
            <div class="sub-label" id="annual-price">—/năm</div>
          </div>
        </label>
      </div>

      <div class="action-row" style="margin-top:16px">
        <button id="btn-generate-invoice" class="btn btn-primary" onclick="generateInvoice()">
          Tạo hóa đơn mới
        </button>
        <button id="btn-cancel" class="btn btn-ghost" onclick="cancelSub()">
          Huỷ đăng ký
        </button>
        <button id="btn-reactivate" class="btn btn-ok" onclick="reactivateSub()" style="display:none">
          Kích hoạt lại
        </button>
      </div>
      <div id="action-msg" style="font-size:12px;color:var(--muted);margin-top:8px"></div>
    </div>

    <!-- Invoices card -->
    <div class="card">
      <div class="card-title">Lịch sử hóa đơn</div>
      <table>
        <thead>
          <tr>
            <th>Số hóa đơn</th>
            <th>Kỳ dịch vụ</th>
            <th>Số tiền</th>
            <th>Trạng thái</th>
            <th>Hạn thanh toán</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="invoice-tbody">
          <tr><td class="empty-row" colspan="6">Đang tải…</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script>
const API = '/api';
let token = localStorage.getItem('billing_token') || localStorage.getItem('authToken') || '';

// ── Boot ──────────────────────────────────────────────────────────────────────
window.onload = () => {
  if (token) { showApp(); }
  else       { showLogin(); }
};

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display          = 'none';
}

function showApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display          = 'block';
  loadStatus();
  loadInvoices();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-pwd').value;
  document.getElementById('login-err').textContent = '';
  try {
    const r = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pwd }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message || 'Đăng nhập thất bại');
    token = d.accessToken;
    localStorage.setItem('billing_token', token);
    showApp();
  } catch(e) {
    document.getElementById('login-err').textContent = e.message;
  }
}

function doLogout() {
  token = '';
  localStorage.removeItem('billing_token');
  showLogin();
}

// ── Status ────────────────────────────────────────────────────────────────────
async function loadStatus() {
  try {
    const r = await apiFetch('/subscription/status');
    if (!r.ok) { if (r.status === 401) { doLogout(); return; } return; }
    const d = await r.json();
    renderStatus(d);
  } catch {}
}

function renderStatus(d) {
  // Status badge
  const statusMap = {
    trial:     ['Dùng thử',          's-trial'],
    active:    ['Đang hoạt động',    's-active'],
    grace:     ['Thời gian gia hạn', 's-grace'],
    overdue:   ['Quá hạn',           's-overdue'],
    cancelled: ['Đã huỷ',            's-cancelled'],
  };
  const [label, cls] = statusMap[d.status] || [d.status, ''];
  document.getElementById('plan-status').innerHTML =
    '<span class="status-badge ' + cls + '">' + label + '</span>';

  const tierNames = {
    micro: 'Micro', small: 'Small', medium: 'Medium', large: 'Large', enterprise: 'Enterprise',
  };
  document.getElementById('plan-tier').textContent = tierNames[d.tier] || d.tier;
  document.getElementById('plan-clients').textContent = d.clientCount + ' khách hàng';

  const fmt = v => Number(v).toLocaleString('vi-VN') + ' ₫';
  const mp  = Number(d.discountedPriceVnd || d.monthlyPriceVnd);
  document.getElementById('plan-price').textContent = fmt(mp) + '/tháng';
  document.getElementById('monthly-price').textContent = fmt(mp) + '/tháng';
  document.getElementById('annual-price').textContent = fmt(mp * 10) + '/năm';

  if (d.discountPercentage > 0) {
    document.getElementById('plan-discount').textContent =
      'Giảm ' + d.discountPercentage + '% (beta pilot)';
  }

  if (d.nextBillingDate) {
    document.getElementById('plan-next-billing').textContent =
      new Date(d.nextBillingDate).toLocaleDateString('vi-VN');
  }

  // Plan type toggle
  const optM = document.getElementById('opt-monthly');
  const optA = document.getElementById('opt-annual');
  if (d.planType === 'annual') {
    optA.classList.add('active'); optM.classList.remove('active');
    optA.querySelector('input').checked = true;
  } else {
    optM.classList.add('active'); optA.classList.remove('active');
    optM.querySelector('input').checked = true;
  }

  // Alert banners
  const now = Date.now();
  document.getElementById('alert-trial').style.display     = d.status === 'trial'     ? '' : 'none';
  document.getElementById('alert-grace').style.display     = d.status === 'grace'     ? '' : 'none';
  document.getElementById('alert-overdue').style.display   = d.status === 'overdue'   ? '' : 'none';
  document.getElementById('alert-cancelled').style.display = d.status === 'cancelled' ? '' : 'none';

  if (d.status === 'trial' && d.trialEndsAt) {
    const days = Math.max(0, Math.ceil((new Date(d.trialEndsAt) - now) / 86400000));
    document.getElementById('trial-days').textContent = days;
  }
  if (d.status === 'grace' && d.gracePeriodEndsAt) {
    const days = Math.max(0, Math.ceil((new Date(d.gracePeriodEndsAt) - now) / 86400000));
    document.getElementById('grace-days').textContent = days;
  }

  // Show/hide cancel vs reactivate
  const isCancelled = d.status === 'cancelled';
  document.getElementById('btn-cancel').style.display     = isCancelled ? 'none' : '';
  document.getElementById('btn-reactivate').style.display = isCancelled ? '' : 'none';
}

// ── Plan change ───────────────────────────────────────────────────────────────
async function setPlan(planType) {
  const r = await apiFetch('/subscription/plan', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ plan_type: planType }),
  });
  if (r.ok) { loadStatus(); setMsg('Cập nhật chu kỳ thành công!'); }
}

// ── Cancel / Reactivate ───────────────────────────────────────────────────────
async function cancelSub() {
  if (!confirm('Bạn có chắc muốn huỷ đăng ký? Bạn vẫn có thể kích hoạt lại sau.')) return;
  const r = await apiFetch('/subscription/cancel', { method: 'POST' });
  if (r.ok) { loadStatus(); setMsg('Đã huỷ đăng ký.'); }
}

async function reactivateSub() {
  const r = await apiFetch('/subscription/reactivate', { method: 'POST' });
  if (r.ok) { loadStatus(); loadInvoices(); setMsg('Đã kích hoạt lại. Hóa đơn mới đã được tạo.'); }
}

// ── Invoice management ────────────────────────────────────────────────────────
async function loadInvoices() {
  try {
    const r = await apiFetch('/subscription/invoices');
    if (!r.ok) return;
    const invoices = await r.json();
    renderInvoices(invoices);
  } catch {}
}

function renderInvoices(list) {
  const tbody = document.getElementById('invoice-tbody');
  if (!list.length) {
    tbody.innerHTML = '<tr><td class="empty-row" colspan="6">Chưa có hóa đơn nào</td></tr>';
    return;
  }
  const fmtDate = d => new Date(d).toLocaleDateString('vi-VN');
  const fmtVnd  = v => Number(v).toLocaleString('vi-VN') + ' ₫';
  const badgeMap = { pending: 'badge-pending', paid: 'badge-paid', void: 'badge-void' };
  const labelMap = { pending: 'Chờ TT', paid: 'Đã TT', void: 'Đã huỷ' };

  tbody.innerHTML = list.map(inv => {
    const b  = badgeMap[inv.status] || '';
    const lb = labelMap[inv.status] || inv.status;
    const dl = inv.pdf_path
      ? '<a href="' + inv.pdf_path + '" target="_blank" class="btn btn-ghost btn-sm">Tải PDF</a>'
      : '<span style="color:var(--muted);font-size:12px">Đang tạo…</span>';
    return '<tr>'
      + '<td><strong>' + inv.invoice_number + '</strong></td>'
      + '<td>' + fmtDate(inv.period_start) + ' – ' + fmtDate(inv.period_end) + '</td>'
      + '<td>' + fmtVnd(inv.amount_vnd) + '</td>'
      + '<td><span class="' + b + '">' + lb + '</span></td>'
      + '<td>' + fmtDate(inv.due_date) + '</td>'
      + '<td>' + dl + '</td>'
      + '</tr>';
  }).join('');
}

async function generateInvoice() {
  const btn = document.getElementById('btn-generate-invoice');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang tạo…';
  try {
    const r = await apiFetch('/subscription/invoices', { method: 'POST' });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setMsg((d.message || 'Lỗi khi tạo hóa đơn'), true);
    } else {
      await loadInvoices();
      setMsg('Hóa đơn đã được tạo thành công!');
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Tạo hóa đơn mới';
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function apiFetch(path, opts = {}) {
  return fetch(API + path, {
    ...opts,
    headers: { Authorization: 'Bearer ' + token, ...(opts.headers || {}) },
  });
}

function setMsg(msg, isErr = false) {
  const el = document.getElementById('action-msg');
  el.textContent = msg;
  el.style.color = isErr ? 'var(--danger)' : 'var(--ok)';
  setTimeout(() => { el.textContent = ''; }, 4000);
}
</script>
<script src="/api/feedback/widget.js" defer></script>
</body>
</html>`;
}
//# sourceMappingURL=billing.html.js.map