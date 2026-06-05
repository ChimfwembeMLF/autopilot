import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogs } from './entities/audit_logs.entity';
import { AuditLogsCreateDto } from './dto/create-audit_logs.dto';
import { AuditLogsUpdateDto } from './dto/update-audit_logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogs)
    private readonly repo: Repository<AuditLogs>,
  ) {}

  async create(dto: AuditLogsCreateDto): Promise<AuditLogs> {
    const ent = this.repo.create(dto);
    return this.repo.save(ent as AuditLogs);
  }

  async findAll(): Promise<AuditLogs[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<AuditLogs> {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('AuditLogs not found');
    return ent;
  }

  async update(id: string, dto: AuditLogsUpdateDto): Promise<AuditLogs> {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException('AuditLogs not found');
  }
}
