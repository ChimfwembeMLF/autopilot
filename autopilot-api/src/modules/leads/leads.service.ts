import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leads } from './entities/leads.entity';
import { LeadsCreateDto } from './dto/create-leads.dto';
import { LeadsUpdateDto } from './dto/update-leads.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Leads)
    private readonly repo: Repository<Leads>,
  ) {}

  async create(dto: LeadsCreateDto): Promise<Leads> {
    const ent = this.repo.create(dto);
    return this.repo.save(ent as Leads);
  }

  async findAll(tenantId?: string): Promise<Leads[]> {
    if (tenantId) return this.repo.find({ where: { tenantId } });
    return this.repo.find();
  }

  async findOne(id: string): Promise<Leads> {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Leads not found');
    return ent;
  }

  async update(id: string, dto: LeadsUpdateDto): Promise<Leads> {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException('Leads not found');
  }
}
