"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPolicyPrintHtml = buildPolicyPrintHtml;
const CATEGORY_LABELS = {
    travel_allowance: 'Công tác phí (Gate 1)',
    welfare_allowance: 'Phúc lợi nhân viên (Gate 2)',
    personal_card_reimbursement: 'Hoàn ứng thẻ cá nhân (Gate 3)',
};
function vnd(n) {
    return n.toLocaleString('vi-VN') + ' VND';
}
function buildPolicyPrintHtml(data) {
    const { partner_name, policy, effective_since } = data;
    const since = effective_since
        ? new Date(effective_since).toLocaleDateString('vi-VN')
        : 'Chưa có thay đổi';
    const categoryList = policy.allowed_categories.length
        ? policy.allowed_categories.map(c => `<li>${CATEGORY_LABELS[c] ?? c}</li>`).join('')
        : '<li><em>Tất cả loại được phép</em></li>';
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Chính sách chi phí — ${partner_name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,serif;font-size:13px;color:#111;background:#fff;padding:32px 48px}
  h1{font-size:20px;font-weight:700;margin-bottom:4px}
  .meta{font-size:12px;color:#555;margin-bottom:28px}
  h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
     color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin:20px 0 12px}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}
  th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #eee;font-size:13px}
  th{font-weight:700;background:#f9f9f9;width:55%}
  td{text-align:right;font-weight:600}
  .flag{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}
  .flag-on{background:#d1fae5;color:#065f46}
  .flag-off{background:#f3f4f6;color:#374151}
  ul{padding-left:18px;line-height:1.8}
  .footer{margin-top:40px;font-size:11px;color:#999;border-top:1px solid #eee;padding-top:10px}
  @media print{body{padding:16px 24px}}
</style>
</head>
<body>
<h1>Chính sách chi phí — ${partner_name}</h1>
<div class="meta">Ngày hiệu lực: ${since} &nbsp;|&nbsp; Xuất lúc: ${new Date().toLocaleString('vi-VN')}</div>

<h2>Hạn mức chi phí</h2>
<table>
  <tr><th>Trần chi bữa ăn / biên lai (Gate 1 &amp; 2)</th><td>${vnd(policy.meal_cap_vnd)}</td></tr>
  <tr><th>Phụ cấp công tác / ngày (Gate 1)</th><td>${vnd(policy.per_diem_daily_vnd)}</td></tr>
  <tr><th>Hạn mức phúc lợi / tháng / nhân viên (Gate 2)</th><td>${vnd(policy.welfare_monthly_cap_vnd)}</td></tr>
  <tr><th>Hạn mức hoàn ứng thẻ cá nhân (Gate 3)</th><td>${vnd(policy.personal_card_limit_vnd)}</td></tr>
</table>

<h2>Quy tắc kiểm soát</h2>
<table>
  <tr>
    <th>Yêu cầu biên lai gốc</th>
    <td>
      <span class="flag ${policy.require_original_receipt ? 'flag-on' : 'flag-off'}">
        ${policy.require_original_receipt ? 'Bắt buộc' : 'Không bắt buộc'}
      </span>
    </td>
  </tr>
</table>

<h2>Loại chi phí được phép</h2>
<ul>${categoryList}</ul>

<div class="footer">
  Tài liệu này được tạo tự động bởi hệ thống Reclaim! — không có giá trị pháp lý nếu không có chữ ký của người có thẩm quyền.
</div>
</body>
</html>`;
}
//# sourceMappingURL=policy-print.html.js.map