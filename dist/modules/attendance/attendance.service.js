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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const attendance_repository_1 = require("./repositories/attendance.repository");
let AttendanceService = class AttendanceService {
    constructor(attendanceRepo) {
        this.attendanceRepo = attendanceRepo;
    }
    async checkIn(employeeId, latitude, longitude, photoUrl) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existing = await this.attendanceRepo.repository.findOne({
            where: {
                employee_id: employeeId,
                check_in_date: today,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('You have already checked in today');
        }
        const checkin = this.attendanceRepo.repository.create({
            employee_id: employeeId,
            check_in_date: today,
            latitude,
            longitude,
            photo_url: photoUrl,
        });
        return this.attendanceRepo.repository.save(checkin);
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [attendance_repository_1.AttendanceRepository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map