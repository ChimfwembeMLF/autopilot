import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalWorkflows } from './entities/approval_workflows.entity';
import { ApprovalWorkflowsCreateDto } from './dto/create-approval_workflows.dto';
import { ApprovalWorkflowsUpdateDto } from './dto/update-approval_workflows.dto';

@Injectable()
export class ApprovalWorkflowsService {
  constructor(
    @InjectRepository(ApprovalWorkflows)
    private readonly repo: Repository<ApprovalWorkflows>,
  ) {}

  async create(dto: ApprovalWorkflowsCreateDto): Promise<ApprovalWorkflows> {
    const ent = this.repo.create(dto);
    return this.repo.save(ent as ApprovalWorkflows);
  }

  async findAll(): Promise<ApprovalWorkflows[]> {
    return this.repo.find();
  }

  async findOne(actionKey: string): Promise<ApprovalWorkflows> {
    const ent = await this.repo.findOne({ where: { actionKey } });
    if (!ent) throw new NotFoundException('ApprovalWorkflows not found');
    return ent;
  }

  async update(
    actionKey: string,
    dto: ApprovalWorkflowsUpdateDto,
  ): Promise<ApprovalWorkflows> {
    await this.repo.update(actionKey, dto as any);
    return this.findOne(actionKey);
  }

  async remove(actionKey: string): Promise<void> {
    const res = await this.repo.delete(actionKey);
    if (res.affected === 0)
      throw new NotFoundException('ApprovalWorkflows not found');
  }
}
