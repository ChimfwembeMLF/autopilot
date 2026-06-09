import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandProfiles } from './entities/brand_profiles.entity';
import { BrandProfilesCreateDto } from './dto/create-brand_profiles.dto';
import { BrandProfilesUpdateDto } from './dto/update-brand_profiles.dto';

@Injectable()
export class BrandProfilesService {
  constructor(
    @InjectRepository(BrandProfiles)
    private readonly repo: Repository<BrandProfiles>,
  ) {}

  async create(dto: BrandProfilesCreateDto): Promise<BrandProfiles> {
    return this.upsert(dto);
  }

  async upsert(dto: BrandProfilesCreateDto): Promise<BrandProfiles> {
    if (!dto.tenantId) {
      throw new BadRequestException('tenantId is required');
    }
    if (!dto.userId) {
      throw new BadRequestException('userId is required');
    }
    const existing = await this.findForTenantUser(dto.tenantId, dto.userId);
      if (existing) {
        await this.repo.update(existing.id, dto as BrandProfilesUpdateDto);
        return this.findOne(existing.id);
      }
    const ent = this.repo.create(dto);
    return this.repo.save(ent as BrandProfiles);
  }

  async findAll(tenantId?: string): Promise<BrandProfiles[]> {
    if (tenantId) return this.repo.find({ where: { tenantId } });
    return this.repo.find();
  }

  async findForTenant(tenantId: string): Promise<BrandProfiles[]> {
    return this.repo.find({ where: { tenantId } });
  }

  async findForTenantUser(tenantId: string, userId: string): Promise<BrandProfiles | null> {
    return this.repo.findOne({ where: { tenantId, userId } });
  }

  async findOne(id: string): Promise<BrandProfiles> {
    const ent = await this.repo.findOne({ where: { id } });
    if (!ent) throw new NotFoundException('BrandProfiles not found');
    return ent;
  }

  async update(
    id: string,
    dto: BrandProfilesUpdateDto,
  ): Promise<BrandProfiles> {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async updateForUser(
    id: string,
    userId: string,
    dto: BrandProfilesUpdateDto,
  ): Promise<BrandProfiles> {
    const existing = await this.findOne(id);
    if (existing.userId !== userId) {
      throw new NotFoundException('BrandProfiles not found');
    }
    return this.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0)
      throw new NotFoundException('BrandProfiles not found');
  }
}
