import { DataSource } from 'typeorm';
import { RedisService } from '../../common/redis/redis.service';
import { PartnerBranding } from '../../database/entities/partner.entity';
export declare class UpdateBrandingDto {
    logo_url?: string | null;
    primary_color?: string;
    accent_color?: string;
    company_display_name?: string | null;
    report_header?: string | null;
    report_footer?: string | null;
}
export declare class BrandingService {
    private readonly dataSource;
    private readonly redisService;
    constructor(dataSource: DataSource, redisService: RedisService);
    getBranding(partnerId: string): Promise<PartnerBranding>;
    updateBranding(partnerId: string, dto: UpdateBrandingDto): Promise<PartnerBranding>;
    buildCssVars(branding: PartnerBranding): string;
    resolveDisplayName(branding: PartnerBranding, fallbackName: string): string;
    private lighten;
}
