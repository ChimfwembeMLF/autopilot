import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { BrandProfilesService } from './brand_profiles.service';
import { BrandProfiles } from './entities/brand_profiles.entity';
import { BrandProfilesCreateDto } from './dto/create-brand_profiles.dto';
import { BrandProfilesUpdateDto } from './dto/update-brand_profiles.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("Brand Profiles")
@Controller('api/v1/brand-profiles')
export class BrandProfilesController {
  constructor(private readonly service: BrandProfilesService) {}

  @Post()
  create(@Body() dto: BrandProfilesCreateDto): Promise<BrandProfiles> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<BrandProfiles[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<BrandProfiles> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: BrandProfilesUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
