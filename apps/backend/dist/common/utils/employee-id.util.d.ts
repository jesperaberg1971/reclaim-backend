import { EntityManager } from 'typeorm';
export declare function generateEmployeeId(manager: EntityManager, clientId: string): Promise<string>;
