import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantMembers } from './entities/tenant_members.entity';
import { TenantMembersCreateDto } from './dto/create-tenant_members.dto';
import { TenantMembersUpdateDto } from './dto/update-tenant_members.dto';

@Injectable()
export class TenantMembersService {
  constructor(
    @InjectRepository(TenantMembers)
    private readonly repo: Repository<TenantMembers>,
  ) {}

  async create(dto: TenantMembersCreateDto): Promise<TenantMembers> {
    const ent = this.repo.create(dto);
    return this.repo.save(ent as TenantMembers);
  }

  async findAll(): Promise<TenantMembers[]> {
    return this.repo.find();
  }

  async findOne(id: string): Promise<TenantMembers> {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('TenantMembers not found');
    return ent;
  }

  async update(
    id: string,
    dto: TenantMembersUpdateDto,
  ): Promise<TenantMembers> {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0)
      throw new NotFoundException('TenantMembers not found');
  }
}
