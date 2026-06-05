import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoReplyRules } from './entities/auto_reply_rules.entity';
import { AutoReplyRulesService } from './auto_reply_rules.service';
import { AutoReplyRulesController } from './auto_reply_rules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AutoReplyRules])],
  providers: [AutoReplyRulesService],
  controllers: [AutoReplyRulesController],
  exports: [AutoReplyRulesService],
})
export class AutoReplyRulesModule {}
