import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class FixAuthRelationRls1749092400000 implements MigrationInterface {
    name: string;
    private tenantCheck;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
