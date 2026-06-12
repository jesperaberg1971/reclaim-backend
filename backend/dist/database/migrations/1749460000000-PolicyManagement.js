"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyManagement1749460000000 = void 0;
class PolicyManagement1749460000000 {
    constructor() {
        this.name = 'PolicyManagement1749460000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`GRANT SELECT, UPDATE ON partners TO reclaim_app`);
    }
    async down(queryRunner) {
        await queryRunner.query(`REVOKE UPDATE ON partners FROM reclaim_app`);
    }
}
exports.PolicyManagement1749460000000 = PolicyManagement1749460000000;
//# sourceMappingURL=1749460000000-PolicyManagement.js.map