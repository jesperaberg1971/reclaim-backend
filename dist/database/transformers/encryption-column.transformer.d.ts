import { ValueTransformer } from 'typeorm';
export declare class EncryptionColumnTransformer implements ValueTransformer {
    to(plaintext: string | null | undefined): string | null;
    from(ciphertext: string | null | undefined): string | null;
}
