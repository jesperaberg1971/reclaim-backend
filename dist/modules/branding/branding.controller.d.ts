import { Response } from 'express';
import { BrandingService, UpdateBrandingDto } from './branding.service';
export declare class BrandingController {
    private readonly brandingService;
    constructor(brandingService: BrandingService);
    getOwnBranding(req: any): Promise<import("../../database/entities").PartnerBranding>;
    updateOwnBranding(req: any, dto: UpdateBrandingDto): Promise<import("../../database/entities").PartnerBranding>;
    getBrandingById(partnerId: string): Promise<import("../../database/entities").PartnerBranding>;
    updateBrandingById(partnerId: string, dto: UpdateBrandingDto): Promise<import("../../database/entities").PartnerBranding>;
    getPublicBranding(partnerId: string): Promise<{
        logo_url: string;
        primary_color: string;
        accent_color: string;
        company_display_name: string;
    }>;
    getCss(partnerId: string, res: Response): Promise<void>;
}
