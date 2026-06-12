"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const import_service_1 = require("../import.service");
const PARTNER_ID = 'partner-uuid-1';
const ADMIN_ID = 'admin-uuid-1';
const VALID_EMP_ROWS = [
    { uuid: 'emp-uuid-1', emp_code: 'NV001', client_id: 'client-uuid-1' },
    { uuid: 'emp-uuid-2', emp_code: 'NV002', client_id: 'client-uuid-1' },
];
function makeService(queryImpl) {
    const ds = { query: jest.fn().mockImplementation(queryImpl) };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    return new import_service_1.ImportService(ds, audit);
}
beforeEach(() => jest.clearAllMocks());
describe('ImportService.parseCSV', () => {
    let svc;
    beforeEach(() => { svc = makeService(() => Promise.resolve([])); });
    test('parses basic CSV with header', () => {
        const csv = 'name,age\nAlice,30\nBob,25';
        const { headers, rows } = svc.parseCSV(csv);
        expect(headers).toEqual(['name', 'age']);
        expect(rows).toHaveLength(2);
        expect(rows[0].name).toBe('Alice');
        expect(rows[1].age).toBe('25');
    });
    test('handles quoted fields containing commas', () => {
        const csv = 'name,company\n"Smith, John","Reclaim, Inc."';
        const { rows } = svc.parseCSV(csv);
        expect(rows[0].name).toBe('Smith, John');
        expect(rows[0].company).toBe('Reclaim, Inc.');
    });
    test('handles escaped double-quotes inside quoted fields', () => {
        const csv = 'note\n"He said ""hello"""';
        const { rows } = svc.parseCSV(csv);
        expect(rows[0].note).toBe('He said "hello"');
    });
    test('normalises header to lowercase and trims whitespace', () => {
        const csv = 'Date , Employee_ID , Amount_VND\n2026-01-01,NV001,100000';
        const { headers } = svc.parseCSV(csv);
        expect(headers).toEqual(['date', 'employee_id', 'amount_vnd']);
    });
    test('skips empty lines', () => {
        const csv = 'name\nAlice\n\nBob\n  \n';
        const { rows } = svc.parseCSV(csv);
        expect(rows).toHaveLength(2);
    });
    test('handles CRLF line endings', () => {
        const csv = 'a,b\r\n1,2\r\n3,4';
        const { rows } = svc.parseCSV(csv);
        expect(rows).toHaveLength(2);
        expect(rows[0].a).toBe('1');
    });
    test('returns empty result for empty input', () => {
        const { headers, rows } = svc.parseCSV('');
        expect(headers).toEqual([]);
        expect(rows).toEqual([]);
    });
});
const BASE_CSV = 'date,employee_id,vendor_name,amount_vnd,category,description\n' +
    '2026-01-15,NV001,Grab,250000,travel_allowance,Công tác\n' +
    '2026-02-01,NV002,Nhà hàng,350000,welfare_allowance,Họp nhóm\n';
