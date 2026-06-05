import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentItems } from './entities/content_items.entity';
import { ContentItemsService } from './content_items.service';
import { ContentItemsController } from './content_items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContentItems])],
  providers: [ContentItemsService],
  controllers: [ContentItemsController],
  exports: [ContentItemsService],
})
export class ContentItemsModule {}
