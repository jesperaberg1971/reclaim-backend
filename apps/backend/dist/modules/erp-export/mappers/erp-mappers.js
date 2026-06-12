"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToMISA = mapToMISA;
exports.mapToBizzi = mapToBizzi;
exports.mapToSAP = mapToSAP;
const decimal_js_1 = require("decimal.js");
const CREDIT_ACCT = { 1: '111', 2: '111', 3: '141' };
const KHOAN_MUC = {
    travel_allowance: { code: 'CONG_TAC_PHI', name: 'Công tác phí' },
    welfare_allowance: { code: 'PHUC_LOI_NV', name: 'Phúc lợi nhân viên' },
    personal_card_reimbursement: { code: 'HOAN_UNG', name: 'Hoàn ứng thẻ cá nhân' },
    flagged: { code: 'CAN_KIEM_TRA', name: 'Cần kiểm tra' },
};
function fmtDate(d) {
    return d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10);
}
function shortId(id) {
    return id.slice(0, 8).toUpperCase();
}
function mapToMISA(expenses) {
    return expenses.map((e) => {
        const gate = Number(e.gate_applied);
        const credit = CREDIT_ACCT[gate] ?? '111';
        const km = KHOAN_MUC[e.final_category] ?? KHOAN_MUC.flagged;
        const amt = new decimal_js_1.Decimal(String(e.final_amount_deductible)).toFixed(0);
        const ocr = (e.ocr_raw_json ?? {});
        return {
            NgayHachToan: fmtDate(e.receipt_date),
            NgayChungTu: fmtDate(e.receipt_date),
            SoChungTu: `RCL-${shortId(e.id)}`,
            DienGiai: `Reclaim - ${km.name}${ocr.vendor ? ' - ' + ocr.vendor : ''}`,
            TKNo: '6422',
            TKCo: credit,
            SoTien: amt,
            MaDoiTuong: e.employee_id ?? '',
            TenDoiTuong: e.employee?.full_name ?? '',
            MaNhaCungCap: '',
            TenNhaCungCap: ocr.vendor ?? '',
            KhoanMuc: km.code,
            TenKhoanMuc: km.name,
            SoHoaDon: ocr.invoice_number ?? '',
            NgayHoaDon: ocr.invoice_date ?? '',
            GhiChu: `Gate ${gate}${e.pit_flag ? ' | PIT' : ''}`,
        };
    });
}
function mapToBizzi(expenses) {
    return expenses.map((e) => {
        const gate = Number(e.gate_applied);
        const credit = CREDIT_ACCT[gate] ?? '111';
        const km = KHOAN_MUC[e.final_category] ?? KHOAN_MUC.flagged;
        const ocr = (e.ocr_raw_json ?? {});
        return {
            transaction_date: fmtDate(e.receipt_date),
            reference_number: `RCL-${shortId(e.id)}`,
            description: `Reclaim - ${km.name}`,
            debit_account: '6422',
            credit_account: credit,
            amount_vnd: new decimal_js_1.Decimal(String(e.final_amount_deductible)).toFixed(0),
            currency: e.currency ?? 'VND',
            vendor_name: ocr.vendor ?? null,
            vendor_tax_code: ocr.vendor_tax_code ?? null,
            invoice_number: ocr.invoice_number ?? null,
            invoice_date: ocr.invoice_date ?? null,
            expense_type: km.code,
            expense_type_name: km.name,
            gate: gate,
            pit_applicable: Boolean(e.pit_flag),
            reclaim_expense_id: e.id,
            parent_expense_id: e.parent_expense_id ?? null,
        };
    });
}
function mapToSAP(expenses) {
    const COST_ELEMENT = {
        travel_allowance: '640010',
        welfare_allowance: '640020',
        personal_card_reimbursement: '640030',
        flagged: '640099',
    };
    const CONTRA = {
        1: { account: '111000', accountType: 'S' },
        2: { account: '111000', accountType: 'S' },
        3: { account: '141000', accountType: 'S' },
    };
    const items = expenses.flatMap((e, idx) => {
        const gate = Number(e.gate_applied);
        const contra = CONTRA[gate] ?? CONTRA[2];
        const costEl = COST_ELEMENT[e.final_category] ?? COST_ELEMENT.flagged;
        const amtStr = new decimal_js_1.Decimal(String(e.final_amount_deductible)).toFixed(2);
        const lineBase = (idx + 1) * 10;
        const ocr = (e.ocr_raw_json ?? {});
        return [
            {
                LineItem: lineBase,
                PostingKey: '40',
                GLAccount: '6422' + costEl.slice(3),
                CostElement: costEl,
                Amount: amtStr,
                Currency: 'VND',
                DocumentDate: fmtDate(e.receipt_date),
                Text: `Reclaim ${KHOAN_MUC[e.final_category]?.name ?? e.final_category}`,
                Assignment: `RCL-${shortId(e.id)}`,
                Reference: ocr.invoice_number ?? '',
            },
            {
                LineItem: lineBase + 1,
                PostingKey: '50',
                GLAccount: contra.account,
                CostElement: '',
                Amount: amtStr,
                Currency: 'VND',
                DocumentDate: fmtDate(e.receipt_date),
                Text: e.employee?.full_name ?? e.employee_id,
                Assignment: `RCL-${shortId(e.id)}`,
                Reference: '',
            },
        ];
    });
    return {
        header: {
            CompanyCode: 'VN01',
            DocumentType: 'KR',
            FiscalPeriod: '',
            PostingDate: new Date().toISOString().slice(0, 10),
            DocumentDate: new Date().toISOString().slice(0, 10),
            Reference: `RECLAIM-${new Date().toISOString().slice(0, 7)}`,
            HeaderText: `Reclaim expense export — ${expenses.length} records`,
        },
        items,
    };
}
//# sourceMappingURL=erp-mappers.js.map