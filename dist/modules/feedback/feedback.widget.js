"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildFeedbackWidgetJs = buildFeedbackWidgetJs;
function buildFeedbackWidgetJs() {
    return `(function(){
  'use strict';
  var API='/api';

  function getToken(){
    var keys=['partner_token','admin_token','import_token','token'];
    for(var i=0;i<keys.length;i++){var t=localStorage.getItem(keys[i]);if(t)return t;}
    return null;
  }
  function getCtx(){
    try{
      var tok=getToken();
      if(!tok)return null;
      var p=JSON.parse(atob(tok.split('.')[1]));
      if(p.exp*1000<Date.now())return null;
      return{token:tok,role:p.role||null};
    }catch(e){return null;}
  }
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

  var CSS=[
    '#rcl-fb-btn{position:fixed;bottom:20px;right:20px;z-index:9000;width:44px;height:44px;',
    'border-radius:50%;background:#1a56db;color:#fff;border:none;cursor:pointer;',
    'font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:transform .15s;}',
    '#rcl-fb-btn:hover{transform:scale(1.1);}',
    '#rcl-fb-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9001;',
    'align-items:flex-end;justify-content:flex-end;padding:70px 20px;}',
    '#rcl-fb-overlay.on{display:flex;}',
    '#rcl-fb-modal{background:#fff;border-radius:10px;padding:20px;width:340px;',
    'box-shadow:0 8px 24px rgba(0,0,0,.2);font-family:system-ui,sans-serif;font-size:14px;}',
    '#rcl-fb-modal h3{font-size:15px;font-weight:700;margin-bottom:14px;color:#111827;}',
    '.rcl-fb-row{margin-bottom:12px;}',
    '.rcl-fb-row label{display:block;font-size:11px;font-weight:600;color:#6b7280;margin-bottom:4px;}',
    '.rcl-fb-row select,.rcl-fb-row input,.rcl-fb-row textarea{width:100%;padding:7px 9px;',
    'border:1px solid #e5e7eb;border-radius:5px;font-size:13px;font-family:inherit;',
    'box-sizing:border-box;}',
    '.rcl-fb-row select:focus,.rcl-fb-row input:focus,.rcl-fb-row textarea:focus{',
    'outline:none;border-color:#1a56db;}',
    '.rcl-fb-row textarea{resize:vertical;min-height:80px;}',
    '.rcl-fb-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px;}',
    '.rcl-fb-btn-cancel{padding:6px 14px;border:1px solid #e5e7eb;background:#f3f4f6;',
    'border-radius:5px;cursor:pointer;font-size:12px;}',
    '.rcl-fb-btn-submit{padding:6px 14px;background:#1a56db;color:#fff;border:none;',
    'border-radius:5px;cursor:pointer;font-size:12px;font-weight:600;}',
    '.rcl-fb-btn-submit:disabled{opacity:.5;cursor:default;}',
    '.rcl-fb-msg{font-size:12px;margin-top:10px;text-align:center;}',
    '.rcl-fb-msg.ok{color:#059669;}.rcl-fb-msg.err{color:#dc2626;}',
  ].join('');

  var HTML=[
    '<style>'+CSS+'</style>',
    '<button id="rcl-fb-btn" title="Gửi phản hồi">💬</button>',
    '<div id="rcl-fb-overlay">',
    '<div id="rcl-fb-modal">',
    '<h3>Gửi phản hồi</h3>',
    '<div class="rcl-fb-row"><label>Loại</label>',
    '<select id="rcl-fb-type">',
    '<option value="bug">🐛 Báo lỗi</option>',
    '<option value="question">❓ Câu hỏi</option>',
    '<option value="suggestion">💡 Đề xuất</option>',
    '</select></div>',
    '<div class="rcl-fb-row"><label>Tiêu đề *</label>',
    '<input type="text" id="rcl-fb-title" placeholder="Mô tả ngắn gọn vấn đề..."></div>',
    '<div class="rcl-fb-row"><label>Chi tiết</label>',
    '<textarea id="rcl-fb-body" placeholder="Thêm thông tin, bước tái hiện lỗi..."></textarea></div>',
    '<div id="rcl-fb-msg" class="rcl-fb-msg"></div>',
    '<div class="rcl-fb-footer">',
    '<button class="rcl-fb-btn-cancel" id="rcl-fb-cancel">Hủy</button>',
    '<button class="rcl-fb-btn-submit" id="rcl-fb-submit">Gửi</button>',
    '</div>',
    '</div></div>',
  ].join('');

  function render(){
    var ctx=getCtx();
    if(!ctx)return;
    var container=document.createElement('div');
    container.innerHTML=HTML;
    document.body.appendChild(container);

    var btn=document.getElementById('rcl-fb-btn');
    var overlay=document.getElementById('rcl-fb-overlay');
    var cancel=document.getElementById('rcl-fb-cancel');
    var submit=document.getElementById('rcl-fb-submit');
    var msg=document.getElementById('rcl-fb-msg');

    btn.addEventListener('click',function(){overlay.classList.add('on');msg.textContent='';});
    cancel.addEventListener('click',function(){overlay.classList.remove('on');});
    overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.classList.remove('on');});

    submit.addEventListener('click',function(){
      var title=document.getElementById('rcl-fb-title').value.trim();
      if(!title){msg.textContent='Vui lòng nhập tiêu đề';msg.className='rcl-fb-msg err';return;}
      submit.disabled=true;msg.textContent='';
      var payload={
        type:document.getElementById('rcl-fb-type').value,
        title:title,
        body:document.getElementById('rcl-fb-body').value.trim()||undefined,
        page_url:window.location.pathname,
      };
      fetch(API+'/feedback',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+getCtx().token},
        body:JSON.stringify(payload),
      }).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d};});})
        .then(function(res){
          if(res.ok){
            msg.textContent='✓ Cảm ơn! Phản hồi đã được ghi nhận.';msg.className='rcl-fb-msg ok';
            document.getElementById('rcl-fb-title').value='';
            document.getElementById('rcl-fb-body').value='';
            setTimeout(function(){overlay.classList.remove('on');},1500);
          }else{
            msg.textContent='Lỗi: '+(res.d.message||'Không gửi được');msg.className='rcl-fb-msg err';
          }
        })
        .catch(function(e){msg.textContent='Lỗi kết nối';msg.className='rcl-fb-msg err';})
        .finally(function(){submit.disabled=false;});
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',render);
  }else{
    render();
  }
})();`;
}
//# sourceMappingURL=feedback.widget.js.map