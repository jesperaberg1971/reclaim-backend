import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddOcrStatusValues1749088800000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
