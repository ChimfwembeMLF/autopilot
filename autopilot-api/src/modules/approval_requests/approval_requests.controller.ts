import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApprovalRequestsService } from './approval_requests.service';
import { ApprovalRequests } from './entities/approval_requests.entity';
import { ApprovalRequestsCreateDto } from './dto/create-approval_requests.dto';
import { ApprovalRequestsUpdateDto } from './dto/update-approval_requests.dto';

@Controller('api/v1/approval-requests')
export class ApprovalRequestsController {
  constructor(private readonly service: ApprovalRequestsService) {}

  @Post()
  create(@Body() dto: ApprovalRequestsCreateDto): Promise<ApprovalRequests> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<ApprovalRequests[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ApprovalRequests> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: ApprovalRequestsUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
