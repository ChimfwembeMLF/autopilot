import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ContentItemsService } from './content_items.service';
import { ContentItems } from './entities/content_items.entity';
import { ContentItemsCreateDto } from './dto/create-content_items.dto';
import { ContentItemsUpdateDto } from './dto/update-content_items.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("Content Items")
@Controller('content-items')
export class ContentItemsController {
  constructor(private readonly service: ContentItemsService) {}

  @Post()
  create(@Body() dto: ContentItemsCreateDto): Promise<ContentItems> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<ContentItems[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ContentItems> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: ContentItemsUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
