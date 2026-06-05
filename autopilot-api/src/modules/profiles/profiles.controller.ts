import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { Profiles } from './entities/profiles.entity';
import { ProfilesCreateDto } from './dto/create-profiles.dto';
import { ProfilesUpdateDto } from './dto/update-profiles.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("Profiles")
@Controller('api/v1/profiles')
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Post()
  create(@Body() dto: ProfilesCreateDto): Promise<Profiles> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Profiles[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Profiles> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: ProfilesUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
