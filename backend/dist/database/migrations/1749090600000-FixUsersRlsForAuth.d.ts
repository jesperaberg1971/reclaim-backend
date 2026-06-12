import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class FixUsersRlsForAuth1749090600000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
