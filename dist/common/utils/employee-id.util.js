"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEmployeeId = generateEmployeeId;
async function generateEmployeeId(manager, clientId) {
    const [row] = await manager.query(`SELECT COALESCE(
       MAX(CAST(SUBSTRING(employee_id FROM 5) AS INTEGER)),
       0
     ) + 1 AS next_seq
     FROM employees
     WHERE client_id = $1 AND employee_id ~ '^EMP-[0-9]+$'`, [clientId]);
    const n = Number(row?.next_seq ?? 1);
    return `EMP-${String(n).padStart(4, '0')}`;
}
//# sourceMappingURL=employee-id.util.js.map