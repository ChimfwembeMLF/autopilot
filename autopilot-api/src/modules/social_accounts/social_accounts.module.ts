import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialAccounts } from './entities/social_accounts.entity';
import { SocialAccountsService } from './social_accounts.service';
import { SocialAccountsController } from './social_accounts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SocialAccounts])],
  providers: [SocialAccountsService],
  controllers: [SocialAccountsController],
  exports: [SocialAccountsService],
})
export class SocialAccountsModule {}
