import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { Workspaces } from './entities/workspaces.entity';
import { WorkspacesCreateDto } from './dto/create-workspaces.dto';
import { WorkspacesUpdateDto } from './dto/update-workspaces.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  @Post()
  create(@Body() dto: WorkspacesCreateDto): Promise<Workspaces> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Workspaces[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Workspaces> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: WorkspacesUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
