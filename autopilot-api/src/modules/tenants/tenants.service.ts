import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenants } from './entities/tenants.entity';
import { TenantsCreateDto } from './dto/create-tenants.dto';
import { TenantsUpdateDto } from './dto/update-tenants.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenants)
    private readonly repo: Repository<Tenants>,
  ) {}

  async create(dto: TenantsCreateDto): Promise<Tenants> {
    const ent = this.repo.create(dto);
    return this.repo.save(ent as Tenants);
  }

  async findAll(): Promise<Tenants[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<Tenants> {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('Tenants not found');
    return ent;
  }

  async update(id: string, dto: TenantsUpdateDto): Promise<Tenants> {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0) throw new NotFoundException('Tenants not found');
  }
}
