"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SetupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const redis_service_1 = require("../../common/redis/redis.service");
const policy_service_1 = require("../policy/policy.service");
const INVITE_TTL_SECONDS = 48 * 3600;
const INVITE_PREFIX = 'invite:';
let SetupService = SetupService_1 = class SetupService {
    constructor(dataSource, jwtService, config, redisService) {
        this.dataSource = dataSource;
        this.jwtService = jwtService;
        this.config = config;
        this.redisService = redisService;
        this.logger = new common_1.Logger(SetupService_1.name);
    }
    async createPartner(dto) {
        const passHash = await bcrypt.hash(dto.admin_password, 12);
        return this.dataSource.transaction(async (manager) => {
            const [existingPartner] = await manager.query(`SELECT id FROM partners WHERE name = $1 OR tax_code = $2 LIMIT 1`, [dto.firm_name, dto.tax_code]);
            if (existingPartner) {
                throw new common_1.ConflictException('A firm with this name or tax code already exists.');
            }
            const [existingUser] = await manager.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [dto.admin_email]);
            if (existingUser) {
                throw new common_1.ConflictException('An account with this email address already exists.');
            }
            const partnerId = (0, crypto_1.randomUUID)();
            await manager.query(`INSERT INTO partners (id, name, tax_code, policies, created_at)
         VALUES ($1, $2, $3, $4::jsonb, NOW())`, [partnerId, dto.firm_name, dto.tax_code, JSON.stringify(policy_service_1.DEFAULT_POLICY)]);
            const userId = (0, crypto_1.randomUUID)();
            await manager.query(`INSERT INTO users (id, email, password_hash, role, partner_id, created_at)
         VALUES ($1, $2, $3, 'partner_admin', $4, NOW())`, [userId, dto.admin_email, passHash, partnerId]);
            this.logger.log(`New partner created: ${dto.firm_name} (${partnerId})`);
            const accessToken = this.jwtService.sign({ sub: userId, userId, tenantId: partnerId, role: 'partner_admin', partnerId, clientId: null }, { secret: this.config.get('JWT_SECRET'), expiresIn: '24h' });
            return { accessToken, partner_id: partnerId };
        });
    }
    async createClient(tenantId, dto) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [existing] = await manager.query(`SELECT id FROM clients WHERE name = $1 AND partner_id = $2 LIMIT 1`, [dto.name, tenantId]);
            if (existing)
                throw new common_1.ConflictException(`A client named "${dto.name}" already exists.`);
            const clientId = (0, crypto_1.randomUUID)();
            await manager.query(`INSERT INTO clients (id, name, partner_id, employee_count) VALUES ($1, $2, $3, 0)`, [clientId, dto.name, tenantId]);
            this.logger.log(`Client created: ${dto.name} (${clientId}) for tenant ${tenantId}`);
            return { id: clientId, name: dto.name };
        });
    }
    async createClientAdmin(tenantId, dto) {
        const passHash = await bcrypt.hash(dto.password, 12);
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [client] = await manager.query(`SELECT id FROM clients WHERE id = $1 AND partner_id = $2 LIMIT 1`, [dto.client_id, tenantId]);
            if (!client)
                throw new common_1.BadRequestException('Client not found or does not belong to your firm.');
            const [existingUser] = await manager.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [dto.email]);
            if (existingUser)
                throw new common_1.ConflictException('An account with this email already exists.');
            const userId = (0, crypto_1.randomUUID)();
            await manager.query(`INSERT INTO users (id, email, password_hash, role, client_id, created_at)
         VALUES ($1, $2, $3, 'client_admin', $4, NOW())`, [userId, dto.email, passHash, dto.client_id]);
            this.logger.log(`Client admin created for client ${dto.client_id}`);
            return { user_id: userId, email: dto.email, client_id: dto.client_id };
        });
    }
    async createEmployee(tenantId, dto) {
        const passHash = await bcrypt.hash(dto.password, 12);
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [client] = await manager.query(`SELECT id FROM clients WHERE id = $1 AND partner_id = $2 LIMIT 1`, [dto.client_id, tenantId]);
            if (!client)
                throw new common_1.BadRequestException('Client not found or does not belong to your firm.');
            const [dupCode] = await manager.query(`SELECT id FROM employees WHERE employee_id = $1 AND client_id = $2 LIMIT 1`, [dto.employee_code, dto.client_id]);
            if (dupCode)
                throw new common_1.ConflictException(`Employee code "${dto.employee_code}" is already in use.`);
            const [dupEmail] = await manager.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [dto.email]);
            if (dupEmail)
                throw new common_1.ConflictException('An account with this email already exists.');
            const empId = (0, crypto_1.randomUUID)();
            await manager.query(`INSERT INTO employees (id, client_id, employee_id, full_name, pdpd_consent, is_active)
         VALUES ($1, $2, $3, $4, true, true)`, [empId, dto.client_id, dto.employee_code, dto.full_name]);
            await manager.query(`UPDATE clients SET employee_count = employee_count + 1 WHERE id = $1`, [dto.client_id]);
            const userId = (0, crypto_1.randomUUID)();
            await manager.query(`INSERT INTO users (id, email, password_hash, role, client_id, created_at)
         VALUES ($1, $2, $3, 'employee', $4, NOW())`, [userId, dto.email, passHash, dto.client_id]);
            this.logger.log(`Employee created: ${dto.full_name} (${empId}) for client ${dto.client_id}`);
            return { employee_id: empId, user_id: userId, full_name: dto.full_name };
        });
    }
    async bulkImportEmployees(tenantId, dto) {
        const succeeded = [];
        const failed = [];
        for (const emp of dto.employees) {
            try {
                const result = await this.createEmployee(tenantId, {
                    client_id: dto.client_id,
                    full_name: emp.full_name,
                    employee_code: emp.employee_code,
                    email: emp.email,
                    password: emp.password,
                });
                succeeded.push(result);
            }
            catch (err) {
                failed.push({ full_name: emp.full_name, email: emp.email, error: err?.message ?? 'Unknown error' });
            }
        }
        return { succeeded, failed, total: dto.employees.length };
    }
    async provision(dto) {
        const adminHash = await bcrypt.hash(dto.admin_password, 12);
        const enrichedClients = await Promise.all((dto.clients ?? []).map(async (c) => ({
            name: c.name,
            adminEmail: c.admin_email,
            adminHash: c.admin_email && c.admin_password
                ? await bcrypt.hash(c.admin_password, 12)
                : null,
            employees: await Promise.all((c.employees ?? []).map(async (e) => ({
                full_name: e.full_name,
                employee_code: e.employee_code,
                email: e.email,
                hash: await bcrypt.hash(e.password, 12),
            }))),
        })));
        return this.dataSource.transaction(async (manager) => {
            const [existingPartner] = await manager.query(`SELECT id FROM partners WHERE name = $1 OR tax_code = $2 LIMIT 1`, [dto.firm_name, dto.tax_code]);
            if (existingPartner)
                throw new common_1.ConflictException('A firm with this name or tax code already exists.');
            const [existingAdmin] = await manager.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [dto.admin_email]);
            if (existingAdmin)
                throw new common_1.ConflictException('An account with this email address already exists.');
            const partnerId = (0, crypto_1.randomUUID)();
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [partnerId]);
            await manager.query(`INSERT INTO partners (id, name, tax_code, policies, created_at)
         VALUES ($1, $2, $3, $4::jsonb, NOW())`, [partnerId, dto.firm_name, dto.tax_code, JSON.stringify(policy_service_1.DEFAULT_POLICY)]);
            const adminUserId = (0, crypto_1.randomUUID)();
            await manager.query(`INSERT INTO users (id, email, password_hash, role, partner_id, created_at)
         VALUES ($1, $2, $3, 'partner_admin', $4, NOW())`, [adminUserId, dto.admin_email, adminHash, partnerId]);
            const createdClients = [];
            for (const c of enrichedClients) {
                const clientId = (0, crypto_1.randomUUID)();
                await manager.query(`INSERT INTO clients (id, name, partner_id, employee_count) VALUES ($1, $2, $3, 0)`, [clientId, c.name, partnerId]);
                let clientAdminUserId = null;
                if (c.adminEmail && c.adminHash) {
                    const [dupAdmin] = await manager.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [c.adminEmail]);
                    if (dupAdmin)
                        throw new common_1.ConflictException(`Client admin email "${c.adminEmail}" already registered.`);
                    clientAdminUserId = (0, crypto_1.randomUUID)();
                    await manager.query(`INSERT INTO users (id, email, password_hash, role, client_id, created_at)
             VALUES ($1, $2, $3, 'client_admin', $4, NOW())`, [clientAdminUserId, c.adminEmail, c.adminHash, clientId]);
                }
                const createdEmployees = [];
                for (const e of c.employees) {
                    const [dupEmail] = await manager.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [e.email]);
                    if (dupEmail)
                        throw new common_1.ConflictException(`Employee email "${e.email}" already registered.`);
                    const empId = (0, crypto_1.randomUUID)();
                    const empUid = (0, crypto_1.randomUUID)();
                    await manager.query(`INSERT INTO employees (id, client_id, employee_id, full_name, pdpd_consent, is_active)
             VALUES ($1, $2, $3, $4, true, true)`, [empId, clientId, e.employee_code, e.full_name]);
                    await manager.query(`INSERT INTO users (id, email, password_hash, role, client_id, created_at)
             VALUES ($1, $2, $3, 'employee', $4, NOW())`, [empUid, e.email, e.hash, clientId]);
                    createdEmployees.push({ employee_id: empId, user_id: empUid, full_name: e.full_name });
                }
                if (createdEmployees.length > 0) {
                    await manager.query(`UPDATE clients SET employee_count = $1 WHERE id = $2`, [createdEmployees.length, clientId]);
                }
                createdClients.push({ id: clientId, name: c.name, admin_user_id: clientAdminUserId, employees: createdEmployees });
            }
            this.logger.log(`Provisioned: ${dto.firm_name} (${partnerId}) — ${createdClients.length} client(s), ` +
                `${createdClients.reduce((n, c) => n + c.employees.length, 0)} employee(s)`);
            const accessToken = this.jwtService.sign({ sub: adminUserId, userId: adminUserId, tenantId: partnerId, role: 'partner_admin', partnerId, clientId: null }, { secret: this.config.get('JWT_SECRET'), expiresIn: '24h' });
            return { partner_id: partnerId, partner_name: dto.firm_name, access_token: accessToken, clients: createdClients };
        });
    }
    async createInvite(tenantId, dto) {
        if (dto.client_id) {
            await this.dataSource.transaction(async (manager) => {
                await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
                const [client] = await manager.query(`SELECT id FROM clients WHERE id = $1 AND partner_id = $2 LIMIT 1`, [dto.client_id, tenantId]);
                if (!client)
                    throw new common_1.NotFoundException('Client not found or does not belong to your firm.');
            });
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date(Date.now() + INVITE_TTL_SECONDS * 1_000).toISOString();
        const payload = {
            email: dto.email,
            role: dto.role,
            partnerId: tenantId,
            clientId: dto.client_id ?? null,
        };
        await this.redisService.cacheSet(`${INVITE_PREFIX}${token}`, JSON.stringify(payload), INVITE_TTL_SECONDS);
        return {
            token,
            invite_url: `/api/setup/redeem-invite?token=${token}`,
            expires_at: expiresAt,
        };
    }
    async redeemInvite(dto) {
        const raw = await this.redisService.cacheGet(`${INVITE_PREFIX}${dto.token}`);
        if (!raw)
            throw new common_1.BadRequestException('Invite link has expired or is invalid.');
        const invite = JSON.parse(raw);
        if (!invite.clientId) {
            throw new common_1.BadRequestException('Invite is missing a client — contact your administrator.');
        }
        if (invite.role === 'employee') {
            if (!dto.full_name || !dto.employee_code) {
                throw new common_1.BadRequestException('full_name and employee_code are required to redeem an employee invite.');
            }
        }
        const passHash = await bcrypt.hash(dto.password, 12);
        const userId = (0, crypto_1.randomUUID)();
        await this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [invite.partnerId]);
            const [dupEmail] = await manager.query(`SELECT id FROM users WHERE email = $1 LIMIT 1`, [invite.email]);
            if (dupEmail)
                throw new common_1.ConflictException('An account with this email already exists.');
            if (invite.role === 'employee') {
                const [dupCode] = await manager.query(`SELECT id FROM employees WHERE employee_id = $1 AND client_id = $2 LIMIT 1`, [dto.employee_code, invite.clientId]);
                if (dupCode)
                    throw new common_1.ConflictException(`Employee code "${dto.employee_code}" is already in use.`);
                const empId = (0, crypto_1.randomUUID)();
                await manager.query(`INSERT INTO employees (id, client_id, employee_id, full_name, pdpd_consent, is_active)
           VALUES ($1, $2, $3, $4, true, true)`, [empId, invite.clientId, dto.employee_code, dto.full_name]);
                await manager.query(`UPDATE clients SET employee_count = employee_count + 1 WHERE id = $1`, [invite.clientId]);
                await manager.query(`INSERT INTO users (id, email, password_hash, role, client_id, created_at)
           VALUES ($1, $2, $3, 'employee', $4, NOW())`, [userId, invite.email, passHash, invite.clientId]);
            }
            else {
                await manager.query(`INSERT INTO users (id, email, password_hash, role, client_id, created_at)
           VALUES ($1, $2, $3, 'client_admin', $4, NOW())`, [userId, invite.email, passHash, invite.clientId]);
            }
        });
        await this.redisService.cacheDelete(`${INVITE_PREFIX}${dto.token}`);
        this.logger.log(`Invite redeemed: ${invite.email} as ${invite.role} for partner ${invite.partnerId}`);
        const accessToken = this.jwtService.sign({
            sub: userId, userId,
            tenantId: invite.partnerId,
            role: invite.role,
            clientId: invite.clientId,
        }, { secret: this.config.get('JWT_SECRET'), expiresIn: '24h' });
        return { access_token: accessToken, role: invite.role };
    }
    async getChecklist(tenantId) {
        return this.dataSource.transaction(async (manager) => {
            await manager.query(`SELECT set_config('app.current_tenant_id', $1, true)`, [tenantId]);
            const [partner] = await manager.query(`SELECT id, name, tax_code, created_at FROM partners WHERE id = $1 LIMIT 1`, [tenantId]);
            const clients = await manager.query(`SELECT c.id, c.name, c.employee_count FROM clients c WHERE c.partner_id = $1 ORDER BY c.name`, [tenantId]);
            const [{ count: empCount }] = await manager.query(`SELECT COUNT(*) FROM employees e
         JOIN clients c ON c.id = e.client_id
         WHERE c.partner_id = $1`, [tenantId]);
            const [{ count: recCount }] = await manager.query(`SELECT COUNT(*) FROM expenses e
         JOIN clients c ON c.id = e.client_id
         WHERE c.partner_id = $1
           AND e.created_at > NOW() - INTERVAL '30 days'`, [tenantId]);
            const clientCount = clients.length;
            const employeeCount = Number(empCount);
            const receiptCount = Number(recCount);
            let stepsComplete = 1;
            if (clientCount > 0)
                stepsComplete++;
            if (employeeCount > 0)
                stepsComplete++;
            if (receiptCount > 0)
                stepsComplete++;
            const nextStep = clientCount === 0 ? 'add_client' :
                employeeCount === 0 ? 'add_employee' :
                    receiptCount === 0 ? 'upload_receipt' :
                        'done';
            return {
                partner: partner ? {
                    id: partner.id,
                    name: partner.name,
                    tax_code: partner.tax_code,
                    created_at: new Date(partner.created_at).toISOString(),
                } : null,
                client_count: clientCount,
                employee_count: employeeCount,
                receipt_count: receiptCount,
                steps_complete: stepsComplete,
                next_step: nextStep,
                clients: clients.map(c => ({ id: c.id, name: c.name, employee_count: Number(c.employee_count) })),
            };
        });
    }
};
exports.SetupService = SetupService;
exports.SetupService = SetupService = SetupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        jwt_1.JwtService,
        config_1.ConfigService,
        redis_service_1.RedisService])
], SetupService);
//# sourceMappingURL=setup.service.js.map