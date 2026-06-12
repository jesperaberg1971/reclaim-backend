import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddTripDecisionDocFields1749096000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
