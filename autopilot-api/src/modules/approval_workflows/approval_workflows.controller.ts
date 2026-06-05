import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApprovalWorkflowsService } from './approval_workflows.service';
import { ApprovalWorkflows } from './entities/approval_workflows.entity';
import { ApprovalWorkflowsCreateDto } from './dto/create-approval_workflows.dto';
import { ApprovalWorkflowsUpdateDto } from './dto/update-approval_workflows.dto';

@Controller('api/v1/approval-workflows')
export class ApprovalWorkflowsController {
  constructor(private readonly service: ApprovalWorkflowsService) {}

  @Post()
  create(@Body() dto: ApprovalWorkflowsCreateDto): Promise<ApprovalWorkflows> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<ApprovalWorkflows[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ApprovalWorkflows> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: ApprovalWorkflowsUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
