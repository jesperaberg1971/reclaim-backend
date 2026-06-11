import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddCoreDataEntities1749085200000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
