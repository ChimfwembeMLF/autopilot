import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsage } from './entities/ai_usage.entity';
import { AiUsageService } from './ai_usage.service';
import { AiUsageController } from './ai_usage.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AiUsage])],
  providers: [AiUsageService],
  controllers: [AiUsageController],
  exports: [AiUsageService],
})
export class AiUsageModule {}
