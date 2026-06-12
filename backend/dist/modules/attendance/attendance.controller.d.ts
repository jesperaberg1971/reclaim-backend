import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private readonly attendanceService;
    private readonly logger;
    constructor(attendanceService: AttendanceService);
    checkIn(file: Express.Multer.File, body: {
        latitude: string;
        longitude: string;
        employeeId: string;
    }): Promise<{
        status: string;
        message: string;
        checkinId: string;
        timestamp: Date;
    }>;
}
