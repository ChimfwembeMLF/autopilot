import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiUsage } from './entities/ai_usage.entity';
import { AiUsageCreateDto } from './dto/create-ai_usage.dto';
import { AiUsageUpdateDto } from './dto/update-ai_usage.dto';

@Injectable()
export class AiUsageService {
  constructor(
    @InjectRepository(AiUsage)
    private readonly repo: Repository<AiUsage>,
  ) {}

  async create(dto: AiUsageCreateDto): Promise<AiUsage> {
    const ent = this.repo.create(dto);
    return this.repo.save(ent as AiUsage);
  }

  async findAll(): Promise<AiUsage[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<AiUsage> {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('AiUsage not found');
    return ent;
  }

  async update(id: string, dto: AiUsageUpdateDto): Promise<AiUsage> {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException('AiUsage not found');
  }

  async checkUsage(_tenantId: string, _userId: string): Promise<boolean> {
    return true;
  }
}
