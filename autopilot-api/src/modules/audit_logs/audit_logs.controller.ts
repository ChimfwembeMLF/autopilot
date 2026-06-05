import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { AuditLogsService } from './audit_logs.service';
import { AuditLogs } from './entities/audit_logs.entity';
import { AuditLogsCreateDto } from './dto/create-audit_logs.dto';
import { AuditLogsUpdateDto } from './dto/update-audit_logs.dto';

@Controller('api/v1/audit-logs')
export class AuditLogsController {
  constructor(private readonly service: AuditLogsService) {}

  @Post()
  create(@Body() dto: AuditLogsCreateDto): Promise<AuditLogs> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<AuditLogs[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<AuditLogs> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: AuditLogsUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
