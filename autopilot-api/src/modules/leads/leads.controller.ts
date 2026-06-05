import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { Leads } from './entities/leads.entity';
import { LeadsCreateDto } from './dto/create-leads.dto';
import { LeadsUpdateDto } from './dto/update-leads.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("Leads")
@Controller('api/v1/leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Post()
  create(@Body() dto: LeadsCreateDto): Promise<Leads> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Leads[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Leads> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: LeadsUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
