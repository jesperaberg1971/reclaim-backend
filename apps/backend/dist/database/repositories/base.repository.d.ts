import { DataSource, EntityManager, Repository, EntityTarget } from 'typeorm';
import { ClsService } from 'nestjs-cls';
export declare abstract class BaseRepository<T> {
    protected readonly cls: ClsService;
    protected readonly dataSource: DataSource;
    protected readonly entity: EntityTarget<T>;
    constructor(cls: ClsService, dataSource: DataSource, entity: EntityTarget<T>);
    get repository(): Repository<T>;
    protected get manager(): EntityManager;
}
