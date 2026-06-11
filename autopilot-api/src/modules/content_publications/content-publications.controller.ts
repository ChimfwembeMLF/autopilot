import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ContentPublicationsService } from './content-publications.service';
import { EngagementInsightsService } from './engagement-insights.service';
import { PublicationEngagementService } from '../content-publishing/publication-engagement.service';

interface JwtUser {
  sub: string;
}

@ApiTags('Content Publications')
@Controller('api/v1/content-publications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContentPublicationsController {
  constructor(
    private readonly service: ContentPublicationsService,
    private readonly insights: EngagementInsightsService,
    private readonly engagement: PublicationEngagementService,
  ) {}

  @Get()
  findByTenant(@Query('tenantId') tenantId: string) {
    if (!tenantId) return [];
    return this.service.findPublishedForTenant(tenantId);
  }

  @Get('content/:contentId')
  findByContent(@Param('contentId') contentId: string) {
    return this.service.findByContentId(contentId);
  }

  @Get('top-performing')
  topPerforming(@Query('tenantId') tenantId: string, @Query('limit') limit?: string) {
    return this.insights.getTopPerforming(tenantId, Number(limit ?? 5));
  }

  @Post('sync-engagement')
  syncEngagement(
    @Req() req: { user: JwtUser },
    @Body() body: { tenantId: string },
  ) {
    return this.engagement
      .syncForTenant(body.tenantId, String(req.user.sub))
      .then((updated) => ({ updated }));
  }
}
