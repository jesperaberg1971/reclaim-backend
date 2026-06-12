import { Decimal } from 'decimal.js';
import { Gate1Result, TripDecisionCtx } from './gate.types';
export declare function evaluateGate1(amount: Decimal, receiptDate: Date, trip: TripDecisionCtx | null): Gate1Result;
