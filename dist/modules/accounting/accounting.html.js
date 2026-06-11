"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAccountingHtml = buildAccountingHtml;
function buildAccountingHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reclaim! — Accounting</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --brand:#1a56db; --brand-lt:#eff6ff;
    --g1:#2563eb; --g1-lt:#dbeafe;
    --g2:#059669; --g2-lt:#d1fae5;
    --g3:#7c3aed; --g3-lt:#ede9fe;
    --danger:#dc2626; --warn:#d97706; --ok:#059669;
    --bg:#f3f4f6; --card:#fff; --border:#e5e7eb;
    --text:#111827; --muted:#6b7280;
  }
  body{font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:var(--text);background:var(--bg)}

  /* ── Layout ── */
  #app{display:flex;flex-direction:column;height:100vh}
  .topbar{background:var(--brand);color:#fff;height:48px;padding:0 20px;
          display:flex;align-items:center;gap:12px;flex-shrink:0}
  .topbar h1{font-size:15px;font-weight:600}
  .topbar .sep{opacity:.3}
  .topbar .spacer{flex:1}
  .topbar .badge{background:rgba(255,255,255,.2);border-radius:10px;padding:2px 10px;font-size:12px}
  .logout-btn{font-size:12px;opacity:.8;cursor:pointer;padding:4px 10px;border-radius:4px;
              border:none;background:transparent;color:#fff}
  .logout-btn:hover{background:rgba(255,255,255,.15)}

  /* ── Nav tabs ── */
  .nav-tabs-bar{background:var(--card);border-bottom:1px solid var(--border);
                padding:0 20px;display:flex;align-items:center;flex-shrink:0;gap:2px}
  .nav-tab{padding:13px 16px;border:none;background:none;font-size:13px;font-weight:500;
           cursor:pointer;color:var(--muted);border-bottom:2px solid transparent;
           margin-bottom:-1px;transition:color .15s,border-color .15s}
  .nav-tab:hover{color:var(--text)}
  .nav-tab.active{color:var(--brand);border-bottom-color:var(--brand)}
  .nav-spacer{flex:1}
  .btn-export-nav{background:#7c3aed;color:#fff;border:none;border-radius:5px;
                  padding:6px 16px;font-size:13px;font-weight:600;cursor:pointer;margin-left:8px}
  .btn-export-nav:hover{opacity:.9}

  /* ── Filter bar ── */
  .filter-bar{background:var(--card);border-bottom:1px solid var(--border);
              padding:10px 20px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;flex-shrink:0}
  .f-group{display:flex;align-items:center;gap:5px}
  .f-label{font-size:11px;color:var(--muted);white-space:nowrap}
  .f-in{padding:6px 9px;border:1px solid var(--border);border-radius:5px;font-size:13px;
        background:var(--card);font-family:inherit}
  .f-in:focus{outline:none;border-color:var(--brand)}
  .f-in-sm{width:120px}
  .f-in-xs{width:90px}
  .f-sel{padding:6px 8px;border:1px solid var(--border);border-radius:5px;font-size:13px;background:var(--card)}
  .f-sel:focus{outline:none;border-color:var(--brand)}
  .btn-apply{background:var(--brand);color:#fff;border:none;border-radius:5px;
             padding:6px 14px;font-size:13px;cursor:pointer;font-weight:500}
  .btn-apply:hover{opacity:.9}
  .btn-reset{background:#e5e7eb;color:var(--text);border:none;border-radius:5px;
             padding:6px 12px;font-size:13px;cursor:pointer}

  /* ── Summary strip ── */
  .summary-strip{background:var(--card);border-bottom:1px solid var(--border);
                 padding:10px 20px;display:flex;gap:20px;flex-wrap:wrap;align-items:center;flex-shrink:0}
  .s-stat{display:flex;flex-direction:column;gap:2px}
  .s-label{font-size:11px;color:var(--muted);font-weight:500;text-transform:uppercase;letter-spacing:.4px}
  .s-value{font-size:15px;font-weight:700}
  .s-div{width:1px;background:var(--border);align-self:stretch}
  .g-box{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:6px}
  .g-box-1{background:var(--g1-lt)}
  .g-box-2{background:var(--g2-lt)}
  .g-box-3{background:var(--g3-lt)}
  .g-name{font-size:11px;font-weight:600}
  .g-name-1{color:var(--g1)}
  .g-name-2{color:var(--g2)}
  .g-name-3{color:var(--g3)}
  .g-amt{font-size:12px;font-weight:700}

  /* ── Main content (review panel) ── */
  .main-content{display:flex;flex:1;overflow:hidden}
  .table-panel{flex:1;overflow:auto;padding:16px 20px}
  .tbl-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .tbl-count{font-size:13px;color:var(--muted)}
  table{width:100%;border-collapse:collapse;background:var(--card);
        border:1px solid var(--border);border-radius:8px;overflow:hidden;font-size:13px}
  thead tr{background:#f9fafb;border-bottom:1px solid var(--border)}
  th{padding:9px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--muted);
     text-transform:uppercase;letter-spacing:.4px;white-space:nowrap;cursor:pointer;user-select:none}
  th:hover{color:var(--brand)}
  th.sort-asc::after{content:' ↑'}
  th.sort-desc::after{content:' ↓'}
  td{padding:9px 12px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  tr.row-active{background:var(--brand-lt)}
  tr:not(.row-active):hover td{background:#fafafa;cursor:pointer}
  .g-badge{display:inline-block;padding:2px 8px;border-radius:8px;font-size:11px;font-weight:700}
  .g-badge-1{background:var(--g1-lt);color:var(--g1)}
  .g-badge-2{background:var(--g2-lt);color:var(--g2)}
  .g-badge-3{background:var(--g3-lt);color:var(--g3)}
  .pit-tag{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;
           font-weight:600;background:#fee2e2;color:#b91c1c}
  .exp-tag{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;
           font-weight:600;background:#d1fae5;color:#065f46}
  .pend-tag{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;
            font-weight:600;background:#fef3c7;color:#92400e}
  td.amt{text-align:right;font-variant-numeric:tabular-nums;font-weight:500}
  .detail-btn{padding:3px 10px;border:1px solid var(--border);border-radius:4px;font-size:12px;
              cursor:pointer;background:var(--card)}
  .detail-btn:hover{background:var(--brand-lt);border-color:var(--brand);color:var(--brand)}
  .empty-tbl{text-align:center;padding:48px;color:var(--muted)}
  .empty-tbl .et-icon{font-size:32px;display:block;margin-bottom:10px}
  .empty-tbl .et-title{font-size:15px;font-weight:700;color:#1f2937;margin-bottom:6px}
  .empty-tbl .et-sub{font-size:13px;margin-bottom:14px;max-width:360px;
                     margin-left:auto;margin-right:auto;line-height:1.6}
  .empty-tbl .et-links{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
  .empty-tbl a.et-cta{display:inline-block;padding:8px 16px;border-radius:6px;
                       font-size:13px;font-weight:600;text-decoration:none;
                       background:var(--brand);color:#fff}
  .empty-tbl a.et-cta-ghost{background:#f3f4f6;color:#374151}

  /* ── KPI dashboard cards ── */
  .overview-panel{flex:1;overflow:auto;padding:20px;background:var(--bg)}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}
  @media(max-width:960px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:520px){.kpi-grid{grid-template-columns:1fr}}
  .kpi-card{background:var(--card);border:1px solid var(--border);border-radius:10px;
            padding:18px 20px;transition:box-shadow .15s;position:relative}
  .kpi-card.clickable{cursor:pointer}
  .kpi-card.clickable:hover{box-shadow:0 4px 16px rgba(0,0,0,.08);border-color:#c7d2fe}
  .kpi-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
             color:var(--muted);margin-bottom:8px}
  .kpi-value{font-size:34px;font-weight:800;line-height:1;margin-bottom:6px}
  .kpi-sub{font-size:11px;color:var(--muted);margin-bottom:10px}
  .kpi-action{font-size:12px;font-weight:600;color:var(--brand)}
  .kpi-amber{color:#d97706}
  .kpi-green{color:var(--ok)}
  .kpi-blue{color:var(--brand)}
  .kpi-red{color:var(--danger)}
  .kpi-muted{color:var(--muted)}

  /* ── Comments section ── */
  .comments-section{margin-top:4px}
  .comment-item{padding:10px 12px;border-radius:6px;background:#f9fafb;border:1px solid var(--border);margin-bottom:8px}
  .comment-meta{font-size:11px;color:var(--muted);margin-bottom:4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
  .comment-role-badge{padding:1px 5px;border-radius:3px;font-size:10px;font-weight:600}
  .role-partner{background:#eff6ff;color:#1e40af}
  .role-client{background:#f0fdf4;color:#166534}
  .comment-body{font-size:13px;color:#374151;line-height:1.5;white-space:pre-wrap;word-break:break-word}
  .comment-form{margin-top:8px}
  .comment-ta{width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;font-size:13px;
              font-family:inherit;min-height:72px;resize:vertical}
  .comment-ta:focus{outline:none;border-color:var(--brand)}
  .comment-submit{margin-top:6px;padding:6px 16px;border:none;border-radius:5px;
                  font-size:13px;font-weight:500;cursor:pointer;background:var(--brand);color:#fff}
  .comment-submit:hover{opacity:.85}
  .comment-submit:disabled{opacity:.45;cursor:not-allowed}
  .comment-empty{font-size:13px;color:var(--muted);font-style:italic;margin-bottom:8px}

  /* ── Notification bell ── */
  .notif-btn{position:relative;background:rgba(255,255,255,.15);border:none;border-radius:6px;
             color:#fff;cursor:pointer;padding:5px 10px;font-size:16px;display:flex;
             align-items:center;gap:5px;margin-right:4px}
  .notif-btn:hover{background:rgba(255,255,255,.25)}
  .notif-badge{background:#ef4444;color:#fff;border-radius:8px;font-size:10px;font-weight:700;
               padding:1px 5px;min-width:16px;text-align:center;line-height:1.4}
  .notif-panel{position:fixed;top:48px;right:12px;width:360px;background:var(--card);
               border:1px solid var(--border);border-radius:10px;
               box-shadow:0 8px 32px rgba(0,0,0,.15);z-index:500;
               max-height:520px;display:flex;flex-direction:column}
  .notif-header{display:flex;align-items:center;justify-content:space-between;
                padding:12px 16px;border-bottom:1px solid var(--border)}
  .notif-title{font-size:14px;font-weight:700}
  .notif-mark-all{font-size:12px;color:var(--brand);cursor:pointer;background:none;border:none;padding:2px 6px}
  .notif-mark-all:hover{text-decoration:underline}
  .notif-list{overflow-y:auto;flex:1}
  .notif-item{display:flex;gap:10px;padding:12px 16px;border-bottom:1px solid #f3f4f6;cursor:pointer;transition:background .1s}
  .notif-item:last-child{border-bottom:none}
  .notif-item:hover{background:#f9fafb}
  .notif-item.unread{background:#eff6ff}
  .notif-item.unread:hover{background:#dbeafe}
  .notif-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;
              justify-content:center;font-size:14px;flex-shrink:0;margin-top:2px}
  .ni-ready{background:#fef3c7}
  .ni-approved{background:#d1fae5}
  .ni-rejected{background:#fee2e2}
  .notif-body{flex:1;min-width:0}
  .notif-ntitle{font-size:13px;font-weight:600;margin-bottom:2px}
  .notif-nbody{font-size:12px;color:var(--muted);line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .notif-ntime{font-size:11px;color:#9ca3af;margin-top:3px}
  .notif-unread-dot{width:8px;height:8px;border-radius:50%;background:var(--brand);flex-shrink:0;margin-top:6px}
  .notif-empty{text-align:center;padding:32px 16px;color:var(--muted);font-size:13px}
  .notif-footer{padding:10px 16px;border-top:1px solid var(--border);display:flex;justify-content:center}
  .notif-settings-btn{font-size:12px;color:var(--muted);cursor:pointer;background:none;border:none;padding:2px 6px}
  .notif-settings-btn:hover{color:var(--brand)}

  /* ── Notification settings modal ── */
  .ns-modal{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:600;
            display:none;align-items:center;justify-content:center}
  .ns-modal.open{display:flex}
  .ns-card{background:var(--card);border-radius:12px;padding:24px;width:340px;
           box-shadow:0 12px 40px rgba(0,0,0,.18)}
  .ns-title{font-size:16px;font-weight:700;margin-bottom:4px}
  .ns-sub{font-size:12px;color:var(--muted);margin-bottom:18px}
  .ns-row{display:flex;align-items:center;justify-content:space-between;
          padding:12px 0;border-bottom:1px solid var(--border)}
  .ns-row:last-of-type{border-bottom:none}
  .ns-label{font-size:13px;font-weight:500}
  .ns-desc{font-size:11px;color:var(--muted);margin-top:2px}
  .toggle{position:relative;width:40px;height:22px;flex-shrink:0}
  .toggle input{opacity:0;width:0;height:0}
  .toggle-slider{position:absolute;inset:0;background:#d1d5db;border-radius:11px;cursor:pointer;transition:.2s}
  .toggle-slider:before{content:'';position:absolute;width:18px;height:18px;top:2px;left:2px;
                        background:#fff;border-radius:50%;transition:.2s}
  .toggle input:checked+.toggle-slider{background:var(--brand)}
  .toggle input:checked+.toggle-slider:before{transform:translateX(18px)}

  /* ── Quick actions ── */
  .quick-actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
  .qa-btn{display:flex;align-items:center;gap:8px;padding:10px 16px;border:1px solid var(--border);
          border-radius:8px;background:var(--card);cursor:pointer;font-size:13px;font-weight:500;
          color:var(--text);transition:all .15s}
  .qa-btn:hover{border-color:var(--brand);color:var(--brand);background:var(--brand-lt)}
  .qa-btn .qa-icon{font-size:16px}
  .qa-btn-primary{background:var(--brand);color:#fff;border-color:var(--brand)}
  .qa-btn-primary:hover{background:#1d4ed8;border-color:#1d4ed8;color:#fff}

  /* ── Dashboard cards ── */
  .db-card{background:var(--card);border:1px solid var(--border);border-radius:10px;
           padding:20px;margin-bottom:20px}
  .db-card-title{font-size:14px;font-weight:700;margin-bottom:14px;display:flex;
                 align-items:center;justify-content:space-between}
  .db-client-tbl{width:100%;border-collapse:collapse;font-size:13px}
  .db-client-tbl th{padding:8px 12px;text-align:left;font-size:11px;font-weight:700;
                    color:var(--muted);text-transform:uppercase;letter-spacing:.4px;
                    border-bottom:1px solid var(--border);background:#f9fafb}
  .db-client-tbl td{padding:9px 12px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
  .db-client-tbl tr:last-child td{border-bottom:none}
  .db-client-tbl tr:not(:first-child):hover td{background:#fafafa;cursor:pointer}
  .db-num{font-weight:700;font-size:14px}
  .db-recent-row{display:flex;align-items:flex-start;gap:12px;padding:10px 0;
                 border-bottom:1px solid #f3f4f6}
  .db-recent-row:last-child{border-bottom:none}
  .db-recent-icon{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;
                  justify-content:center;font-size:14px;flex-shrink:0;background:#eff6ff}
  .db-recent-body{flex:1;min-width:0}
  .db-recent-label{font-size:13px;font-weight:500}
  .db-recent-meta{font-size:11px;color:var(--muted);margin-top:2px}

  /* ── Detail slide-over ── */
  .detail-overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:100;display:none}
  .detail-overlay.open{display:block}
  .detail-drawer{position:fixed;top:0;right:0;bottom:0;width:480px;background:var(--card);
                 box-shadow:-4px 0 20px rgba(0,0,0,.12);z-index:101;overflow-y:auto;
                 transform:translateX(100%);transition:transform .25s ease}
  .detail-drawer.open{transform:translateX(0)}
  .drawer-header{padding:16px 20px;border-bottom:1px solid var(--border);
                 display:flex;align-items:center;gap:10px}
  .drawer-title{font-size:15px;font-weight:700;flex:1}
  .drawer-close{border:none;background:none;font-size:20px;cursor:pointer;color:var(--muted);padding:2px 6px}
  .drawer-close:hover{color:var(--text)}
  .drawer-body{padding:20px}
  .d-section{margin-bottom:20px}
  .d-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
                   color:var(--muted);margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)}
  .d-row{display:flex;gap:8px;margin-bottom:8px;font-size:13px}
  .d-row .k{color:var(--muted);font-size:12px;width:130px;flex-shrink:0}
  .d-row .v{font-weight:500}
  .d-explain{font-size:13px;color:#374151;line-height:1.6;background:#f9fafb;
             padding:10px 12px;border-radius:6px;margin-bottom:12px}
  .acct-codes{display:flex;gap:8px;margin-bottom:8px}
  .acct-box{flex:1;border:1px solid var(--border);border-radius:6px;padding:10px 12px;text-align:center}
  .acct-label{font-size:10px;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
  .acct-code{font-size:18px;font-weight:700;font-family:monospace}
  .acct-arrow{display:flex;align-items:center;color:var(--muted);font-size:18px}
  .doc-list{display:flex;flex-direction:column;gap:6px}
  .doc-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border);
            border-radius:6px;font-size:13px}
  .doc-icon{font-size:18px}
  .doc-name{flex:1;color:var(--brand);text-decoration:none}
  .doc-name:hover{text-decoration:underline}
  .voucher-box{background:#f5f3ff;border:1px solid #c4b5fd;border-radius:6px;padding:12px}
  .trip-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:12px}

  /* ── Export modal ── */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;
                 display:none;align-items:center;justify-content:center}
  .modal-overlay.open{display:flex}
  .modal-card{background:var(--card);border-radius:12px;padding:28px;width:520px;
              box-shadow:0 20px 60px rgba(0,0,0,.2)}
  .modal-title{font-size:17px;font-weight:700;margin-bottom:4px}
  .modal-sub{font-size:13px;color:var(--muted);margin-bottom:20px}
  .modal-footer{display:flex;gap:8px;margin-top:20px;justify-content:flex-end}
  .preview-box{background:#f9fafb;border:1px solid var(--border);border-radius:8px;
               padding:14px;margin:16px 0;font-size:13px;line-height:1.8;display:none}
  .preview-box.visible{display:block}

  /* ── Export stepper ── */
  .ex-stepper{display:flex;align-items:center;gap:0;margin-bottom:20px}
  .ex-step{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600}
  .ex-step-num{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;
               justify-content:center;font-size:11px;font-weight:700;flex-shrink:0}
  .ex-step.done .ex-step-num{background:var(--ok);color:#fff}
  .ex-step.active .ex-step-num{background:var(--brand);color:#fff}
  .ex-step.idle .ex-step-num{background:#e5e7eb;color:var(--muted)}
  .ex-step.done .ex-step-lbl{color:var(--ok)}
  .ex-step.active .ex-step-lbl{color:var(--brand)}
  .ex-step.idle .ex-step-lbl{color:var(--muted)}
  .ex-connector{flex:1;height:2px;background:#e5e7eb;margin:0 6px;min-width:20px}
  .ex-connector.done{background:var(--ok)}

  /* ── Export summary card ── */
  .ex-summary{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px}
  .ex-summary-title{font-size:15px;font-weight:700;color:#14532d;margin-bottom:12px}
  .ex-sum-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
  .ex-sum-item{background:#fff;border:1px solid #bbf7d0;border-radius:6px;padding:10px 12px}
  .ex-sum-label{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:#166534;font-weight:600;margin-bottom:2px}
  .ex-sum-value{font-size:16px;font-weight:700;color:#14532d}
  .ex-gate-row{display:flex;gap:6px;margin-bottom:8px}
  .ex-gate-chip{flex:1;text-align:center;padding:6px 4px;border-radius:6px;font-size:11px}
  .ex-split-list{font-size:12px;color:#166534;line-height:1.8}

  /* ── Split badges ── */
  .split-parent-tag{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;
                    font-weight:600;background:#ede9fe;color:#6d28d9;margin-left:4px}
  .split-child-tag{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;
                   font-weight:600;background:#fef3c7;color:#92400e;margin-left:4px}

  /* ── Split info box in drawer ── */
  .split-box{background:#faf5ff;border:1px solid #ddd6fe;border-radius:6px;padding:12px;margin-top:10px}
  .split-box-title{font-size:11px;font-weight:700;color:#6d28d9;margin-bottom:6px}
  .split-id-link{font-family:monospace;font-size:11px;color:var(--brand);cursor:pointer;
                 text-decoration:underline;background:none;border:none;padding:0}

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
  .btn{padding:8px 16px;border:none;border-radius:6px;font-size:13px;font-weight:500;
       cursor:pointer;transition:opacity .1s}
  .btn:hover{opacity:.85}
  .btn:disabled{opacity:.45;cursor:not-allowed}
  .btn-primary{background:var(--brand);color:#fff}
  .btn-ok{background:var(--ok);color:#fff}
  .btn-ghost{background:#e5e7eb;color:var(--text)}
  .btn-danger{background:var(--danger);color:#fff}
  .spinner{display:inline-block;width:14px;height:14px;border:2px solid #bfdbfe;
           border-top-color:var(--brand);border-radius:50%;animation:spin .6s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}

  /* ── Toast ── */
  #toast-container{position:fixed;bottom:20px;right:20px;z-index:9999;
                   display:flex;flex-direction:column;gap:8px;pointer-events:none}
  .toast{padding:12px 16px;border-radius:8px;font-size:13px;font-weight:500;
         box-shadow:0 4px 16px rgba(0,0,0,.14);max-width:360px;line-height:1.4;
         pointer-events:all;display:flex;align-items:flex-start;gap:10px;
         animation:toast-in .2s ease}
  @keyframes toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .toast-error{background:#fef2f2;border:1px solid #fca5a5;color:#7f1d1d}
  .toast-warn{background:#fffbeb;border:1px solid #fcd34d;color:#78350f}
  .toast-ok{background:#f0fdf4;border:1px solid #86efac;color:#14532d}
  .toast-info{background:#eff6ff;border:1px solid #93c5fd;color:#1e3a5f}
  .toast-icon{flex-shrink:0;font-size:16px;margin-top:1px}
  .toast-close{margin-left:auto;flex-shrink:0;cursor:pointer;opacity:.5;font-size:16px;
               background:none;border:none;padding:0 0 0 6px;color:inherit}
  .toast-close:hover{opacity:1}
  .modal-err{color:var(--danger);font-size:12px;margin-top:8px;display:none}
  .modal-err.visible{display:block}

  /* ── Pagination ── */
  .pagination-bar{display:flex;align-items:center;justify-content:center;gap:14px;
                  padding:12px 20px;border-top:1px solid var(--border)}
  .pg-btn{padding:5px 14px;border:1px solid var(--border);border-radius:5px;font-size:13px;
          cursor:pointer;background:var(--card)}
  .pg-btn:hover:not(:disabled){background:var(--brand-lt);border-color:var(--brand);color:var(--brand)}
  .pg-btn:disabled{opacity:.4;cursor:not-allowed}
  .pg-info{font-size:13px;color:var(--muted)}

  /* ── Review: approval badges + action buttons ── */
  .appr-pending{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;
               font-weight:600;background:#fef3c7;color:#92400e}
  .appr-approved{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;
                 font-weight:600;background:#d1fae5;color:#065f46}
  .appr-rejected{display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;
                 font-weight:600;background:#fee2e2;color:#b91c1c}
  .review-done{background:#f0fdf4;border:1px solid #86efac;border-radius:6px;
               padding:12px 14px;font-size:13px}
  .review-rejected{background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;
                   padding:12px 14px;font-size:13px}
  .review-note-ta{width:100%;padding:8px 10px;border:1px solid var(--border);border-radius:6px;
                  font-size:13px;font-family:inherit;min-height:64px;resize:vertical}
  .review-note-ta:focus{outline:none;border-color:var(--brand)}
  .btn-approve{background:var(--ok);color:#fff;border:none;border-radius:6px;
               padding:8px;font-size:13px;font-weight:500;cursor:pointer;flex:1}
  .btn-approve:hover{opacity:.85}
  .btn-reject{background:var(--danger);color:#fff;border:none;border-radius:6px;
              padding:8px;font-size:13px;font-weight:500;cursor:pointer;flex:1}
  .btn-reject:hover{opacity:.85}
  .pdf-warn{font-size:12px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;
            border-radius:5px;padding:8px 10px;margin-top:8px}
  .pdf-ok  {font-size:12px;color:#065f46;background:#f0fdf4;border:1px solid #86efac;
            border-radius:5px;padding:8px 10px;margin-top:8px}
  .pdf-na  {font-size:12px;color:var(--muted);background:#f9fafb;border:1px solid var(--border);
            border-radius:5px;padding:8px 10px;margin-top:8px}

  @media print{.nav-tabs-bar,.filter-bar,.summary-strip,.pagination-bar,.btn-export-nav{display:none!important}}
</style>
</head>
<body>

<div id="toast-container"></div>

<!-- LOGIN -->
<div id="login-screen" style="display:none">
  <div class="login-card">
    <h2>Reclaim! Accounting</h2>
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
<div id="app" style="display:none;flex-direction:column;height:100vh">

  <!-- Top bar -->
  <div class="topbar">
    <h1>Reclaim!</h1>
    <span class="sep">|</span>
    <span style="font-size:13px;opacity:.85">Accounting</span>
    <span class="badge" id="hdr-tenant"></span>
    <div class="spacer"></div>
    <button class="notif-btn" id="notif-btn" onclick="toggleNotifPanel()" title="Thông báo">
      🔔<span class="notif-badge" id="notif-count" style="display:none">0</span>
    </button>
    <button class="logout-btn" onclick="logout()">Đăng xuất</button>
  </div>

  <!-- Notification panel -->
  <div class="notif-panel" id="notif-panel" style="display:none">
    <div class="notif-header">
      <span class="notif-title">Thông báo</span>
      <button class="notif-mark-all" onclick="markAllNotifRead()">Đánh dấu tất cả đã đọc</button>
    </div>
    <div class="notif-list" id="notif-list">
      <div class="notif-empty">Đang tải…</div>
    </div>
    <div class="notif-footer">
      <button class="notif-settings-btn" onclick="openNotifSettings()">⚙️ Cài đặt thông báo</button>
    </div>
  </div>

  <!-- Notification settings modal -->
  <div class="ns-modal" id="ns-modal" onclick="if(event.target===this)closeNotifSettings()">
    <div class="ns-card">
      <div class="ns-title">Cài đặt thông báo</div>
      <div class="ns-sub">Quản lý cách bạn nhận thông báo từ Reclaim!</div>
      <div class="ns-row">
        <div>
          <div class="ns-label">Thông báo trong ứng dụng</div>
          <div class="ns-desc">Luôn bật — hiển thị trên thanh tiêu đề</div>
        </div>
        <label class="toggle"><input type="checkbox" checked disabled>
          <span class="toggle-slider"></span></label>
      </div>
      <div class="ns-row">
        <div>
          <div class="ns-label">Thông báo qua email</div>
          <div class="ns-desc">Nhận email khi có biên lai mới hoặc quyết định phê duyệt</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="ns-email-toggle" onchange="saveNotifSettings()">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="modal-footer" style="margin-top:12px">
        <button class="btn btn-ghost" onclick="closeNotifSettings()">Đóng</button>
      </div>
    </div>
  </div>

  <!-- Nav tabs -->
  <div class="nav-tabs-bar">
    <button class="nav-tab active" id="tab-overview" onclick="switchTab('overview')">📊 Tổng quan</button>
    <button class="nav-tab"        id="tab-review"   onclick="switchTab('review')">📋 Xem xét biên lai</button>
    <div class="nav-spacer"></div>
    <button class="btn-export-nav" onclick="openExportModal()">📤 Xuất dữ liệu ERP</button>
  </div>

  <!-- ═══ PANEL 1: OVERVIEW (dashboard) ═══ -->
  <div id="panel-overview" class="overview-panel">

    <!-- Period picker -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap">
      <span style="font-size:13px;font-weight:600;color:var(--muted)">Kỳ báo cáo:</span>
      <input type="date" class="f-in f-in-xs" id="db-from">
      <span style="font-size:12px;color:var(--muted)">–</span>
      <input type="date" class="f-in f-in-xs" id="db-to">
      <button class="btn-apply" onclick="loadDashboard()">Cập nhật</button>
      <span style="font-size:12px;color:var(--muted)" id="db-loading" style="display:none"></span>
    </div>

    <!-- KPI cards -->
    <div class="kpi-grid">
      <div class="kpi-card clickable" onclick="goToReview('pending', null)">
        <div class="kpi-label">Chờ phê duyệt</div>
        <div class="kpi-value kpi-amber" id="kpi-pending">—</div>
        <div class="kpi-sub">tất cả thời gian</div>
        <div class="kpi-action">Xem xét ngay →</div>
      </div>
      <div class="kpi-card clickable" onclick="goToReview('approved', null)">
        <div class="kpi-label">Đã duyệt (chờ xuất ERP)</div>
        <div class="kpi-value kpi-green" id="kpi-approved">—</div>
        <div class="kpi-sub" id="kpi-sub-approved">kỳ này</div>
        <div class="kpi-action">Xuất ERP →</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Đã xuất ERP</div>
        <div class="kpi-value kpi-blue" id="kpi-exported">—</div>
        <div class="kpi-sub" id="kpi-sub-exported">kỳ này</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Đã từ chối</div>
        <div class="kpi-value kpi-red" id="kpi-rejected">—</div>
        <div class="kpi-sub" id="kpi-sub-rejected">kỳ này</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="quick-actions">
      <button class="qa-btn qa-btn-primary" onclick="goToReview('pending', null)">
        <span class="qa-icon">✅</span>Xem biên lai chờ duyệt
      </button>
      <button class="qa-btn" onclick="openExportModal()">
        <span class="qa-icon">📤</span>Xuất dữ liệu ERP
      </button>
      <button class="qa-btn" onclick="openZipModal()">
        <span class="qa-icon">📦</span>Tải ZIP tài liệu
      </button>
      <button class="qa-btn" onclick="switchTab('review')">
        <span class="qa-icon">📋</span>Tất cả biên lai
      </button>
    </div>

    <!-- Two-column row: clients + recent exports -->
    <div style="display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start">

      <!-- Client activity table -->
      <div class="db-card">
        <div class="db-card-title">
          Hoạt động theo đơn vị
          <span class="tbl-count" id="db-client-count"></span>
        </div>
        <div id="db-client-table">
          <div style="text-align:center;padding:28px"><span class="spinner"></span></div>
        </div>
      </div>

      <!-- Recent exports -->
      <div class="db-card">
        <div class="db-card-title">Xuất gần đây</div>
        <div id="db-recent-exports">
          <div style="text-align:center;padding:28px"><span class="spinner"></span></div>
        </div>
      </div>

    </div>
  </div>

  <!-- ═══ PANEL 2: REVIEW (expense table) ═══ -->
  <div id="panel-review" style="display:none;flex-direction:column;flex:1;overflow:hidden">

    <!-- Filters -->
    <div class="filter-bar">
      <div class="f-group">
        <span class="f-label">Từ</span>
        <input type="date" class="f-in f-in-xs" id="f-from">
      </div>
      <div class="f-group">
        <span class="f-label">Đến</span>
        <input type="date" class="f-in f-in-xs" id="f-to">
      </div>
      <div class="f-group">
        <span class="f-label">Đơn vị</span>
        <select class="f-sel" id="f-client" style="min-width:150px">
          <option value="">Tất cả đơn vị</option>
        </select>
      </div>
      <div class="f-group">
        <span class="f-label">Nhân viên</span>
        <select class="f-sel" id="f-employee" style="min-width:150px">
          <option value="">Tất cả NV</option>
        </select>
      </div>
      <div class="f-group">
        <span class="f-label">Gate</span>
        <select class="f-sel" id="f-gate">
          <option value="">Tất cả</option>
          <option value="1">Gate 1 — Công tác phí</option>
          <option value="2">Gate 2 — Phúc lợi</option>
          <option value="3">Gate 3 — Chi hộ</option>
        </select>
      </div>
      <div class="f-group">
        <span class="f-label">ERP</span>
        <select class="f-sel" id="f-status">
          <option value="all">Tất cả</option>
          <option value="pending_export">Chưa xuất</option>
          <option value="exported">Đã xuất</option>
        </select>
      </div>
      <div class="f-group">
        <span class="f-label">Phê duyệt</span>
        <select class="f-sel" id="f-approval">
          <option value="">Tất cả</option>
          <option value="pending">Chờ duyệt</option>
          <option value="approved">Đã duyệt</option>
          <option value="rejected">Từ chối</option>
        </select>
      </div>
      <div class="f-group">
        <input type="text" class="f-in f-in-sm" id="f-search" placeholder="Tìm vendor / nhân viên…">
      </div>
      <button class="btn-apply" onclick="search()">Tìm kiếm</button>
      <button class="btn-reset" onclick="resetFilters()">Đặt lại</button>
    </div>

    <!-- Summary strip -->
    <div class="summary-strip" id="summary-strip">
      <div class="s-stat">
        <span class="s-label">Tổng chi phí</span>
        <span class="s-value" id="s-total">—</span>
      </div>
      <div class="s-div"></div>
      <div class="s-stat">
        <span class="s-label">Tổng khấu trừ</span>
        <span class="s-value" id="s-ded" style="color:var(--ok)">—</span>
      </div>
      <div class="s-div"></div>
      <div class="s-stat">
        <span class="s-label">PIT</span>
        <span class="s-value" id="s-pit" style="color:var(--warn)">—</span>
      </div>
      <div class="s-div"></div>
      <div class="g-box g-box-1">
        <span class="g-name g-name-1">G1</span>
        <div>
          <div style="font-size:11px;color:var(--g1)">Công tác phí</div>
          <div class="g-amt g-name-1" id="s-g1">—</div>
        </div>
      </div>
      <div class="g-box g-box-2">
        <span class="g-name g-name-2">G2</span>
        <div>
          <div style="font-size:11px;color:var(--g2)">Phúc lợi</div>
          <div class="g-amt g-name-2" id="s-g2">—</div>
        </div>
      </div>
      <div class="g-box g-box-3">
        <span class="g-name g-name-3">G3</span>
        <div>
          <div style="font-size:11px;color:var(--g3)">Chi hộ</div>
          <div class="g-amt g-name-3" id="s-g3">—</div>
        </div>
      </div>
      <div class="s-div"></div>
      <div class="s-stat">
        <span class="s-label">Chưa xuất ERP</span>
        <span class="s-value" id="s-pending" style="color:var(--warn)">—</span>
      </div>
    </div>

    <!-- Table -->
    <div class="main-content">
      <div class="table-panel">
        <div class="tbl-header">
          <span class="tbl-count" id="tbl-count"></span>
        </div>
        <div id="tbl-wrap"></div>
        <div id="pagination" class="pagination-bar"></div>
      </div>
    </div>

  </div><!-- /#panel-review -->
</div><!-- /#app -->

<!-- DETAIL DRAWER -->
<div class="detail-overlay" id="overlay" onclick="closeDrawer()"></div>
<div class="detail-drawer" id="drawer">
  <div class="drawer-header">
    <span class="drawer-title" id="drawer-title">Chi tiết</span>
    <button class="drawer-close" onclick="closeDrawer()">✕</button>
  </div>
  <div class="drawer-body" id="drawer-body"></div>
</div>

<!-- ZIP DOWNLOAD MODAL -->
<div class="modal-overlay" id="zip-modal">
  <div class="modal-card">
    <div class="modal-title">📦 Tải ZIP tài liệu</div>
    <div class="modal-sub">Tải toàn bộ biên lai &amp; PDF quyết định công tác trong kỳ thành một file ZIP</div>

    <div class="field-group">
      <label>Từ ngày</label>
      <input type="date" class="f-in" id="zip-from" style="width:100%">
    </div>
    <div class="field-group">
      <label>Đến ngày</label>
      <input type="date" class="f-in" id="zip-to" style="width:100%">
    </div>
    <div class="field-group">
      <label>Đơn vị (tuỳ chọn)</label>
      <select class="f-sel" id="zip-client" style="width:100%">
        <option value="">Tất cả đơn vị</option>
      </select>
    </div>

    <div id="zip-preview-info" style="display:none;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px 12px;font-size:13px;margin-top:8px"></div>
    <div id="zip-modal-err" class="modal-err"></div>

    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeZipModal()">Huỷ</button>
      <button class="btn btn-ok" id="zip-download-btn" onclick="downloadZip()">
        📦 Tải xuống ZIP
      </button>
    </div>
  </div>
</div>

<!-- EXPORT MODAL -->
<div class="modal-overlay" id="export-modal">
  <div class="modal-card">
    <div class="modal-title">📤 Xuất dữ liệu kế toán</div>

    <!-- Stepper -->
    <div class="ex-stepper" id="ex-stepper">
      <div class="ex-step active" id="ex-s1">
        <span class="ex-step-num">1</span>
        <span class="ex-step-lbl">Chọn kỳ</span>
      </div>
      <div class="ex-connector" id="ex-c1"></div>
      <div class="ex-step idle" id="ex-s2">
        <span class="ex-step-num">2</span>
        <span class="ex-step-lbl">Xem trước</span>
      </div>
      <div class="ex-connector" id="ex-c2"></div>
      <div class="ex-step idle" id="ex-s3">
        <span class="ex-step-num">3</span>
        <span class="ex-step-lbl">Hoàn tất</span>
      </div>
    </div>

    <!-- Step 1: date/client pickers -->
    <div id="ex-panel-1">
      <div class="field-group">
        <label>Từ ngày</label>
        <input type="date" class="f-in" id="ex-from" style="width:100%">
      </div>
      <div class="field-group">
        <label>Đến ngày</label>
        <input type="date" class="f-in" id="ex-to" style="width:100%">
      </div>
      <div class="field-group">
        <label>Đơn vị (tuỳ chọn)</label>
        <select class="f-sel" id="ex-client" style="width:100%">
          <option value="">Tất cả đơn vị</option>
        </select>
      </div>
      <div id="modal-err" class="modal-err"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeExportModalClearErr()">Huỷ</button>
        <button class="btn btn-primary" id="ex-preview-btn" onclick="previewExport()">
          🔍 Xem trước →
        </button>
      </div>
    </div>

    <!-- Step 2: rich preview + confirm buttons -->
    <div id="ex-panel-2" style="display:none">
      <div class="preview-box visible" id="preview-box" style="display:block;max-height:340px;overflow-y:auto"></div>
      <div id="modal-err-2" class="modal-err"></div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeExportModalClearErr()">Huỷ</button>
        <button class="btn btn-ghost" onclick="backToStep1()">← Sửa kỳ</button>
        <button class="btn btn-ghost" id="misa-csv-btn" onclick="confirmMisaCsv()"
                title="Tải CSV nhập thẳng vào MISA SME (Phiếu chi)">
          📋 MISA CSV
        </button>
        <button class="btn btn-ok" id="confirm-export-btn" onclick="confirmExport()">
          ✅ Xuất JSON &amp; tải file
        </button>
      </div>
    </div>

    <!-- Step 3: success summary -->
    <div id="ex-panel-3" style="display:none">
      <div class="ex-summary" id="ex-summary-card"></div>
      <div class="modal-footer">
        <button class="btn btn-ok" onclick="closeExportDone()">✓ Xong</button>
      </div>
    </div>

  </div>
</div>

<script>
// ── State ─────────────────────────────────────────────────────────────────
let token       = sessionStorage.getItem('acc_token');
let expenses    = [];
let clients     = [];
let sortCol     = 'receipt_date';
let sortDir     = 'desc';
let currentId   = null;
let currentPage = 1;
let totalPages  = 1;
let totalCount  = 0;
let activeTab   = 'overview';
let reviewLoaded = false;

// ── Boot ──────────────────────────────────────────────────────────────────
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
    document.getElementById('hdr-tenant').textContent = p.role || '';
  } catch {}
  setDefaultDates();
  document.addEventListener('click', closeNotifPanelIfOpen, true);
  Promise.all([loadClients(), loadEmployees()]);
  switchTab('overview');
  startNotifPolling();
}

function setDefaultDates() {
  const now     = new Date();
  const from    = new Date(now.getFullYear(), now.getMonth(), 1);
  const fromStr = from.toISOString().slice(0,10);
  const toStr   = now.toISOString().slice(0,10);
  document.getElementById('f-from').value  = fromStr;
  document.getElementById('f-to').value    = toStr;
  document.getElementById('db-from').value = fromStr;
  document.getElementById('db-to').value   = toStr;
}

// ── Tab switching ─────────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-overview').classList.toggle('active', tab==='overview');
  document.getElementById('tab-review').classList.toggle('active',   tab==='review');
  document.getElementById('panel-overview').style.display = tab==='overview' ? 'block' : 'none';
  const pr = document.getElementById('panel-review');
  pr.style.display       = tab==='review' ? 'flex' : 'none';
  pr.style.flexDirection = 'column';
  pr.style.flex          = '1';
  pr.style.overflow      = 'hidden';

  if (tab === 'overview') loadDashboard();
  if (tab === 'review' && !reviewLoaded) { reviewLoaded = true; loadData(); }
}

// ── Dashboard ─────────────────────────────────────────────────────────────
async function loadDashboard() {
  const from = document.getElementById('db-from').value;
  const to   = document.getElementById('db-to').value;

  ['kpi-pending','kpi-approved','kpi-exported','kpi-rejected'].forEach(id => {
    document.getElementById(id).textContent = '…';
  });
  document.getElementById('db-client-table').innerHTML =
    '<div style="text-align:center;padding:28px"><span class="spinner"></span></div>';
  document.getElementById('db-recent-exports').innerHTML =
    '<div style="text-align:center;padding:28px"><span class="spinner"></span></div>';

  try {
    const qs = new URLSearchParams({ from: from||'', to: to||'' });
    const [metrics, recentExports] = await Promise.all([
      api('/accounting/dashboard-metrics?'+qs.toString()),
      api('/accounting/recent-exports'),
    ]);
    renderKpis(metrics, from, to);
    renderClientTable(metrics.client_summary, metrics.total_clients_active);
    renderRecentExports(recentExports);
  } catch(e) {
    showToast('Lỗi tải tổng quan: '+e.message, 'error');
    document.getElementById('db-client-table').innerHTML =
      '<p style="color:var(--danger);padding:20px">Lỗi: '+esc(e.message)+'</p>';
  }
}

function renderKpis(m, from, to) {
  const periodLabel = (from && to) ? from+' → '+to : 'kỳ này';
  document.getElementById('kpi-pending').textContent  = m.pending_approval;
  document.getElementById('kpi-approved').textContent = m.approved_ready_to_export;
  document.getElementById('kpi-exported').textContent = m.exported_this_period;
  document.getElementById('kpi-rejected').textContent = m.rejected_this_period;
  document.getElementById('kpi-sub-approved').textContent = periodLabel;
  document.getElementById('kpi-sub-exported').textContent = periodLabel;
  document.getElementById('kpi-sub-rejected').textContent = periodLabel;
}

function renderClientTable(clients, activeCount) {
  document.getElementById('db-client-count').textContent =
    activeCount ? activeCount+' đơn vị' : '';

  if (!clients.length) {
    document.getElementById('db-client-table').innerHTML =
      '<p style="color:var(--muted);text-align:center;padding:20px;font-size:13px">Không có dữ liệu trong kỳ này.</p>';
    return;
  }

  const rows = clients.map(c =>
    '<tr onclick="goToReview(null,\''+c.client_id+'\')">'
    +'<td style="font-weight:500;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'
      +esc(c.client_name)+'</td>'
    +'<td style="text-align:center">'
      +(c.pending ? '<span class="appr-pending db-num">'+c.pending+'</span>' : '<span style="color:#d1d5db">—</span>')+'</td>'
    +'<td style="text-align:center">'
      +(c.approved ? '<span class="appr-approved db-num">'+c.approved+'</span>' : '<span style="color:#d1d5db">—</span>')+'</td>'
    +'<td style="text-align:center">'
      +(c.rejected ? '<span class="appr-rejected db-num">'+c.rejected+'</span>' : '<span style="color:#d1d5db">—</span>')+'</td>'
    +'<td style="text-align:center;color:var(--muted)">'+(c.exported||'—')+'</td>'
    +'<td><button class="detail-btn" onclick="event.stopPropagation();goToReview(\'pending\',\''+c.client_id+'\')">'
      +'Xem xét →</button></td>'
    +'</tr>'
  ).join('');

  document.getElementById('db-client-table').innerHTML =
    '<table class="db-client-tbl">'
    +'<thead><tr>'
    +'<th>Đơn vị</th>'
    +'<th style="text-align:center">Chờ duyệt</th>'
    +'<th style="text-align:center">Đã duyệt</th>'
    +'<th style="text-align:center">Từ chối</th>'
    +'<th style="text-align:center">Đã xuất</th>'
    +'<th></th>'
    +'</tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'</table>';
}

function renderRecentExports(exports) {
  if (!exports.length) {
    document.getElementById('db-recent-exports').innerHTML =
      '<p style="color:var(--muted);font-size:13px;padding:8px 0">Chưa có lịch sử xuất.</p>';
    return;
  }
  const ACTION_LABELS = {
    erp_export:        'Xuất ERP',
    accounting_export: 'Tổng kết kế toán',
    misa_csv_export:   'Xuất MISA CSV',
  };
  const html = exports.map(e => {
    const label = ACTION_LABELS[e.action] || e.action;
    const meta  = e.metadata || {};
    const detail = meta.from && meta.to
      ? meta.from+' → '+meta.to+(meta.expense_count!=null?' · '+meta.expense_count+' biên lai':'')
      : '';
    const dateStr = new Date(e.created_at).toLocaleString('vi-VN', { dateStyle:'short', timeStyle:'short' });
    return '<div class="db-recent-row">'
      +'<div class="db-recent-icon">📤</div>'
      +'<div class="db-recent-body">'
      +'<div class="db-recent-label">'+esc(label)+'</div>'
      +(detail ? '<div class="db-recent-meta">'+esc(detail)+'</div>' : '')
      +'<div class="db-recent-meta">'+dateStr+'</div>'
      +'</div>'
      +'</div>';
  }).join('');
  document.getElementById('db-recent-exports').innerHTML = html;
}

function goToReview(approvalFilter, clientId) {
  if (approvalFilter !== null && approvalFilter !== undefined)
    document.getElementById('f-approval').value = approvalFilter;
  if (clientId)
    document.getElementById('f-client').value = clientId;
  currentPage  = 1;
  reviewLoaded = false; // force reload with new filters
  switchTab('review');
}

// ── Auth ──────────────────────────────────────────────────────────────────
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
    sessionStorage.setItem('acc_token', token);
    bootApp();
  } catch(e) {
    err.textContent = e.message;
  } finally { btn.disabled = false; btn.textContent = 'Đăng nhập'; }
}

function logout() {
  sessionStorage.removeItem('acc_token');
  token = null; expenses = []; clients = [];
  if (notifPollHandle) { clearInterval(notifPollHandle); notifPollHandle = null; }
  bootLogin();
}

// ── API ───────────────────────────────────────────────────────────────────
async function api(path, opts={}) {
  const r = await fetch('/api' + path, {
    ...opts,
    headers:{ Authorization:'Bearer '+token, 'Content-Type':'application/json', ...(opts.headers||{}) },
  });
  const d = await r.json();
  if (r.status===401) { logout(); throw new Error('Session expired'); }
  if (!r.ok) throw new Error(d.message||'HTTP '+r.status);
  return d;
}

// ── Data load ─────────────────────────────────────────────────────────────
async function loadClients() {
  try {
    clients = await api('/accounting/clients');
    const opts = clients.map(c => '<option value="'+c.id+'">'+esc(c.name)+'</option>').join('');
    document.getElementById('f-client').innerHTML  = '<option value="">Tất cả đơn vị</option>'+opts;
    document.getElementById('ex-client').innerHTML = '<option value="">Tất cả đơn vị</option>'+opts;
    document.getElementById('zip-client').innerHTML = '<option value="">Tất cả đơn vị</option>'+opts;
  } catch {}
}

async function loadEmployees() {
  try {
    const emps = await api('/accounting/employees');
    const opts = emps.map(e => '<option value="'+e.id+'">'+esc(e.name)+'</option>').join('');
    document.getElementById('f-employee').innerHTML = '<option value="">Tất cả NV</option>'+opts;
  } catch {}
}

async function loadData() {
  const from     = document.getElementById('f-from').value;
  const to       = document.getElementById('f-to').value;
  const client   = document.getElementById('f-client').value;
  const employee = document.getElementById('f-employee').value;
  const gate     = document.getElementById('f-gate').value;
  const status   = document.getElementById('f-status').value;
  const approval = document.getElementById('f-approval').value;
  const search   = document.getElementById('f-search').value.trim();

  const qs = new URLSearchParams();
  if (from)     qs.set('from', from);
  if (to)       qs.set('to', to);
  if (client)   qs.set('clientId', client);
  if (employee) qs.set('employeeId', employee);
  if (gate)     qs.set('gate', gate);
  if (status && status !== 'all') qs.set('status', status);
  if (approval) qs.set('approvalDecision', approval);
  if (search)   qs.set('search', search);
  qs.set('page',  String(currentPage));
  qs.set('limit', '50');

  document.getElementById('tbl-wrap').innerHTML =
    '<div class="empty-tbl"><span class="spinner"></span></div>';
  document.getElementById('pagination').innerHTML = '';

  try {
    const [data, summary] = await Promise.all([
      api('/accounting/expenses?'+qs.toString()),
      (from && to) ? api('/accounting/summary?'+new URLSearchParams({from,to,...(client?{clientId:client}:{})}).toString()) : null,
    ]);
    expenses   = data.data;
    totalCount = data.total;
    totalPages = data.totalPages;
    renderTable();
    renderPagination();
    if (summary) renderSummary(summary);
  } catch(e) {
    document.getElementById('tbl-wrap').innerHTML =
      '<div class="empty-tbl" style="color:var(--danger)">Lỗi: '+esc(e.message)+'</div>';
  }
}

function resetFilters() {
  document.getElementById('f-gate').value     = '';
  document.getElementById('f-status').value   = 'all';
  document.getElementById('f-approval').value = '';
  document.getElementById('f-client').value   = '';
  document.getElementById('f-employee').value = '';
  document.getElementById('f-search').value   = '';
  setDefaultDates();
  currentPage = 1;
  loadData();
}

// ── Summary render ────────────────────────────────────────────────────────
function renderSummary(s) {
  const fmt = v => Number(v).toLocaleString('vi-VN');
  document.getElementById('s-total').textContent   = fmt(s.total_original_vnd)+' VND';
  document.getElementById('s-ded').textContent     = fmt(s.total_deductible_vnd)+' VND';
  document.getElementById('s-pit').textContent     = fmt(s.total_pit_vnd)+' VND';
  document.getElementById('s-g1').textContent      = fmt(s.by_gate.gate_1?.deductible_vnd||0)+' VND';
  document.getElementById('s-g2').textContent      = fmt(s.by_gate.gate_2?.deductible_vnd||0)+' VND';
  document.getElementById('s-g3').textContent      = fmt(s.by_gate.gate_3?.deductible_vnd||0)+' VND';
  document.getElementById('s-pending').textContent = s.pending_export_count+' biên lai';
}

// ── Table render ──────────────────────────────────────────────────────────
function renderTable() {
  document.getElementById('tbl-count').textContent = totalCount
    ? totalCount+' biên lai' : '';

  if (!expenses.length) {
    const anyFilter =
      document.getElementById('f-search').value.trim() ||
      document.getElementById('f-client').value ||
      document.getElementById('f-gate').value ||
      document.getElementById('f-approval').value ||
      document.getElementById('f-status').value !== 'all';
    document.getElementById('tbl-wrap').innerHTML = anyFilter
      ? '<div class="empty-tbl">'
          +'<span class="et-icon">🔍</span>'
          +'<div class="et-title">Không có kết quả phù hợp</div>'
          +'<div class="et-sub">Thử mở rộng khoảng thời gian hoặc bỏ bớt bộ lọc.</div>'
          +'<div class="et-links">'
          +'<a class="et-cta et-cta-ghost" href="#" onclick="resetFilters();return false">Xóa bộ lọc</a>'
          +'</div></div>'
      : '<div class="empty-tbl">'
          +'<span class="et-icon">📭</span>'
          +'<div class="et-title">Chưa có biên lai nào trong kỳ này</div>'
          +'<div class="et-sub">Khi nhân viên nộp và được duyệt, biên lai sẽ xuất hiện ở đây.</div>'
          +'<div class="et-links">'
          +'<a class="et-cta" href="/api/mobile/guide" target="_blank">Hướng dẫn di động →</a>'
          +'<a class="et-cta et-cta-ghost" href="/api/setup" target="_blank">Thêm nhân viên</a>'
          +'</div></div>';
    return;
  }

  const sorted = [...expenses].sort((a,b) => {
    let va = a[sortCol], vb = b[sortCol];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortDir==='asc'?-1:1;
    if (va > vb) return sortDir==='asc'?1:-1;
    return 0;
  });

  const thCls = col => col===sortCol ? (sortDir==='asc'?'sort-asc':'sort-desc') : '';

  const rows = sorted.map(e => {
    const orig    = Number(e.original_amount_vnd).toLocaleString('vi-VN');
    const ded     = Number(e.deductible_amount_vnd).toLocaleString('vi-VN');
    const expTag  = e.erp_exported
      ? '<span class="exp-tag">Đã xuất</span>'
      : '<span class="pend-tag">Chưa xuất</span>';
    const pitTag  = e.pit_flag ? '<span class="pit-tag" title="Chịu thuế TNCN">PIT</span>' : '';
    const splitTag = e.parent_expense_id
      ? '<span class="split-child-tag" title="Phần tử con — split từ biên lai khác">↳ SPLIT</span>'
      : (e.split_child_count > 0
        ? '<span class="split-parent-tag" title="Đã tách thành '+e.split_child_count+' biên lai con">⑂ '+e.split_child_count+'</span>'
        : '');
    const apprTag = !e.approval_decision
      ? '<span class="appr-pending">Chờ duyệt</span>'
      : e.approval_decision === 'approved'
        ? '<span class="appr-approved">✓ Duyệt</span>'
        : '<span class="appr-rejected">✗ Từ chối</span>';
    const act = currentId===e.id ? 'row-active' : '';

    return '<tr class="'+act+'" onclick="openDrawer(\''+e.id+'\')"><td>'+e.receipt_date+'</td>'
      +'<td>'+esc(e.employee_name)+'<br><span style="font-size:11px;color:var(--muted)">'+esc(e.employee_internal_id)+'</span></td>'
      +'<td>'+esc(e.client_name)+'</td>'
      +'<td>'+(e.vendor?esc(e.vendor):'<span style="color:var(--muted)">—</span>')+'</td>'
      +'<td><span class="g-badge g-badge-'+e.gate_applied+'">G'+e.gate_applied+'</span>'+splitTag+'</td>'
      +'<td class="amt">'+orig+'</td>'
      +'<td class="amt" style="color:var(--ok)">'+ded+'</td>'
      +'<td>'+pitTag+'</td>'
      +'<td>'+expTag+'</td>'
      +'<td>'+apprTag+'</td>'
      +'<td><button class="detail-btn" onclick="event.stopPropagation();openDrawer(\''+e.id+'\')">Detail →</button></td>'
      +'</tr>';
  }).join('');

  document.getElementById('tbl-wrap').innerHTML =
    '<table><thead><tr>'
    +'<th class="'+thCls('receipt_date')+'" onclick="setSort(\'receipt_date\')">Ngày</th>'
    +'<th class="'+thCls('employee_name')+'" onclick="setSort(\'employee_name\')">Nhân viên</th>'
    +'<th class="'+thCls('client_name')+'" onclick="setSort(\'client_name\')">Đơn vị</th>'
    +'<th class="'+thCls('vendor')+'" onclick="setSort(\'vendor\')">Vendor</th>'
    +'<th class="'+thCls('gate_applied')+'" onclick="setSort(\'gate_applied\')">Gate</th>'
    +'<th class="'+thCls('original_amount_vnd')+'" onclick="setSort(\'original_amount_vnd\')" style="text-align:right">Gốc (VND)</th>'
    +'<th class="'+thCls('deductible_amount_vnd')+'" onclick="setSort(\'deductible_amount_vnd\')" style="text-align:right">Khấu trừ (VND)</th>'
    +'<th>PIT</th><th>ERP</th><th title="Phê duyệt kế toán">Duyệt</th><th></th>'
    +'</tr></thead><tbody>'+rows+'</tbody></table>';
}

function setSort(col) {
  if (sortCol === col) sortDir = sortDir==='asc'?'desc':'asc';
  else { sortCol = col; sortDir = 'asc'; }
  renderTable();
}

// ── Detail drawer ─────────────────────────────────────────────────────────
async function openDrawer(id) {
  currentId = id;
  renderTable();
  document.getElementById('drawer-title').textContent = 'Chi tiết biên lai';
  document.getElementById('drawer-body').innerHTML =
    '<div style="display:flex;justify-content:center;padding:40px"><span class="spinner"></span></div>';
  document.getElementById('overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');

  try {
    const e = await api('/accounting/expenses/'+id);
    renderDrawer(e);
    loadComments(id);
  } catch(err) {
    document.getElementById('drawer-body').innerHTML =
      '<div style="color:var(--danger);padding:20px">Lỗi: '+esc(err.message)+'</div>';
  }
}

function closeDrawer() {
  currentId = null;
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  document.querySelectorAll('.row-active').forEach(r => r.classList.remove('row-active'));
}

function renderDrawer(e) {
  document.getElementById('drawer-title').textContent = 'G'+e.gate_applied+' · '+e.receipt_date;

  const orig   = Number(e.original_amount_vnd).toLocaleString('vi-VN');
  const ded    = Number(e.deductible_amount_vnd).toLocaleString('vi-VN');
  const pitHtml = e.pit_flag
    ? '<span class="pit-tag" style="font-size:12px;padding:3px 8px">⚠️ PIT — phần vượt mức tính thuế TNCN</span>'
    : '<span style="color:var(--ok);font-size:12px">✓ Không phát sinh thuế TNCN</span>';

  let gateExtra = '';
  if (e.gate_applied === 1) {
    if (e.trip_decision) {
      const td     = e.trip_decision;
      const pdfDoc = (e.supporting_documents||[]).find(d => d.type === 'trip_decision_pdf');
      gateExtra =
        '<div class="trip-box" style="margin-top:10px">'
        +'<div style="font-size:11px;font-weight:700;color:var(--g1);margin-bottom:6px">📋 Quyết định công tác</div>'
        +'<div class="d-row"><span class="k">Thời gian</span><span class="v">'+td.start_date+' → '+td.end_date+'</span></div>'
        +(td.destination?'<div class="d-row"><span class="k">Địa điểm</span><span class="v">'+esc(td.destination)+'</span></div>':'')
        +'<div class="d-row"><span class="k">Phụ cấp/ngày</span><span class="v">'+Number(td.daily_allowance_vnd).toLocaleString('vi-VN')+' VND</span></div>'
        +'</div>';
      if (pdfDoc) {
        gateExtra += '<div class="pdf-ok">✓ PDF Quyết định công tác đã tạo'
          +' — <a href="#" onclick="downloadSecureFile(\''+esc(pdfDoc.url||'')+'\');return false"'
          +' style="color:#065f46;font-weight:600;text-decoration:underline">Tải xuống PDF →</a>'
          +'</div>';
      } else {
        gateExtra += '<div class="pdf-warn">⚠️ PDF Quyết định công tác chưa được tạo.</div>';
      }
    } else {
      gateExtra = '<div class="pdf-warn">⚠️ Không tìm thấy quyết định công tác cho ngày biên lai này.</div>';
    }
  } else {
    if (e.voucher) {
      gateExtra =
        '<div class="voucher-box" style="margin-top:10px">'
        +'<div style="font-size:11px;font-weight:700;color:var(--g3);margin-bottom:6px">📄 Phiếu chi (Voucher)</div>'
        +'<div class="d-row"><span class="k">Số phiếu</span><span class="v" style="font-family:monospace">'+esc(e.voucher.voucher_number)+'</span></div>'
        +'<div class="d-row"><span class="k">Số tiền</span><span class="v">'+Number(e.voucher.amount_vnd).toLocaleString('vi-VN')+' VND</span></div>'
        +(e.voucher.bank_last_four?'<div class="d-row"><span class="k">Thẻ ngân hàng</span><span class="v">•••• '+esc(e.voucher.bank_last_four)+'</span></div>':'')
        +'</div>';
    }
    gateExtra += '<div class="pdf-na">— PDF Quyết định công tác không áp dụng (Gate '+e.gate_applied+')</div>';
  }

  const docs    = (e.supporting_documents||[]);
  const docsHtml = docs.length
    ? '<div class="doc-list">'
      + docs.map(d =>
          '<div class="doc-item"><span class="doc-icon">📄</span>'
          +'<a class="doc-name" href="#" onclick="downloadSecureFile(\''+esc(d.url||'')+'\');return false">'+esc(d.filename||d.type)+'</a>'
          +'<span style="font-size:11px;color:var(--muted)">'+new Date(d.generated_at||Date.now()).toLocaleDateString('vi-VN')+'</span>'
          +'</div>'
        ).join('')
      +'</div>'
    : '<p style="color:var(--muted);font-size:13px">Không có tài liệu đính kèm.</p>';

  const statusHtml = e.erp_exported
    ? '<span class="exp-tag" style="padding:3px 10px;font-size:12px">✓ Đã xuất ERP</span>'
    : '<span class="pend-tag" style="padding:3px 10px;font-size:12px">Chưa xuất ERP</span>';

  document.getElementById('drawer-body').innerHTML =

    '<div class="d-section">'
      +'<div class="d-section-title">Thông tin chung</div>'
      +'<div class="d-row"><span class="k">Mã biên lai</span><span class="v" style="font-family:monospace;font-size:11px">'+e.id+'</span></div>'
      +'<div class="d-row"><span class="k">Nhân viên</span><span class="v">'+esc(e.employee_name)+'<span style="color:var(--muted);font-size:11px"> ('+esc(e.employee_internal_id)+')</span></span></div>'
      +'<div class="d-row"><span class="k">Đơn vị</span><span class="v">'+esc(e.client_name)+'</span></div>'
      +'<div class="d-row"><span class="k">Vendor</span><span class="v">'+(e.vendor?esc(e.vendor):'<em style="color:var(--muted)">Không rõ</em>')+'</span></div>'
      +'<div class="d-row"><span class="k">Ngày biên lai</span><span class="v">'+e.receipt_date+'</span></div>'
      +'<div class="d-row"><span class="k">Trạng thái ERP</span><span class="v">'+statusHtml+'</span></div>'
    +'</div>'

    +'<div class="d-section">'
      +'<div class="d-section-title">Số tiền</div>'
      +'<div class="d-row"><span class="k">Số tiền gốc</span><span class="v">'+orig+' '+esc(e.currency)+'</span></div>'
      +'<div class="d-row"><span class="k">Khấu trừ</span><span class="v" style="color:var(--ok);font-weight:700">'+ded+' VND</span></div>'
      +'<div class="d-row"><span class="k">Thuế TNCN</span><span class="v">'+pitHtml+'</span></div>'
    +'</div>'

    +'<div class="d-section">'
      +'<div class="d-section-title">Phân loại Gate</div>'
      +'<div style="margin-bottom:8px"><span class="g-badge g-badge-'+e.gate_applied+'" style="font-size:13px;padding:4px 12px">'+esc(e.gate_label)+'</span></div>'
      +'<div class="d-explain">'+esc(e.gate_explanation)+'</div>'
      + gateExtra
    +'</div>'

    // Split info section (only shown when this expense is part of a split)
    + (e.parent_expense_id || (e.child_ids && e.child_ids.length > 0)
        ? '<div class="d-section">'
          +'<div class="d-section-title">Biên lai split</div>'
          +'<div class="split-box">'
          +'<div class="split-box-title">⑂ Thông tin tách biên lai</div>'
          +(e.parent_expense_id
            ? '<div class="d-row"><span class="k">Biên lai gốc</span>'
              +'<span class="v"><button class="split-id-link" onclick="openDrawer(\''+e.parent_expense_id+'\')">'+e.parent_expense_id.slice(0,8)+'… →</button></span></div>'
            : '')
          +(e.child_ids && e.child_ids.length > 0
            ? '<div class="d-row"><span class="k">'+e.child_ids.length+' biên lai con</span>'
              +'<span class="v">'
              +e.child_ids.map(cid =>
                '<button class="split-id-link" onclick="openDrawer(\''+cid+'\')">'+cid.slice(0,8)+'…</button>'
              ).join(' ')
              +'</span></div>'
            : '')
          +'</div>'
          +'</div>'
        : '')

    +'<div class="d-section">'
      +'<div class="d-section-title">Hạch toán kế toán (TT 200/2014/TT-BTC)</div>'
      +'<div class="acct-codes">'
        +'<div class="acct-box"><div class="acct-label">TK Nợ (Debit)</div><div class="acct-code">'+esc(e.accounting_debit)+'</div></div>'
        +'<div class="acct-arrow">→</div>'
        +'<div class="acct-box"><div class="acct-label">TK Có (Credit)</div><div class="acct-code">'+esc(e.accounting_credit)+'</div></div>'
      +'</div>'
    +'</div>'

    +'<div class="d-section">'
      +'<div class="d-section-title">Tài liệu đính kèm ('+docs.length+')</div>'
      + docsHtml
    +'</div>'

    // Comments section (loaded after render)
    +'<div class="d-section comments-section">'
      +'<div class="d-section-title">Ghi chú & Bình luận</div>'
      +'<div id="comments-list"><div style="text-align:center;padding:16px"><span class="spinner"></span></div></div>'
      +'<div class="comment-form">'
        +'<textarea id="new-comment-ta" class="comment-ta" placeholder="Thêm ghi chú cho biên lai này…"></textarea>'
        +'<button class="comment-submit" onclick="submitComment(\''+e.id+'\')">Gửi ghi chú</button>'
      +'</div>'
    +'</div>'

    // Approval section
    +'<div class="d-section">'
      +'<div class="d-section-title">Phê duyệt kế toán</div>'
      + (!e.approval_decision
          ? '<div>'
            +'<textarea id="review-note" class="review-note-ta" placeholder="Ghi chú (tuỳ chọn)…"></textarea>'
            +'<div style="display:flex;gap:8px;margin-top:8px">'
            +'<button onclick="approveExpense(\''+e.id+'\')" class="btn-approve">✓ Phê duyệt</button>'
            +'<button onclick="rejectExpense(\''+e.id+'\')" class="btn-reject">✗ Từ chối</button>'
            +'</div>'
            +'</div>'
          : e.approval_decision === 'approved'
            ? '<div class="review-done">'
              +'<div style="display:flex;align-items:flex-start;gap:10px">'
              +'<div style="flex:1">'
              +'<span style="color:var(--ok);font-weight:600">✓ Đã phê duyệt</span>'
              +' <span style="color:var(--muted);font-size:12px">— '+(e.accountant_reviewed_at?new Date(e.accountant_reviewed_at).toLocaleString('vi-VN'):'')+'</span>'
              +(e.reviewer_note ? '<div style="margin-top:6px;color:#374151">'+esc(e.reviewer_note)+'</div>' : '')
              +'</div>'
              +'<button onclick="undoApproval(\''+e.id+'\')" class="btn btn-ghost"'
              +' style="font-size:12px;padding:4px 10px;flex-shrink:0">↩ Bỏ</button>'
              +'</div>'
              +'</div>'
            : '<div class="review-rejected">'
              +'<div style="display:flex;align-items:flex-start;gap:10px">'
              +'<div style="flex:1">'
              +'<span style="color:var(--danger);font-weight:600">✗ Đã từ chối</span>'
              +' <span style="color:var(--muted);font-size:12px">— '+(e.accountant_reviewed_at?new Date(e.accountant_reviewed_at).toLocaleString('vi-VN'):'')+'</span>'
              +(e.reviewer_note ? '<div style="margin-top:6px;color:#374151">'+esc(e.reviewer_note)+'</div>' : '')
              +'</div>'
              +'<button onclick="undoApproval(\''+e.id+'\')" class="btn btn-ghost"'
              +' style="font-size:12px;padding:4px 10px;flex-shrink:0">↩ Bỏ</button>'
              +'</div>'
              +'</div>'
        )
    +'</div>';
}

// ── ZIP download modal ────────────────────────────────────────────────────
function openZipModal() {
  const from = document.getElementById('db-from').value || document.getElementById('f-from').value;
  const to   = document.getElementById('db-to').value   || document.getElementById('f-to').value;
  if (from) document.getElementById('zip-from').value = from;
  if (to)   document.getElementById('zip-to').value   = to;
  document.getElementById('zip-preview-info').style.display = 'none';
  document.getElementById('zip-modal-err').classList.remove('visible');
  document.getElementById('zip-modal').classList.add('open');
}

function closeZipModal() {
  document.getElementById('zip-modal').classList.remove('open');
}

async function downloadZip() {
  const from     = document.getElementById('zip-from').value;
  const to       = document.getElementById('zip-to').value;
  const clientId = document.getElementById('zip-client').value;
  const errEl    = document.getElementById('zip-modal-err');
  const btn      = document.getElementById('zip-download-btn');
  const info     = document.getElementById('zip-preview-info');

  errEl.classList.remove('visible');
  if (!from || !to) {
    errEl.textContent = '⛔ Vui lòng chọn ngày bắt đầu và kết thúc.';
    errEl.classList.add('visible');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang tạo ZIP…';
  info.style.display = 'none';

  try {
    const qs  = new URLSearchParams({ from, to, ...(clientId ? { clientId } : {}) });
    const res = await fetch('/api/accounting/documents/zip?'+qs.toString(), {
      headers: { Authorization: 'Bearer '+token },
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.message || 'HTTP '+res.status);
    }

    const expenseCount = res.headers.get('X-Expense-Count') || '?';
    const fileCount    = res.headers.get('X-File-Count') || '?';
    const blob         = await res.blob();
    const filename     = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]
                         || \`reclaim-docs-\${from}-\${to}.zip\`;

    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 15000);

    info.style.display = '';
    info.innerHTML = '✅ Đã tạo ZIP: '+(expenseCount)+' biên lai, '+(fileCount)+' file.';
    showToast('Tải xuống ZIP hoàn tất', 'ok', 3000);
    setTimeout(closeZipModal, 1500);
  } catch(e) {
    errEl.textContent = '⛔ ' + e.message;
    errEl.classList.add('visible');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '📦 Tải xuống ZIP';
  }
}

// ── Export modal ──────────────────────────────────────────────────────────
let _lastExportPkg = null; // stash preview payload for use in step 3

function openExportModal() {
  const from = document.getElementById('f-from').value || document.getElementById('db-from').value;
  const to   = document.getElementById('f-to').value   || document.getElementById('db-to').value;
  if (from) document.getElementById('ex-from').value = from;
  if (to)   document.getElementById('ex-to').value   = to;
  _lastExportPkg = null;
  goExportStep(1);
  document.getElementById('export-modal').classList.add('open');
}

function closeExportModal() {
  document.getElementById('export-modal').classList.remove('open');
}

function closeExportDone() {
  closeExportModal();
  if (activeTab === 'review') loadData();
  else loadDashboard();
}

function closeExportModalClearErr() {
  ['modal-err','modal-err-2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('visible');
  });
  closeExportModal();
}

function backToStep1() { goExportStep(1); }

function goExportStep(step) {
  document.getElementById('ex-panel-1').style.display = step===1 ? '' : 'none';
  document.getElementById('ex-panel-2').style.display = step===2 ? '' : 'none';
  document.getElementById('ex-panel-3').style.display = step===3 ? '' : 'none';

  const states = [
    step>1 ? 'done' : 'active',
    step>2 ? 'done' : step===2 ? 'active' : 'idle',
    step===3 ? 'active' : 'idle',
  ];
  ['ex-s1','ex-s2','ex-s3'].forEach((id, i) => {
    const el = document.getElementById(id);
    el.className = 'ex-step ' + states[i];
    el.querySelector('.ex-step-num').textContent = states[i]==='done' ? '✓' : String(i+1);
  });
  ['ex-c1','ex-c2'].forEach((id, i) => {
    document.getElementById(id).className = 'ex-connector' + (step > i+1 ? ' done' : '');
  });
}

async function previewExport() {
  const from     = document.getElementById('ex-from').value;
  const to       = document.getElementById('ex-to').value;
  const clientId = document.getElementById('ex-client').value;
  const btn      = document.getElementById('ex-preview-btn');

  if (!from || !to) { showModalError('Vui lòng chọn ngày bắt đầu và kết thúc.'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang kiểm tra…';

  try {
    const qs  = new URLSearchParams({ from, to, mark_exported: 'false', ...(clientId?{clientId}:{}) });
    const pkg = await api('/erp/export/structured?'+qs.toString());
    _lastExportPkg = pkg;
    const m   = pkg.metadata;
    const vr  = pkg.validation_report;
    const sg  = pkg.summary?.split_groups ?? [];
    const bg  = pkg.summary?.by_gate ?? {};

    // Validation section
    let validHtml = '';
    if (vr) {
      if (vr.error_count > 0) {
        validHtml += '<div style="color:var(--danger);font-weight:600;margin-bottom:4px">⛔ '+vr.error_count+' lỗi chặn xuất:</div>';
        vr.blocking_reasons.forEach(r => { validHtml += '<div style="margin-left:12px;color:var(--danger)">• '+esc(r)+'</div>'; });
      }
      if (vr.warning_count > 0) {
        validHtml += '<div style="color:var(--warn);font-weight:600;margin-top:6px;margin-bottom:2px">⚠️ '+vr.warning_count+' cảnh báo</div>';
        vr.issues.filter(i => i.level==='WARN').forEach(i => {
          validHtml += '<div style="margin-left:12px;color:#78350f;font-size:12px">• '+esc(i.message)+'</div>';
        });
      }
      if (vr.valid && vr.error_count===0 && vr.warning_count===0) {
        validHtml += '<div style="color:var(--ok)">✓ Không có vấn đề</div>';
      }
    }

    // Gate breakdown
    const gateHtml =
      '<div style="display:flex;gap:6px;margin:8px 0">'
      +'<div style="flex:1;background:var(--g1-lt);border-radius:5px;padding:7px 8px;text-align:center">'
        +'<div style="font-size:10px;font-weight:700;color:var(--g1)">Gate 1</div>'
        +'<div style="font-size:13px;font-weight:700;color:var(--g1)">'+(bg.gate_1?.count??0)+' biên lai</div>'
        +'<div style="font-size:11px;color:var(--g1)">'+Number(bg.gate_1?.total_deductible_vnd??0).toLocaleString('vi-VN')+' VND</div>'
      +'</div>'
      +'<div style="flex:1;background:var(--g2-lt);border-radius:5px;padding:7px 8px;text-align:center">'
        +'<div style="font-size:10px;font-weight:700;color:var(--g2)">Gate 2</div>'
        +'<div style="font-size:13px;font-weight:700;color:var(--g2)">'+(bg.gate_2?.count??0)+' biên lai</div>'
        +'<div style="font-size:11px;color:var(--g2)">'+Number(bg.gate_2?.total_deductible_vnd??0).toLocaleString('vi-VN')+' VND</div>'
      +'</div>'
      +'<div style="flex:1;background:var(--g3-lt);border-radius:5px;padding:7px 8px;text-align:center">'
        +'<div style="font-size:10px;font-weight:700;color:var(--g3)">Gate 3</div>'
        +'<div style="font-size:13px;font-weight:700;color:var(--g3)">'+(bg.gate_3?.count??0)+' biên lai</div>'
        +'<div style="font-size:11px;color:var(--g3)">'+Number(bg.gate_3?.total_deductible_vnd??0).toLocaleString('vi-VN')+' VND</div>'
      +'</div>'
      +'</div>';

    // Split groups detail
    let splitHtml = '';
    if (sg.length > 0) {
      splitHtml = '<div style="margin-top:8px;background:#faf5ff;border:1px solid #ddd6fe;border-radius:6px;padding:10px">'
        +'<div style="font-size:11px;font-weight:700;color:#6d28d9;margin-bottom:6px">⑂ '+sg.length+' nhóm biên lai split</div>';
      sg.forEach(g => {
        splitHtml += '<div style="font-size:12px;margin-bottom:4px">'
          +'<span style="color:#6d28d9;font-family:monospace">'+g.parent_id.slice(0,8)+'…</span>'
          +' + <strong>'+g.child_ids.length+'</strong> phần tử con'
          +' — <strong>'+Number(g.total_split).toLocaleString('vi-VN')+' VND</strong>'
          +'</div>';
      });
      splitHtml += '</div>';
    }

    const emptyWarn = m.expense_count===0
      ? '<div style="color:var(--warn);font-weight:600;margin-bottom:8px">⚠️ Không có biên lai đã duyệt kế toán trong kỳ này.</div>'
      : '';

    document.getElementById('preview-box').innerHTML =
      '<div style="margin-bottom:10px">'
        +'<strong style="font-size:14px">Xem trước xuất dữ liệu</strong>'
        +'<div style="font-size:12px;color:var(--muted);margin-top:2px">'+m.period.from+' → '+m.period.to+(m.client_name?' · '+esc(m.client_name):'')+'</div>'
      +'</div>'
      + emptyWarn
      +'<div style="display:flex;gap:16px;margin-bottom:10px">'
        +'<div><div style="font-size:11px;color:var(--muted)">Số biên lai</div><div style="font-size:20px;font-weight:800">'+m.expense_count+'</div></div>'
        +'<div><div style="font-size:11px;color:var(--muted)">Tổng khấu trừ</div><div style="font-size:16px;font-weight:700;color:var(--ok)">'+Number(m.total_deductible_vnd).toLocaleString('vi-VN')+' VND</div></div>'
        +(Number(m.total_pit_applicable_vnd)>0
          ? '<div><div style="font-size:11px;color:var(--muted)">PIT</div><div style="font-size:14px;font-weight:700;color:var(--warn)">'+Number(m.total_pit_applicable_vnd).toLocaleString('vi-VN')+' VND</div></div>'
          : '')
      +'</div>'
      + gateHtml
      + splitHtml
      +'<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">'
        + validHtml
      +'</div>';

    const canExport = m.expense_count > 0 && vr.valid;
    document.getElementById('confirm-export-btn').disabled = !canExport;
    document.getElementById('misa-csv-btn').disabled       = !canExport;
    goExportStep(2);
  } catch(e) {
    showModalError('Lỗi kiểm tra dữ liệu: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔍 Xem trước →';
  }
}

function showExportSummary(pkg, format) {
  const m  = pkg.metadata;
  const sg = pkg.summary?.split_groups ?? [];
  const bg = pkg.summary?.by_gate ?? {};
  const fmt = v => Number(v).toLocaleString('vi-VN');
  const filename = format === 'csv'
    ? \`reclaim-misa-\${m.period.from}-\${m.period.to}.csv\`
    : \`reclaim-export-\${m.period.from}-\${m.period.to}.json\`;

  const gateRows = [
    { k:'Gate 1 — Công tác phí', c:bg.gate_1?.count??0, v:bg.gate_1?.total_deductible_vnd??'0', cls:'var(--g1)' },
    { k:'Gate 2 — Phúc lợi',     c:bg.gate_2?.count??0, v:bg.gate_2?.total_deductible_vnd??'0', cls:'var(--g2)' },
    { k:'Gate 3 — Chi hộ',       c:bg.gate_3?.count??0, v:bg.gate_3?.total_deductible_vnd??'0', cls:'var(--g3)' },
  ].filter(r => r.c > 0);

  document.getElementById('ex-summary-card').innerHTML =
    '<div class="ex-summary-title">✅ Xuất dữ liệu hoàn tất</div>'
    +'<div class="ex-sum-grid">'
      +'<div class="ex-sum-item"><div class="ex-sum-label">Số biên lai</div><div class="ex-sum-value">'+m.expense_count+'</div></div>'
      +'<div class="ex-sum-item"><div class="ex-sum-label">Tổng khấu trừ</div><div class="ex-sum-value" style="font-size:13px">'+fmt(m.total_deductible_vnd)+' VND</div></div>'
      +(Number(m.total_pit_applicable_vnd)>0
        ? '<div class="ex-sum-item"><div class="ex-sum-label">PIT</div><div class="ex-sum-value" style="font-size:13px;color:#b45309">'+fmt(m.total_pit_applicable_vnd)+' VND</div></div>'
        : '<div class="ex-sum-item"><div class="ex-sum-label">PIT</div><div class="ex-sum-value" style="font-size:12px">Không phát sinh</div></div>')
      +(sg.length>0
        ? '<div class="ex-sum-item"><div class="ex-sum-label">Nhóm split</div><div class="ex-sum-value">'+sg.length+'</div></div>'
        : '')
    +'</div>'
    +(gateRows.length
      ? '<div style="margin-bottom:10px">'
          +gateRows.map(r =>
            '<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0;border-bottom:1px solid #bbf7d0">'
            +'<span style="color:'+r.cls+';font-weight:600">'+r.k+' ('+r.c+')</span>'
            +'<span style="font-weight:700;color:#14532d">'+fmt(r.v)+' VND</span>'
            +'</div>'
          ).join('')
        +'</div>'
      : '')
    +'<div style="font-size:12px;color:#166534">📁 File đã tải xuống: <strong>'+esc(filename)+'</strong></div>';

  goExportStep(3);
}

async function confirmExport() {
  const from     = document.getElementById('ex-from').value;
  const to       = document.getElementById('ex-to').value;
  const clientId = document.getElementById('ex-client').value;
  const btn      = document.getElementById('confirm-export-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Đang xuất…';

  try {
    const qs  = new URLSearchParams({ from, to, ...(clientId?{clientId}:{}) });
    const pkg = await api('/erp/export/structured?'+qs.toString());

    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = \`reclaim-export-\${from}-\${to}.json\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showExportSummary(pkg, 'json');
  } catch(e) {
    const el = document.getElementById('modal-err-2');
    if (el) { el.textContent = '⛔ Lỗi xuất dữ liệu: '+e.message; el.classList.add('visible'); }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✅ Xuất JSON &amp; tải file';
  }
}

async function confirmMisaCsv() {
  const from     = document.getElementById('ex-from').value;
  const to       = document.getElementById('ex-to').value;
  const clientId = document.getElementById('ex-client').value;
  const btn      = document.getElementById('misa-csv-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const qs  = new URLSearchParams({ from, to, ...(clientId?{clientId}:{}) });
    const res = await fetch('/api/erp/export/misa-csv?'+qs.toString(), {
      headers: { Authorization: 'Bearer '+token },
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.message || 'HTTP '+res.status);
    }
    const csv  = await res.text();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = \`reclaim-misa-\${from}-\${to}.csv\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // For the summary we need the structured pkg — if preview was done it's stashed; else fetch dry-run
    const summaryPkg = _lastExportPkg ?? await api('/erp/export/structured?'+new URLSearchParams({ from, to, mark_exported:'false', ...(clientId?{clientId}:{}) }).toString());
    showExportSummary(summaryPkg, 'csv');
  } catch(e) {
    const el = document.getElementById('modal-err-2');
    if (el) { el.textContent = '⛔ Lỗi xuất MISA CSV: '+e.message; el.classList.add('visible'); }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '📋 MISA CSV';
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────
function showToast(message, type='error', durationMs=5000) {
  const icons = { error:'⛔', warn:'⚠️', ok:'✅', info:'ℹ️' };
  const div = document.createElement('div');
  div.className = 'toast toast-'+type;
  div.innerHTML =
    '<span class="toast-icon">'+icons[type]+'</span>'
    +'<span style="flex:1">'+esc(message)+'</span>'
    +'<button class="toast-close" onclick="this.closest(\'.toast\').remove()">✕</button>';
  document.getElementById('toast-container').appendChild(div);
  if (durationMs > 0) setTimeout(() => div.remove(), durationMs);
}

function showModalError(message) {
  const el = document.getElementById('modal-err');
  if (!el) { showToast(message); return; }
  el.textContent = '⛔ ' + message;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 6000);
}

// ── Pagination ────────────────────────────────────────────────────────────
function search() { currentPage = 1; loadData(); }

function renderPagination() {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }
  el.innerHTML =
    '<button class="pg-btn"'+(currentPage<=1?' disabled':' onclick="goPage('+(currentPage-1)+')"')+'>← Trước</button>'
    +'<span class="pg-info">Trang '+currentPage+' / '+totalPages+' &nbsp;·&nbsp; '+totalCount+' biên lai</span>'
    +'<button class="pg-btn"'+(currentPage>=totalPages?' disabled':' onclick="goPage('+(currentPage+1)+')"')+'>Sau →</button>';
}

function goPage(page) { currentPage = page; loadData(); }

// ── Approval actions ──────────────────────────────────────────────────────
async function approveExpense(id) {
  const noteEl = document.getElementById('review-note');
  const note   = noteEl ? noteEl.value.trim() : '';
  try {
    await api('/accounting/expenses/'+id+'/review', {
      method: 'PATCH',
      body: JSON.stringify({ note: note || undefined }),
    });
    showToast('Đã phê duyệt', 'ok', 3000);
    openDrawer(id);
    const idx = expenses.findIndex(e => e.id === id);
    if (idx >= 0) {
      expenses[idx].accountant_reviewed_at = new Date().toISOString();
      expenses[idx].reviewer_note = note || null;
      expenses[idx].approval_decision = 'approved';
      expenses[idx].status = 'approved';
      renderTable();
    }
  } catch(err) { showToast('Lỗi: '+err.message, 'error'); }
}

async function rejectExpense(id) {
  const noteEl = document.getElementById('review-note');
  const note   = noteEl ? noteEl.value.trim() : '';
  try {
    await api('/accounting/expenses/'+id+'/reject', {
      method: 'POST',
      body: JSON.stringify({ note: note || undefined }),
    });
    showToast('Đã từ chối biên lai', 'warn', 3000);
    openDrawer(id);
    const idx = expenses.findIndex(e => e.id === id);
    if (idx >= 0) {
      expenses[idx].accountant_reviewed_at = new Date().toISOString();
      expenses[idx].reviewer_note = note || null;
      expenses[idx].approval_decision = 'rejected';
      expenses[idx].status = 'rejected';
      renderTable();
    }
  } catch(err) { showToast('Lỗi: '+err.message, 'error'); }
}

async function undoApproval(id) {
  try {
    await api('/accounting/expenses/'+id+'/review', { method: 'DELETE' });
    showToast('Đã bỏ phê duyệt', 'info', 3000);
    openDrawer(id);
    const idx = expenses.findIndex(e => e.id === id);
    if (idx >= 0) {
      expenses[idx].accountant_reviewed_at = null;
      expenses[idx].reviewer_note = null;
      expenses[idx].approval_decision = null;
      expenses[idx].status = 'approved';
      renderTable();
    }
  } catch(err) { showToast('Lỗi: '+err.message, 'error'); }
}

// ── Comments ──────────────────────────────────────────────────────────────
async function loadComments(expenseId) {
  const el = document.getElementById('comments-list');
  if (!el) return;
  try {
    const comments = await api('/accounting/expenses/'+expenseId+'/comments');
    renderComments(comments);
  } catch(e) {
    if (el) el.innerHTML = '<div style="color:var(--danger);font-size:12px">Không thể tải ghi chú: '+esc(e.message)+'</div>';
  }
}

function renderComments(comments) {
  const el = document.getElementById('comments-list');
  if (!el) return;
  if (!comments.length) {
    el.innerHTML = '<div class="comment-empty">Chưa có ghi chú nào.</div>';
    return;
  }
  const ROLE_LABEL = { partner_admin: 'KT', client_admin: 'NB', employee: 'NV' };
  const ROLE_CLS   = { partner_admin: 'role-partner', client_admin: 'role-client', employee: '' };
  el.innerHTML = comments.map(c => {
    const timeStr = new Date(c.created_at).toLocaleString('vi-VN', { dateStyle:'short', timeStyle:'short' });
    const roleLbl = ROLE_LABEL[c.user_role] || c.user_role;
    const roleCls = ROLE_CLS[c.user_role]   || '';
    return '<div class="comment-item">'
      +'<div class="comment-meta">'
      +'<span class="comment-role-badge '+roleCls+'">'+esc(roleLbl)+'</span>'
      +'<span>'+esc(c.user_email)+'</span>'
      +'<span>'+timeStr+'</span>'
      +'</div>'
      +'<div class="comment-body">'+esc(c.body)+'</div>'
      +'</div>';
  }).join('');
}

async function submitComment(expenseId) {
  const ta  = document.getElementById('new-comment-ta');
  const btn = ta?.closest('.comment-form')?.querySelector('.comment-submit');
  const body = ta?.value?.trim();
  if (!body) { showToast('Vui lòng nhập nội dung ghi chú', 'warn', 3000); return; }
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  try {
    await api('/accounting/expenses/'+expenseId+'/comments', {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
    ta.value = '';
    await loadComments(expenseId);
    showToast('Đã thêm ghi chú', 'ok', 2500);
  } catch(e) {
    showToast('Lỗi: '+e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Gửi ghi chú'; }
  }
}

// ── Secure file download ──────────────────────────────────────────────────
async function downloadSecureFile(url) {
  if (!url) return;
  let fetchUrl = url;
  try { fetchUrl = new URL(url).pathname; } catch {}
  try {
    const res = await fetch(fetchUrl, { headers: { Authorization: 'Bearer ' + token } });
    if (res.status === 404) throw new Error('File không tìm thấy');
    if (res.status === 403) throw new Error('Không có quyền truy cập');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const blob    = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href        = blobUrl;
    a.target      = '_blank';
    a.rel         = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
  } catch(e) {
    showToast('Không thể tải file: ' + (e.message || 'Lỗi không xác định'), 'error');
  }
}

// ── Notifications ─────────────────────────────────────────────────────────
let notifPanelOpen   = false;
let notifPollHandle  = null;

function toggleNotifPanel() {
  notifPanelOpen = !notifPanelOpen;
  const panel = document.getElementById('notif-panel');
  panel.style.display = notifPanelOpen ? 'flex' : 'none';
  if (notifPanelOpen) loadNotifications();
}

function closeNotifPanelIfOpen(e) {
  if (!notifPanelOpen) return;
  const panel = document.getElementById('notif-panel');
  const btn   = document.getElementById('notif-btn');
  if (!panel.contains(e.target) && !btn.contains(e.target)) {
    notifPanelOpen = false;
    panel.style.display = 'none';
  }
}

async function loadNotifications() {
  try {
    const notifs = await api('/notifications');
    renderNotifications(notifs);
    updateNotifBadge(notifs.filter(n => !n.read_at).length);
  } catch {}
}

async function pollNotifCount() {
  try {
    const { unread } = await api('/notifications/count');
    updateNotifBadge(unread);
  } catch {}
}

function updateNotifBadge(count) {
  const el = document.getElementById('notif-count');
  if (count > 0) {
    el.textContent = count > 99 ? '99+' : String(count);
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

function renderNotifications(notifs) {
  const list = document.getElementById('notif-list');
  if (!notifs.length) {
    list.innerHTML = '<div class="notif-empty">Không có thông báo nào.</div>';
    return;
  }
  const TYPE_META = {
    ready_for_review:   { icon: '📋', cls: 'ni-ready' },
    expense_approved:   { icon: '✅', cls: 'ni-approved' },
    expense_rejected:   { icon: '❌', cls: 'ni-rejected' },
  };
  list.innerHTML = notifs.map(n => {
    const m      = TYPE_META[n.type] || { icon: '🔔', cls: '' };
    const unread = !n.read_at;
    const when   = timeAgo(n.created_at);
    return '<div class="notif-item '+(unread?'unread':'')+'" onclick="handleNotifClick(\''+n.id+'\',\''+esc(n.resource_id||'')+'\','+unread+')">'
      +'<div class="notif-icon '+m.cls+'">'+m.icon+'</div>'
      +'<div class="notif-body">'
      +'<div class="notif-ntitle">'+esc(n.title)+'</div>'
      +'<div class="notif-nbody">'+esc(n.body)+'</div>'
      +'<div class="notif-ntime">'+when+'</div>'
      +'</div>'
      +(unread ? '<div class="notif-unread-dot"></div>' : '')
      +'</div>';
  }).join('');
}

async function handleNotifClick(notifId, resourceId, wasUnread) {
  if (wasUnread) {
    try { await api('/notifications/'+notifId+'/read', { method: 'PATCH' }); } catch {}
  }
  toggleNotifPanel();
  if (resourceId) {
    goToReview(null, null);
    // open the drawer for this expense
    setTimeout(() => openDrawer(resourceId), 300);
  }
}

async function markAllNotifRead() {
  try {
    await api('/notifications/read-all', { method: 'POST' });
    updateNotifBadge(0);
    loadNotifications();
  } catch {}
}

function openNotifSettings() {
  toggleNotifPanel();
  api('/notifications/settings').then(s => {
    document.getElementById('ns-email-toggle').checked = Boolean(s.email_enabled);
  }).catch(() => {});
  document.getElementById('ns-modal').classList.add('open');
}

function closeNotifSettings() {
  document.getElementById('ns-modal').classList.remove('open');
}

async function saveNotifSettings() {
  const enabled = document.getElementById('ns-email-toggle').checked;
  try {
    await api('/notifications/settings', {
      method: 'PATCH',
      body: JSON.stringify({ email_enabled: enabled }),
    });
    showToast(enabled ? 'Đã bật thông báo email' : 'Đã tắt thông báo email', 'ok', 3000);
  } catch (e) {
    showToast('Không thể lưu cài đặt: ' + e.message, 'error');
  }
}

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60)     return 'Vừa xong';
  if (diff < 3600)   return Math.floor(diff / 60) + ' phút trước';
  if (diff < 86400)  return Math.floor(diff / 3600) + ' giờ trước';
  return Math.floor(diff / 86400) + ' ngày trước';
}

function startNotifPolling() {
  pollNotifCount();
  notifPollHandle = setInterval(pollNotifCount, 30000);
}

// ── Helpers ───────────────────────────────────────────────────────────────
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
</script>
</body>
</html>`;
}
//# sourceMappingURL=accounting.html.js.map