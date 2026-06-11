import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnifiedInboxService } from './unified-inbox.service';
import { SocialMessagingSyncService } from './social-messaging-sync.service';
import { SocialDmReplyService } from './social-dm-reply.service';

interface JwtUser {
  sub: string;
}

@ApiTags('Inbox')
@Controller('api/v1/inbox')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialInboxController {
  constructor(
    private readonly inbox: UnifiedInboxService,
    private readonly sync: SocialMessagingSyncService,
    private readonly dmReply: SocialDmReplyService,
  ) {}

  @Get('conversations')
  listConversations(
    @Query('tenantId') tenantId: string,
    @Query('channel') channel?: 'post_comment' | 'dm' | 'all',
  ) {
    return this.inbox.listConversations(tenantId, channel ?? 'all');
  }

  @Get('messages')
  listMessages(
    @Query('tenantId') tenantId: string,
    @Query('conversationId') conversationId: string,
  ) {
    return this.inbox.listMessages(tenantId, conversationId);
  }

  @Post('sync')
  syncInbox(@Req() req: { user: JwtUser }, @Body() body: { tenantId: string }) {
    return this.sync.syncForTenant(body.tenantId, String(req.user.sub));
  }

  @Post('messages/reply')
  reply(
    @Req() req: { user: JwtUser },
    @Body()
    body: {
      tenantId: string;
      conversationId: string;
      message: string;
      useTemplate?: boolean;
      templateName?: string;
      templateLanguage?: string;
    },
  ) {
    return this.dmReply.sendReply({
      tenantId: body.tenantId,
      userId: String(req.user.sub),
      conversationId: body.conversationId,
      message: body.message,
      useTemplate: body.useTemplate,
      templateName: body.templateName,
      templateLanguage: body.templateLanguage,
    });
  }
}
