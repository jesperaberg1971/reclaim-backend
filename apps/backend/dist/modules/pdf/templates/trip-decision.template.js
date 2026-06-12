"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTripDecisionHtml = buildTripDecisionHtml;
function fmtDate(d) {
    const dd = String(new Date(d).getDate()).padStart(2, '0');
    const mm = String(new Date(d).getMonth() + 1).padStart(2, '0');
    const yyyy = new Date(d).getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
function fmtVnd(amount) {
    return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function tripDays(start, end) {
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(end).setHours(0, 0, 0, 0);
    return Math.max(1, Math.round((e - s) / 86_400_000) + 1);
}
function buildTripDecisionHtml(data) {
    const { decisionNumber, companyName, companyAddress = '', employeeFullName, employeeInternalId, employeePosition = 'Nhân viên', destination, purpose, startDate, endDate, dailyAllowanceVnd, signedCity = 'Hà Nội', directorName = companyName, logoUrl = null, primaryColor = null, reportFooter = null, } = data;
    const days = tripDays(startDate, endDate);
    const totalVnd = dailyAllowanceVnd.mul(days);
    const signedDate = new Date();
    const brandColor = primaryColor ?? '#1a56db';
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <style>
    :root { --brand: ${brandColor}; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 13pt;
      color: #000;
      background: #fff;
      padding: 25mm 20mm 20mm 25mm;
    }
    .header { display: flex; justify-content: space-between; margin-bottom: 6mm; }
    .header-left, .header-right { width: 48%; text-align: center; font-size: 11pt; }
    .header-left .company-name { font-weight: bold; text-transform: uppercase; font-size: 12pt; }
    .header-left .address { font-size: 10pt; margin-top: 2mm; }
    .header-right .republic { font-weight: bold; text-transform: uppercase; font-size: 11pt; }
    .header-right .motto { font-size: 11pt; margin-top: 1mm; }
    .header-right .motto-underline { border-bottom: 1px solid #000; display: inline-block; }
    .doc-ref { text-align: left; font-size: 11pt; margin: 4mm 0 0 0; }
    .doc-ref .number { font-weight: bold; }
    .divider { border: none; border-top: 1px solid #000; margin: 5mm 0; }
    .title-section { text-align: center; margin: 6mm 0 4mm; }
    .title-main { font-weight: bold; text-transform: uppercase; font-size: 15pt; letter-spacing: 1px; }
    .title-sub { font-style: italic; font-size: 12pt; margin-top: 1mm; }
    .authority { text-align: center; font-weight: bold; text-transform: uppercase;
                 font-size: 12pt; margin: 4mm 0 5mm; }
    .grounds { margin: 3mm 0 5mm 0; line-height: 1.8; }
    .grounds p { margin-bottom: 1mm; }
    .grounds p::before { content: "Căn cứ "; }
    .decides-header { text-align: center; font-weight: bold; text-transform: uppercase;
                      font-size: 13pt; margin: 5mm 0 4mm; text-decoration: underline; }
    .article { margin: 4mm 0 3mm; }
    .article-title { font-weight: bold; }
    .article-body { margin-left: 5mm; line-height: 1.9; }
    .article-body td:first-child { font-weight: bold; width: 45mm; vertical-align: top; padding: 1mm 2mm 1mm 0; }
    .article-body td:last-child  { vertical-align: top; padding: 1mm 0; }
    .article-body table { border-collapse: collapse; width: 100%; }
    .signature { margin-top: 12mm; display: flex; justify-content: flex-end; }
    .signature-box { text-align: center; width: 70mm; }
    .signature-box .sig-location { font-size: 11pt; font-style: italic; }
    .signature-box .sig-title { font-weight: bold; text-transform: uppercase;
                                 font-size: 12pt; margin: 2mm 0 1mm; }
    .signature-box .sig-instruction { font-size: 10pt; font-style: italic; }
    .signature-box .sig-name { font-weight: bold; margin-top: 20mm; }
    .effective { font-style: italic; font-size: 11pt; margin-top: 5mm; }
    .stamp-area { border: 1px dashed #aaa; width: 35mm; height: 35mm; margin: 2mm auto;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 9pt; color: #aaa; text-align: center; }
  </style>
</head>
<body>

  <!-- ═══ HEADER ═══════════════════════════════════════════════════════════ -->
  <div class="header">
    <div class="header-left">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" style="max-height:18mm;max-width:55mm;object-fit:contain;display:block;margin-bottom:2mm;">` : ''}
      <div class="company-name">${companyName}</div>
      ${companyAddress ? `<div class="address">${companyAddress}</div>` : ''}
    </div>
    <div class="header-right">
      <div class="republic">Cộng hòa xã hội chủ nghĩa Việt Nam</div>
      <div class="motto"><span class="motto-underline">Độc lập – Tự do – Hạnh phúc</span></div>
    </div>
  </div>

  <div class="doc-ref">
    Số: <span class="number">${decisionNumber}</span>/QĐ-CT
  </div>
  <hr class="divider">

  <!-- ═══ TITLE ════════════════════════════════════════════════════════════ -->
  <div class="title-section">
    <div class="title-main">Quyết định</div>
    <div class="title-sub">Cử cán bộ, nhân viên đi công tác</div>
  </div>

  <div class="authority">${companyName.toUpperCase()}</div>

  <!-- ═══ GROUNDS ══════════════════════════════════════════════════════════ -->
  <div class="grounds">
    <p>Điều lệ tổ chức và hoạt động của ${companyName};</p>
    <p>Quyết định 167/2015/QĐ-TTg và Thông tư 96/2015/TT-BTC về chế độ công tác phí;</p>
    <p>Yêu cầu công việc thực tế.</p>
  </div>

  <div class="decides-header">Quyết định</div>

  <!-- ═══ ĐIỀU 1 ════════════════════════════════════════════════════════════ -->
  <div class="article">
    <div class="article-title">Điều 1. Cử cán bộ, nhân viên đi công tác</div>
    <div class="article-body">
      <table>
        <tr><td>Họ và tên:</td>       <td><strong>${employeeFullName}</strong></td></tr>
        <tr><td>Mã nhân viên:</td>    <td>${employeeInternalId}</td></tr>
        <tr><td>Chức vụ:</td>         <td>${employeePosition}</td></tr>
        <tr><td>Đơn vị:</td>          <td>${companyName}</td></tr>
      </table>
    </div>
  </div>

  <!-- ═══ ĐIỀU 2 ════════════════════════════════════════════════════════════ -->
  <div class="article">
    <div class="article-title">Điều 2. Địa điểm và thời gian công tác</div>
    <div class="article-body">
      <table>
        <tr><td>Địa điểm:</td>       <td>${destination}</td></tr>
        <tr><td>Mục đích:</td>       <td>${purpose}</td></tr>
        <tr><td>Thời gian:</td>
          <td>Từ ngày <strong>${fmtDate(startDate)}</strong>
              đến ngày <strong>${fmtDate(endDate)}</strong>
              (${days} ngày)</td></tr>
      </table>
    </div>
  </div>

  <!-- ═══ ĐIỀU 3 ════════════════════════════════════════════════════════════ -->
  <div class="article">
    <div class="article-title">Điều 3. Chế độ công tác phí</div>
    <div class="article-body">
      <table>
        <tr><td>Phụ cấp công tác:</td>
          <td><strong>${fmtVnd(dailyAllowanceVnd)}</strong> đồng/ngày</td></tr>
        <tr><td>Tổng phụ cấp:</td>
          <td><strong>${fmtVnd(totalVnd)}</strong> đồng
              (${days} ngày × ${fmtVnd(dailyAllowanceVnd)} đồng)</td></tr>
        <tr><td>Thanh toán qua:</td> <td>Phiếu chi / chuyển khoản sau chuyến đi</td></tr>
      </table>
    </div>
  </div>

  <!-- ═══ ĐIỀU 4 ════════════════════════════════════════════════════════════ -->
  <div class="article">
    <div class="article-title">Điều 4. Trách nhiệm thi hành</div>
    <div class="article-body">
      <p>Giao Ông/Bà <strong>${employeeFullName}</strong> và Phòng Kế toán chịu trách nhiệm
      thi hành Quyết định này. Quyết định có hiệu lực kể từ ngày ký.</p>
    </div>
  </div>

  <!-- ═══ SIGNATURE ══════════════════════════════════════════════════════════ -->
  <div class="effective">
    <em>Nơi nhận:<br>
    – Như Điều 4;<br>
    – Lưu: VT, KT.</em>
  </div>

  <div class="signature">
    <div class="signature-box">
      <div class="sig-location">
        ${signedCity}, ngày ${signedDate.getDate()} tháng ${signedDate.getMonth() + 1}
        năm ${signedDate.getFullYear()}
      </div>
      <div class="sig-title">Giám đốc</div>
      <div class="sig-instruction">(Ký, đóng dấu, ghi rõ họ và tên)</div>
      <div class="stamp-area">Con dấu</div>
      <div class="sig-name">${directorName}</div>
    </div>
  </div>
  ${reportFooter ? `<div style="margin-top:10mm;font-size:9pt;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:3mm;text-align:center;">${reportFooter}</div>` : ''}
</body>
</html>`;
}
//# sourceMappingURL=trip-decision.template.js.map