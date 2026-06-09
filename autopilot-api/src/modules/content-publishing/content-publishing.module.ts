import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialAccounts } from '../social_accounts/entities/social_accounts.entity';
import { FacebookPublishingService } from './facebook-publishing.service';
import { InstagramPublishingService } from './instagram-publishing.service';
import { LinkedInPublishingService } from './linkedin-publishing.service';
import { TwitterPublishingService } from './twitter-publishing.service';

@Module({
  imports: [TypeOrmModule.forFeature([SocialAccounts])],
  providers: [
    FacebookPublishingService,
    InstagramPublishingService,
    LinkedInPublishingService,
    TwitterPublishingService,
  ],
  exports: [
    FacebookPublishingService,
    InstagramPublishingService,
    LinkedInPublishingService,
    TwitterPublishingService,
  ],
})
export class ContentPublishingModule {}
