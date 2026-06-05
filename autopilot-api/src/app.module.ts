import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { typeOrmConfigFactory } from './database/ormconfig';

import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ContentItemsModule } from './modules/content_items/content_items.module';
import { SocialAccountsModule } from './modules/social_accounts/social_accounts.module';
import { LeadsModule } from './modules/leads/leads.module';
import { PaymentFailuresModule } from './modules/payment_failures/payment_failures.module';
import { ApprovalRequestsModule } from './modules/approval_requests/approval_requests.module';
import { WhatsappContactsModule } from './modules/whatsapp_contacts/whatsapp_contacts.module';
import { AuditLogsModule } from './modules/audit_logs/audit_logs.module';
import { AiUsageModule } from './modules/ai_usage/ai_usage.module';
import { RbacModule } from './modules/auth/rbac/rbac.module';
import { AutoReplyRulesModule } from './modules/auto_reply_rules/auto_reply_rules.module';
import { CommentRepliesModule } from './modules/comment_replies/comment_replies.module';
import { DepositsModule } from './modules/deposits/deposits.module';
import { LeadSourcesModule } from './modules/lead_sources/lead_sources.module';
import { BrandProfilesModule } from './modules/brand_profiles/brand_profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory,
    }),

    AuthModule,
    UserModule,

    // Multi-tenant core
    TenantsModule,

    // Authorization
    RbacModule,

    BrandProfilesModule,
    ContentItemsModule,
    SocialAccountsModule,
    LeadsModule,
    LeadSourcesModule,

    PaymentFailuresModule,
    DepositsModule,

    ApprovalRequestsModule,
    AutoReplyRulesModule,
    WhatsappContactsModule,
    CommentRepliesModule,

    // Platform features
    AuditLogsModule,
    AiUsageModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}