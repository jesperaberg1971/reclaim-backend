import { ValueTransformer } from 'typeorm';
import Decimal from 'decimal.js';
export declare class DecimalColumnTransformer implements ValueTransformer {
    to(value: Decimal | number | string | null | undefined): string | null;
    from(value: string | null | undefined): Decimal | null;
}
