import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { Roles } from './entities/roles.entity';
import { RolesCreateDto } from './dto/create-roles.dto';
import { RolesUpdateDto } from './dto/update-roles.dto';

@Controller('api/v1/roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Post()
  create(@Body() dto: RolesCreateDto): Promise<Roles> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Roles[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Roles> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: RolesUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
