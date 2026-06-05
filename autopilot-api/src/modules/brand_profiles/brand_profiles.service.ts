import { Injectable, NotFoundException } from '@nestjs/common';
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
    const ent = this.repo.create(dto);
    return this.repo.save(ent as BrandProfiles);
  }

  async findAll(): Promise<BrandProfiles[]> {
    return this.repo.find();
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

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (res.affected === 0)
      throw new NotFoundException('BrandProfiles not found');
  }
}