describe('ImportService.importExpenses — happy path', () => {
    test('inserts valid rows and returns correct counts', async () => {
        const svc = makeService((sql) => {
            if (sql.includes('FROM employees'))
                return Promise.resolve(VALID_EMP_ROWS);
            if (sql.includes('INSERT INTO expenses'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await svc.importExpenses(PARTNER_ID, Buffer.from(BASE_CSV));
        expect(result.imported).toBe(2);
        expect(result.skipped).toBe(0);
        expect(result.errors).toHaveLength(0);
        expect(result.dry_run).toBe(false);
    });
    test('dry run counts but does not insert', async () => {
        let insertCalled = false;
        const svc = makeService((sql) => {
            if (sql.includes('FROM employees'))
                return Promise.resolve(VALID_EMP_ROWS);
            if (sql.includes('INSERT INTO expenses')) {
                insertCalled = true;
                return Promise.resolve([]);
            }
            return Promise.resolve([]);
        });
        const result = await svc.importExpenses(PARTNER_ID, Buffer.from(BASE_CSV), { dry_run: true });
        expect(result.dry_run).toBe(true);
        expect(result.imported).toBe(0);
        expect(insertCalled).toBe(false);
    });
    test('accepts DD/MM/YYYY date format', async () => {
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\n15/01/2026,NV001,Shop,200000,travel_allowance,\n';
        const svc = makeService((sql) => {
            if (sql.includes('FROM employees'))
                return Promise.resolve(VALID_EMP_ROWS);
            if (sql.includes('INSERT INTO expenses'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await svc.importExpenses(PARTNER_ID, Buffer.from(csv));
        expect(result.imported).toBe(1);
        expect(result.errors).toHaveLength(0);
    });
    test('accepts amount with comma separator (1,000,000)', async () => {
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\n2026-01-01,NV001,Shop,"1,500,000",welfare_allowance,\n';
        const svc = makeService((sql) => {
            if (sql.includes('FROM employees'))
                return Promise.resolve(VALID_EMP_ROWS);
            if (sql.includes('INSERT INTO expenses'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await svc.importExpenses(PARTNER_ID, Buffer.from(csv));
        expect(result.imported).toBe(1);
    });
});
describe('ImportService.importExpenses — validation errors', () => {
    function makeWithEmps() {
        return makeService((sql) => {
            if (sql.includes('FROM employees'))
                return Promise.resolve(VALID_EMP_ROWS);
            if (sql.includes('INSERT INTO expenses'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
    }
    test('errors on unknown employee_id', async () => {
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\n2026-01-01,UNKNOWN,Shop,100000,travel_allowance,\n';
        const result = await makeWithEmps().importExpenses(PARTNER_ID, Buffer.from(csv));
        expect(result.skipped).toBe(1);
        expect(result.errors[0].field).toBe('employee_id');
    });
    test('errors on invalid date', async () => {
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\nnot-a-date,NV001,Shop,100000,travel_allowance,\n';
        const result = await makeWithEmps().importExpenses(PARTNER_ID, Buffer.from(csv));
        expect(result.errors[0].field).toBe('date');
    });
    test('errors on zero amount', async () => {
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\n2026-01-01,NV001,Shop,0,travel_allowance,\n';
        const result = await makeWithEmps().importExpenses(PARTNER_ID, Buffer.from(csv));
        expect(result.errors[0].field).toBe('amount_vnd');
    });
    test('errors on negative amount', async () => {
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\n2026-01-01,NV001,Shop,-50000,travel_allowance,\n';
        const result = await makeWithEmps().importExpenses(PARTNER_ID, Buffer.from(csv));
        expect(result.errors[0].field).toBe('amount_vnd');
    });
    test('errors on amount exceeding max', async () => {
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\n2026-01-01,NV001,Shop,200000000,travel_allowance,\n';
        const result = await makeWithEmps().importExpenses(PARTNER_ID, Buffer.from(csv));
        expect(result.errors[0].field).toBe('amount_vnd');
    });
    test('errors on invalid category', async () => {
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\n2026-01-01,NV001,Shop,100000,flagged,\n';
        const result = await makeWithEmps().importExpenses(PARTNER_ID, Buffer.from(csv));
        expect(result.errors[0].field).toBe('category');
    });
    test('continues processing after row errors (partial import)', async () => {
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\n' +
            '2026-01-01,NV001,Shop,100000,travel_allowance,\n' +
            'bad-date,NV002,Cafe,50000,welfare_allowance,\n' +
            '2026-01-03,NV001,Taxi,80000,travel_allowance,\n';
        const result = await makeWithEmps().importExpenses(PARTNER_ID, Buffer.from(csv));
        expect(result.imported).toBe(2);
        expect(result.skipped).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].row).toBe(3);
    });
});
describe('ImportService.importExpenses — guards', () => {
    test('throws BadRequestException on missing required columns', async () => {
        const csv = 'date,vendor_name\n2026-01-01,Shop\n';
        const svc = makeService(() => Promise.resolve([]));
        await expect(svc.importExpenses(PARTNER_ID, Buffer.from(csv))).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws BadRequestException when row count exceeds MAX_ROWS', async () => {
        const rows = Array.from({ length: 5001 }, (_, i) => `2026-01-01,NV001,Shop,100000,travel_allowance,row${i}`).join('\n');
        const csv = 'date,employee_id,vendor_name,amount_vnd,category,description\n' + rows;
        const svc = makeService(() => Promise.resolve([]));
        await expect(svc.importExpenses(PARTNER_ID, Buffer.from(csv))).rejects.toThrow(common_1.BadRequestException);
    });
});
const VALID_TENANT_CSV = 'name,tax_code,admin_email,admin_password\n' +
    'ABC Corp,0123456789,admin@abc.vn,Password@123\n' +
    'XYZ Ltd,9876543210,admin@xyz.vn,Secure#456\n';
describe('ImportService.bulkProvisionTenants — success', () => {
    test('provisions all rows and returns succeeded count', async () => {
        let partnerInserts = 0;
        const svc = makeService((sql) => {
            if (sql.includes('FROM partners WHERE'))
                return Promise.resolve([]);
            if (sql.includes('FROM users WHERE email'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO partners')) {
                partnerInserts++;
                return Promise.resolve([{ id: 'p-' + partnerInserts }]);
            }
            if (sql.includes('INSERT INTO users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await svc.bulkProvisionTenants(Buffer.from(VALID_TENANT_CSV), ADMIN_ID);
        expect(result.total).toBe(2);
        expect(result.succeeded).toBe(2);
        expect(result.failed).toBe(0);
        expect(partnerInserts).toBe(2);
    });
});
describe('ImportService.bulkProvisionTenants — partial failure', () => {
    test('continues after one row fails due to conflict', async () => {
        let callIdx = 0;
        const svc = makeService((sql) => {
            if (sql.includes('FROM partners WHERE')) {
                return callIdx++ === 0
                    ? Promise.resolve([{ id: 'existing' }])
                    : Promise.resolve([]);
            }
            if (sql.includes('FROM users WHERE email'))
                return Promise.resolve([]);
            if (sql.includes('INSERT INTO partners'))
                return Promise.resolve([{ id: 'new-p' }]);
            if (sql.includes('INSERT INTO users'))
                return Promise.resolve([]);
            return Promise.resolve([]);
        });
        const result = await svc.bulkProvisionTenants(Buffer.from(VALID_TENANT_CSV), ADMIN_ID);
        expect(result.succeeded).toBe(1);
        expect(result.failed).toBe(1);
        expect(result.results.find(r => r.status === 'error')?.message).toContain('đã tồn tại');
    });
    test('validates missing fields before DB call', async () => {
        const csv = 'name,tax_code,admin_email,admin_password\n,0123456789,admin@a.vn,pass1234\n';
        let dbCalled = false;
        const svc = makeService((sql) => { dbCalled = true; return Promise.resolve([]); });
        const result = await svc.bulkProvisionTenants(Buffer.from(csv), ADMIN_ID);
        expect(result.failed).toBe(1);
        expect(dbCalled).toBe(false);
    });
    test('rejects short passwords without DB call', async () => {
        const csv = 'name,tax_code,admin_email,admin_password\nTest Co,0001,admin@test.vn,short\n';
        let insertCalled = false;
        const svc = makeService((sql) => { if (sql.includes('INSERT'))
            insertCalled = true; return Promise.resolve([]); });
        const result = await svc.bulkProvisionTenants(Buffer.from(csv), ADMIN_ID);
        expect(result.failed).toBe(1);
        expect(insertCalled).toBe(false);
        expect(result.results[0].message).toContain('8 ký tự');
    });
    test('rejects invalid email format', async () => {
        const csv = 'name,tax_code,admin_email,admin_password\nTest Co,0001,not-an-email,Password123\n';
        const svc = makeService(() => Promise.resolve([]));
        const result = await svc.bulkProvisionTenants(Buffer.from(csv), ADMIN_ID);
        expect(result.failed).toBe(1);
        expect(result.results[0].message).toContain('Email không hợp lệ');
    });
});
describe('ImportService.bulkProvisionTenants — guards', () => {
    test('throws BadRequestException on missing columns', async () => {
        const csv = 'name,email\nABC,x@y.com\n';
        const svc = makeService(() => Promise.resolve([]));
        await expect(svc.bulkProvisionTenants(Buffer.from(csv), ADMIN_ID)).rejects.toThrow(common_1.BadRequestException);
    });
    test('throws BadRequestException when row count exceeds 500', async () => {
        const rows = Array.from({ length: 501 }, (_, i) => `Co${i},${String(i).padStart(10, '0')},a${i}@a.vn,Pass@word1`).join('\n');
        const csv = 'name,tax_code,admin_email,admin_password\n' + rows;
        const svc = makeService(() => Promise.resolve([]));
        await expect(svc.bulkProvisionTenants(Buffer.from(csv), ADMIN_ID)).rejects.toThrow(common_1.BadRequestException);
    });
});
//# sourceMappingURL=import.service.spec.js.map