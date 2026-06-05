import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandProfiles } from './entities/brand_profiles.entity';
import { BrandProfilesService } from './brand_profiles.service';
import { BrandProfilesController } from './brand_profiles.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BrandProfiles])],
  providers: [BrandProfilesService],
  controllers: [BrandProfilesController],
  exports: [BrandProfilesService],
})
export class BrandProfilesModule {}
