import { Decimal } from 'decimal.js';
import { Gate3Result } from './gate.types';
export declare function evaluateGate3(amount: Decimal, personalCardLimitVnd: Decimal, hasBankAccount: boolean): Gate3Result;
