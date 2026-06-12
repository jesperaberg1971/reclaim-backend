"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFeedbackAdminHtml = buildFeedbackAdminHtml;
function buildFeedbackAdminHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — Phản hồi Pilot</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{--brand:#1a56db;--brand-lt:#eff6ff;--danger:#dc2626;--warn:#d97706;--ok:#059669;--bg:#f3f4f6;--card:#fff;--border:#e5e7eb;--text:#111827;--muted:#6b7280}
  body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:var(--text);background:var(--bg)}
  .topbar{background:var(--brand);color:#fff;padding:0 20px;height:48px;display:flex;align-items:center;gap:12px}
  .topbar h1{font-size:15px;font-weight:700}.topbar .spacer{flex:1}
  .topbar .logout{font-size:12px;cursor:pointer;background:rgba(255,255,255,.2);border:none;color:#fff;padding:4px 12px;border-radius:4px}
  #login{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 48px)}
  .lc{background:var(--card);padding:32px;border-radius:8px;border:1px solid var(--border);width:340px}
  .lc h2{font-size:18px;font-weight:700;margin-bottom:20px}
  .fr{margin-bottom:14px}.fr label{display:block;font-size:12px;font-weight:500;color:var(--muted);margin-bottom:4px}
  .fr input{width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:5px;font-size:14px}
  .fr input:focus{outline:none;border-color:var(--brand)}
  .btn{padding:8px 16px;border-radius:5px;border:none;font-size:13px;font-weight:500;cursor:pointer}
  .btn-p{background:var(--brand);color:#fff;width:100%;padding:10px;font-size:14px}.btn-p:hover{background:#1741b6}
  .btn-sm{padding:4px 10px;font-size:12px}.btn-g{background:var(--bg);color:var(--text);border:1px solid var(--border)}
  .btn-g:hover{background:#e5e7eb}
  .err{color:var(--danger);font-size:12px;margin-top:8px;min-height:16px}
  #app{display:none;padding:20px;max-width:1100px;margin:0 auto}
  .toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:16px}
  .toolbar select,.toolbar input{padding:6px 10px;border:1px solid var(--border);border-radius:5px;font-size:13px;background:var(--card)}
  .card{background:var(--card);border:1px solid var(--border);border-radius:8px}
  table{width:100%;border-collapse:collapse}
  th,td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);font-size:13px}
  th{font-size:11px;font-weight:600;color:var(--muted);background:#f9fafb}
  tr:hover td{background:#f9fafb}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600}
  .b-open{background:#fee2e2;color:#b91c1c}.b-ack{background:#fef3c7;color:#92400e}.b-res{background:#d1fae5;color:#065f46}
  .b-bug{background:#fee2e2;color:#b91c1c}.b-q{background:var(--brand-lt);color:var(--brand)}.b-sug{background:#fef3c7;color:#92400e}
  .pag{padding:12px 16px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}
  .pag button{padding:4px 10px;border:1px solid var(--border);border-radius:4px;background:var(--card);font-size:12px;cursor:pointer}
  .pag button:disabled{opacity:.4;cursor:default}
  .loading{text-align:center;padding:32px;color:var(--muted)}
  .modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;align-items:center;justify-content:center}
  .modal-overlay.on{display:flex}
  .modal{background:var(--card);border-radius:8px;padding:24px;width:480px;max-width:90vw}
  .modal h3{font-size:16px;font-weight:700;margin-bottom:14px}
  .modal .body-text{font-size:13px;color:var(--muted);white-space:pre-wrap;background:#f9fafb;padding:10px;border-radius:5px;margin-bottom:14px}
  .mfooter{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
  textarea{width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:5px;font-size:13px;resize:vertical;min-height:70px;font-family:inherit}
  textarea:focus{outline:none;border-color:var(--brand)}
  .pilot-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px}
  .pilot-card{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:16px}
  .pilot-card .name{font-size:14px;font-weight:600;margin-bottom:10px}
  .pilot-stat{display:flex;justify-content:space-between;font-size:12px;padding:2px 0}
  .pilot-stat .v{font-weight:600}
  .pilot-open-fb{font-size:11px;color:var(--danger);font-weight:600;margin-top:8px}
  h2{font-size:16px;font-weight:700;margin-bottom:12px}
  .section{margin-bottom:24px}
</style>
</head>
<body>
<div class="topbar">
  <h1>Reclaim! — Pilot Dashboard</h1>
  <div class="spacer"></div>
  <span id="u-email" style="font-size:12px;opacity:.8"></span>
  <button class="logout" onclick="logout()">Đăng xuất</button>
</div>
<div id="login">
  <div class="lc">
    <h2>Super Admin</h2>
    <div class="fr"><label>Email</label><input type="email" id="l-e" placeholder="admin@reclaim.vn"></div>
    <div class="fr"><label>Mật khẩu</label><input type="password" id="l-p" placeholder="••••••••"></div>
    <button class="btn btn-p" onclick="login()">Đăng nhập</button>
    <div class="err" id="l-err"></div>
  </div>
</div>
<div id="app">
  <div class="section">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <h2 style="margin-bottom:0">Pilot Companies</h2>
      <div style="flex:1"></div>
      <input type="date" id="pil-from" style="padding:5px 8px;border:1px solid var(--border);border-radius:5px;font-size:12px">
      <input type="date" id="pil-to" style="padding:5px 8px;border:1px solid var(--border);border-radius:5px;font-size:12px">
      <button class="btn btn-sm btn-g" onclick="loadPilot()">Refresh</button>
    </div>
    <div style="margin-bottom:10px">
      <label style="font-size:12px;color:var(--muted)">Partner IDs (UUID, cách nhau bởi dấu phẩy):</label>
      <input type="text" id="pil-ids" placeholder="uuid1,uuid2,uuid3" style="width:100%;margin-top:4px;padding:7px 10px;border:1px solid var(--border);border-radius:5px;font-size:12px">
    </div>
    <div class="pilot-grid" id="pilot-grid"><div class="loading" style="grid-column:1/-1">Nhập Partner IDs và nhấn Refresh</div></div>
  </div>

  <div class="section">
    <h2>Phản hồi từ Người dùng</h2>
    <div class="toolbar">
      <select id="fb-status" onchange="loadFeedback()">
        <option value="">Tất cả trạng thái</option>
        <option value="open" selected>Chờ xử lý</option>
        <option value="acknowledged">Đã ghi nhận</option>
        <option value="resolved">Đã xử lý</option>
      </select>
      <select id="fb-type" onchange="loadFeedback()">
        <option value="">Tất cả loại</option>
        <option value="bug">🐛 Lỗi</option>
        <option value="question">❓ Câu hỏi</option>
        <option value="suggestion">💡 Đề xuất</option>
      </select>
      <div style="flex:1"></div>
      <span id="fb-count" style="font-size:12px;color:var(--muted)"></span>
    </div>
    <div class="card">
      <table>
        <thead><tr>
          <th>Thời gian</th><th>Công ty</th><th>Loại</th><th>Tiêu đề</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th>
        </tr></thead>
        <tbody id="fb-body"><tr><td colspan="7" class="loading">Đang tải...</td></tr></tbody>
      </table>
      <div class="pag">
        <button onclick="fbPage(-1)" id="fb-prev">‹ Trước</button>
        <span id="fb-pinfo"></span>
        <button onclick="fbPage(1)" id="fb-next">Sau ›</button>
      </div>
    </div>
  </div>
</div>

<!-- Detail modal -->
<div class="modal-overlay" id="detail-modal">
  <div class="modal">
    <h3 id="dm-title"></h3>
    <div style="margin-bottom:10px;font-size:12px;color:var(--muted)" id="dm-meta"></div>
    <div class="body-text" id="dm-body"></div>
    <div class="fr" style="margin-bottom:0">
      <label>Ghi chú Admin</label>
      <textarea id="dm-note" placeholder="Ghi chú nội bộ..."></textarea>
    </div>
    <div class="fr" style="margin-top:10px">
      <label>Cập nhật trạng thái</label>
      <select id="dm-status">
        <option value="open">Chờ xử lý</option>
        <option value="acknowledged">Đã ghi nhận</option>
        <option value="resolved">Đã xử lý</option>
      </select>
    </div>
    <div class="err" id="dm-err"></div>
    <div class="mfooter">
      <button class="btn btn-sm btn-g" onclick="closeModal()">Đóng</button>
      <button class="btn btn-sm btn-p" onclick="saveDetail()">Lưu</button>
    </div>
  </div>
</div>

<script>
const API='/api';
let token='';
let fbOffset=0,fbTotal=0;
let activeFbId=null;

function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fmtDate(iso){return iso?new Date(iso).toLocaleString('vi-VN'):'—'}

async function apiFetch(path,opts={}){
  const r=await fetch(API+path,{headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},...opts});
  if(r.status===401){logout();throw new Error('Phiên hết hạn');}
  const d=await r.json();
  if(!r.ok)throw new Error(d.message||'Lỗi');
  return d;
}

async function login(){
  const email=document.getElementById('l-e').value.trim();
  const pass=document.getElementById('l-p').value;
  document.getElementById('l-err').textContent='';
  try{
    const d=await fetch(API+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})}).then(r=>r.json());
    if(!d.access_token)throw new Error(d.message||'Thất bại');
    const p=JSON.parse(atob(d.access_token.split('.')[1]));
    if(p.role!=='super_admin')throw new Error('Chỉ dành cho Super Admin');
    token=d.access_token;
    localStorage.setItem('admin_token',token);
    document.getElementById('u-email').textContent=email;
    document.getElementById('login').style.display='none';
    document.getElementById('app').style.display='block';
    loadFeedback();
  }catch(e){document.getElementById('l-err').textContent=e.message;}
}
function logout(){
  token='';localStorage.removeItem('admin_token');
  document.getElementById('login').style.display='flex';
  document.getElementById('app').style.display='none';
}

// ── Pilot summary ─────────────────────────────────────────────────────────
async function loadPilot(){
  const ids=document.getElementById('pil-ids').value.split(',').map(s=>s.trim()).filter(Boolean);
  if(!ids.length){document.getElementById('pilot-grid').innerHTML='<div class="loading" style="grid-column:1/-1">Nhập ít nhất một Partner ID</div>';return;}
  const from=document.getElementById('pil-from').value;
  const to=document.getElementById('pil-to').value;
  const params=new URLSearchParams({partner_ids:ids.join(',')});
  if(from)params.set('from',from);
  if(to)params.set('to',to+'T23:59:59Z');
  document.getElementById('pilot-grid').innerHTML='<div class="loading" style="grid-column:1/-1">Đang tải...</div>';
  try{
    const data=await apiFetch('/feedback/pilot-summary?'+params);
    if(!data.length){document.getElementById('pilot-grid').innerHTML='<div style="grid-column:1/-1;color:var(--muted);padding:20px">Không tìm thấy dữ liệu</div>';return;}
    const subBadge=s=>{const m={trial:'b-q',active:'b-res',grace:'b-sug',overdue:'b-open',cancelled:'b-open'};return s?'<span class="badge '+(m[s]||'')+'">'+esc(s)+'</span>':'—';};
    document.getElementById('pilot-grid').innerHTML=data.map(r=>\`
      <div class="pilot-card">
        <div class="name">\${esc(r.partner_name)}<br><span style="font-size:11px;color:var(--muted);\font-family:monospace">\${r.partner_id.slice(0,8)}...</span></div>
        <div class="pilot-stat"><span>Clients</span><span class="v">\${r.client_count}</span></div>
        <div class="pilot-stat"><span>NV active</span><span class="v">\${r.active_employees}</span></div>
        <div class="pilot-stat"><span>Chi phí (kỳ)</span><span class="v">\${r.expenses_in_period}</span></div>
        <div class="pilot-stat"><span>Chờ duyệt</span><span class="v">\${r.pending_expenses}</span></div>
        <div class="pilot-stat"><span>Đã duyệt</span><span class="v">\${r.approved_expenses}</span></div>
        <div class="pilot-stat"><span>Subscription</span><span class="v">\${subBadge(r.subscription_status)}</span></div>
        <div class="pilot-stat"><span>Hoạt động cuối</span><span class="v" style="font-size:11px">\${r.last_activity?new Date(r.last_activity).toLocaleDateString('vi-VN'):'—'}</span></div>
        \${r.open_feedback>0?'<div class="pilot-open-fb">'+r.open_feedback+' phản hồi chưa xử lý</div>':''}
      </div>\`).join('');
  }catch(e){document.getElementById('pilot-grid').innerHTML='<div style="grid-column:1/-1;color:var(--danger);padding:20px">'+esc(e.message)+'</div>';}
}

// ── Feedback list ─────────────────────────────────────────────────────────
async function loadFeedback(){
  fbOffset=0;
  const status=document.getElementById('fb-status').value;
  const type=document.getElementById('fb-type').value;
  const params=new URLSearchParams({limit:30,offset:0});
  if(status)params.set('status',status);
  if(type)params.set('type',type);
  document.getElementById('fb-body').innerHTML='<tr><td colspan="7" class="loading">Đang tải...</td></tr>';
  try{
    const{items,total}=await apiFetch('/feedback?'+params);
    fbTotal=total;
    renderFeedback(items);
  }catch(e){document.getElementById('fb-body').innerHTML='<tr><td colspan="7" style="color:var(--danger);padding:16px">'+esc(e.message)+'</td></tr>';}
}

function renderFeedback(items){
  document.getElementById('fb-count').textContent=fbTotal+' phản hồi';
  document.getElementById('fb-pinfo').textContent=(fbOffset+1)+'–'+Math.min(fbOffset+30,fbTotal)+' / '+fbTotal;
  document.getElementById('fb-prev').disabled=fbOffset===0;
  document.getElementById('fb-next').disabled=fbOffset+30>=fbTotal;
  if(!items.length){document.getElementById('fb-body').innerHTML='<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--muted)">Không có phản hồi</td></tr>';return;}
  const typeBadge=t=>({bug:'<span class="badge b-bug">🐛 Lỗi</span>',question:'<span class="badge b-q">❓ Hỏi</span>',suggestion:'<span class="badge b-sug">💡 Đề xuất</span>'}[t]||t);
  const statusBadge=s=>({open:'<span class="badge b-open">Chờ xử lý</span>',acknowledged:'<span class="badge b-ack">Đã ghi nhận</span>',resolved:'<span class="badge b-res">Đã xử lý</span>'}[s]||s);
  document.getElementById('fb-body').innerHTML=items.map(f=>\`
    <tr>
      <td style="font-size:11px;white-space:nowrap">\${new Date(f.created_at).toLocaleString('vi-VN')}</td>
      <td style="font-size:12px">\${esc(f.partner_name||'—')}</td>
      <td>\${typeBadge(f.type)}</td>
      <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="\${esc(f.title)}">\${esc(f.title)}</td>
      <td style="font-size:11px">\${esc(f.user_role||'—')}</td>
      <td>\${statusBadge(f.status)}</td>
      <td><button class="btn btn-sm btn-g" onclick="openDetail(\${JSON.stringify(f).replace(/'/g,'\\'')})">Xem</button></td>
    </tr>\`).join('');
}

async function fbPage(dir){
  const no=fbOffset+dir*30;
  if(no<0||no>=fbTotal)return;
  fbOffset=no;
  const status=document.getElementById('fb-status').value;
  const type=document.getElementById('fb-type').value;
  const params=new URLSearchParams({limit:30,offset:fbOffset});
  if(status)params.set('status',status);
  if(type)params.set('type',type);
  const{items,total}=await apiFetch('/feedback?'+params);
  fbTotal=total;renderFeedback(items);
}

function openDetail(f){
  activeFbId=f.id;
  document.getElementById('dm-title').textContent=f.title;
  document.getElementById('dm-meta').textContent=
    new Date(f.created_at).toLocaleString('vi-VN')+' · '+
    (f.partner_name||'—')+' · '+
    (f.user_role||'—')+(f.page_url?' · '+f.page_url:'');
  document.getElementById('dm-body').textContent=f.body||'(không có chi tiết)';
  document.getElementById('dm-note').value=f.admin_note||'';
  document.getElementById('dm-status').value=f.status;
  document.getElementById('dm-err').textContent='';
  document.getElementById('detail-modal').classList.add('on');
}

async function saveDetail(){
  const status=document.getElementById('dm-status').value;
  const note=document.getElementById('dm-note').value;
  document.getElementById('dm-err').textContent='';
  try{
    await apiFetch('/feedback/'+activeFbId,{method:'PATCH',body:JSON.stringify({status,admin_note:note})});
    closeModal();
    loadFeedback();
  }catch(e){document.getElementById('dm-err').textContent=e.message;}
}

function closeModal(){document.getElementById('detail-modal').classList.remove('on');}
document.getElementById('detail-modal').addEventListener('click',e=>{if(e.target===document.getElementById('detail-modal'))closeModal();});

// ── Init ──────────────────────────────────────────────────────────────────
const today=new Date().toISOString().slice(0,10);
const weekAgo=new Date(Date.now()-7*86400000).toISOString().slice(0,10);
document.getElementById('pil-from').value=weekAgo;
document.getElementById('pil-to').value=today;

const saved=localStorage.getItem('admin_token');
if(saved){
  try{
    const p=JSON.parse(atob(saved.split('.')[1]));
    if(p.role==='super_admin'&&p.exp*1000>Date.now()){
      token=saved;
      document.getElementById('u-email').textContent=p.sub||'admin';
      document.getElementById('login').style.display='none';
      document.getElementById('app').style.display='block';
      loadFeedback();
    }else{localStorage.removeItem('admin_token');}
  }catch{}
}
</script>
</body>
</html>`;
}
//# sourceMappingURL=feedback.admin.html.js.map