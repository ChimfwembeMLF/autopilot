import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprovalRequests } from './entities/approval_requests.entity';
import { ApprovalRequestsCreateDto } from './dto/create-approval_requests.dto';
import { ApprovalRequestsUpdateDto } from './dto/update-approval_requests.dto';

@Injectable()
export class ApprovalRequestsService {
  constructor(
    @InjectRepository(ApprovalRequests)
    private readonly repo: Repository<ApprovalRequests>,
  ) {}

  async create(dto: ApprovalRequestsCreateDto): Promise<ApprovalRequests> {
    const ent = this.repo.create(dto);
    return this.repo.save(ent as ApprovalRequests);
  }

  async findAll(): Promise<ApprovalRequests[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<ApprovalRequests> {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('ApprovalRequests not found');
    return ent;
  }

  async update(
    id: string,
    dto: ApprovalRequestsUpdateDto,
  ): Promise<ApprovalRequests> {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0)
      throw new NotFoundException('ApprovalRequests not found');
  }
}
