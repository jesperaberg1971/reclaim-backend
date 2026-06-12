import { AttendanceRepository } from './repositories/attendance.repository';
import { AttendanceCheckin } from '../../database/entities/attendance-checkin.entity';
export declare class AttendanceService {
    private readonly attendanceRepo;
    constructor(attendanceRepo: AttendanceRepository);
    checkIn(employeeId: string, latitude: number, longitude: number, photoUrl: string): Promise<AttendanceCheckin>;
}
