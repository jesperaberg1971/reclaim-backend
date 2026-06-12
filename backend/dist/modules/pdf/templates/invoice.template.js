"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInvoiceHtml = buildInvoiceHtml;
const decimal_js_1 = require("decimal.js");
function fmtDate(d) {
    const dd = String(new Date(d).getDate()).padStart(2, '0');
    const mm = String(new Date(d).getMonth() + 1).padStart(2, '0');
    const yyyy = new Date(d).getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
function fmtVnd(amount) {
    return amount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' ₫';
}
const TIER_LABELS = {
    micro: 'Micro (≤20 khách hàng)',
    small: 'Small (21–50 khách hàng)',
    medium: 'Medium (51–75 khách hàng)',
    large: 'Large (76–100 khách hàng)',
    enterprise: 'Enterprise (>100 khách hàng)',
};
function buildInvoiceHtml(data) {
    const { invoiceNumber, partnerName, partnerTaxCode, issuedAt, dueDate, periodStart, periodEnd, tier, planType, monthlyPriceVnd, discountPercentage, amountVnd, status, logoUrl = null, company_display_name = null, } = data;
    const displayName = company_display_name?.trim() || partnerName;
    const baseAmount = planType === 'annual'
        ? monthlyPriceVnd.mul(10)
        : monthlyPriceVnd;
    const discountAmount = discountPercentage > 0
        ? baseAmount.mul(discountPercentage).div(100)
        : new decimal_js_1.Decimal(0);
    const periodLabel = planType === 'annual' ? 'Năm' : 'Tháng';
    const planLabel = planType === 'annual' ? 'Hằng năm (10 tháng, 2 tháng miễn phí)' : 'Hằng tháng';
    const tierLabel = TIER_LABELS[tier] ?? tier;
    const statusLabel = status === 'paid' ? 'ĐÃ THANH TOÁN'
        : status === 'void' ? 'ĐÃ HỦY'
            : 'CHỜ THANH TOÁN';
    const statusColor = status === 'paid' ? '#059669'
        : status === 'void' ? '#6b7280'
            : '#d97706';
    return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #111827;
         background: white; padding: 48px 56px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 40px; padding-bottom: 28px; border-bottom: 2px solid #1a56db; }
  .brand { font-size: 26px; font-weight: 800; color: #1a56db; letter-spacing: -0.5px; }
  .brand span { color: #111827; }
  .brand-sub { font-size: 11px; color: #6b7280; margin-top: 3px; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 22px; font-weight: 700; color: #111827; letter-spacing: -0.3px; }
  .invoice-number { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .status-badge { display: inline-block; padding: 4px 14px; border-radius: 20px;
                  font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
                  color: white; margin-top: 8px; background: ${statusColor}; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
  .party-label { font-size: 10px; font-weight: 700; text-transform: uppercase;
                 letter-spacing: 0.8px; color: #6b7280; margin-bottom: 8px; }
  .party-name { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .party-detail { font-size: 12px; color: #4b5563; line-height: 1.6; }
  .dates-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
               background: #f9fafb; border-radius: 10px; padding: 18px 24px;
               margin-bottom: 32px; border: 1px solid #e5e7eb; }
  .date-item label { font-size: 10px; font-weight: 700; text-transform: uppercase;
                     letter-spacing: 0.6px; color: #6b7280; display: block; margin-bottom: 6px; }
  .date-item span { font-size: 14px; font-weight: 600; color: #111827; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #1a56db; color: white; padding: 11px 16px; font-size: 11px;
             font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 13px 16px; border-bottom: 1px solid #f3f4f6;
             font-size: 13px; color: #374151; }
  tbody td:last-child { text-align: right; font-weight: 600; }
  .subtotal-row td { font-size: 12px; color: #6b7280; padding: 8px 16px; border-bottom: none; }
  .subtotal-row td:last-child { font-weight: 500; }
  .total-row td { background: #eff6ff; font-size: 15px; font-weight: 700; color: #1a56db;
                  padding: 14px 16px; border-top: 2px solid #bfdbfe; }
  .payment-section { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;
                     padding: 20px 24px; margin-bottom: 32px; }
  .payment-section h3 { font-size: 12px; font-weight: 700; text-transform: uppercase;
                        letter-spacing: 0.6px; color: #374151; margin-bottom: 14px; }
  .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .payment-item label { font-size: 11px; color: #6b7280; display: block; margin-bottom: 4px; }
  .payment-item span { font-size: 13px; font-weight: 600; color: #111827; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;
            font-size: 11px; color: #9ca3af; text-align: center; line-height: 1.7; }
  .note { font-size: 12px; color: #4b5563; margin-top: 12px; padding: 12px 16px;
          background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; }
</style>
</head>
<body>

<div class="header">
  <div>
    ${logoUrl ? `<img src="${logoUrl}" alt="${displayName}" style="max-height:16mm;max-width:50mm;object-fit:contain;display:block;margin-bottom:3px;">` : `<div class="brand">Reclaim<span>!</span></div>`}
    <div class="brand-sub">${displayName} — Phần mềm quản lý chi phí doanh nghiệp</div>
  </div>
  <div class="invoice-meta">
    <div class="invoice-title">HÓA ĐƠN DỊCH VỤ</div>
    <div class="invoice-number">${invoiceNumber}</div>
    <div><span class="status-badge">${statusLabel}</span></div>
  </div>
</div>

<div class="parties">
  <div>
    <div class="party-label">Bên cung cấp</div>
    <div class="party-name">${displayName}</div>
    <div class="party-detail">
      Nền tảng quản lý chi phí<br>
      Hà Nội, Việt Nam<br>
      MST: 0109876543
    </div>
  </div>
  <div>
    <div class="party-label">Khách hàng</div>
    <div class="party-name">${partnerName}</div>
    <div class="party-detail">MST: ${partnerTaxCode}</div>
  </div>
</div>

<div class="dates-row">
  <div class="date-item">
    <label>Ngày phát hành</label>
    <span>${fmtDate(issuedAt)}</span>
  </div>
  <div class="date-item">
    <label>Hạn thanh toán</label>
    <span>${fmtDate(dueDate)}</span>
  </div>
  <div class="date-item">
    <label>${periodLabel} dịch vụ</label>
    <span>${fmtDate(periodStart)} – ${fmtDate(periodEnd)}</span>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Mô tả dịch vụ</th>
      <th>Gói cước</th>
      <th>Chu kỳ</th>
      <th>Thành tiền</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Reclaim! — Phần mềm quản lý biên lai &amp; chi phí</td>
      <td>${tierLabel}</td>
      <td>${planLabel}</td>
      <td>${fmtVnd(baseAmount)}</td>
    </tr>
    ${discountPercentage > 0 ? `
    <tr class="subtotal-row">
      <td colspan="3" style="text-align:right;color:#059669">
        Giảm giá beta pilot (${discountPercentage}%)
      </td>
      <td style="color:#059669">−${fmtVnd(discountAmount)}</td>
    </tr>` : ''}
  </tbody>
  <tfoot>
    <tr class="total-row">
      <td colspan="3" style="text-align:right">Tổng cộng (VAT 0%)</td>
      <td>${fmtVnd(amountVnd)}</td>
    </tr>
  </tfoot>
</table>

<div class="payment-section">
  <h3>Thông tin thanh toán</h3>
  <div class="payment-grid">
    <div class="payment-item">
      <label>Ngân hàng</label>
      <span>Vietcombank (VCB)</span>
    </div>
    <div class="payment-item">
      <label>Số tài khoản</label>
      <span>1234567890</span>
    </div>
    <div class="payment-item">
      <label>Chủ tài khoản</label>
      <span>RECLAIM SOFTWARE JSC</span>
    </div>
    <div class="payment-item">
      <label>Nội dung chuyển khoản</label>
      <span>${invoiceNumber} ${partnerTaxCode}</span>
    </div>
  </div>
  <div class="note">
    Vui lòng ghi đúng nội dung chuyển khoản để hệ thống tự động xác nhận.
    Thanh toán bằng VietQR: quét mã trong ứng dụng ngân hàng của bạn.
  </div>
</div>

<div class="footer">
  Hóa đơn này được tạo tự động bởi hệ thống Reclaim!<br>
  Mọi thắc mắc vui lòng liên hệ: support@reclaim.vn<br>
  © ${new Date(issuedAt).getFullYear()} Reclaim! Software. Bảo lưu mọi quyền.
</div>

</body>
</html>`;
}
//# sourceMappingURL=invoice.template.js.map