import { BaseRepository } from '../../../database/repositories/base.repository';
import { Expense } from '../../../database/entities/expense.entity';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { Decimal } from 'decimal.js';
export declare class ExpenseRepository extends BaseRepository<Expense> {
    constructor(cls: ClsService, dataSource: DataSource);
    getMonthlyMealTotal(employeeId: string, receiptDate: Date): Promise<Decimal>;
}
