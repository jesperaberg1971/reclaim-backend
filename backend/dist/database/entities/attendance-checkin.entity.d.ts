import { Employee } from './employee.entity';
export declare class AttendanceCheckin {
    id: string;
    employee: Employee;
    employee_id: string;
    check_in_date: Date;
    latitude: number;
    longitude: number;
    photo_url: string;
    created_at: Date;
}
