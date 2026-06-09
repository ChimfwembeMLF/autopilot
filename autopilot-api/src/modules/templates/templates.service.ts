import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentTemplates } from './entities/content_templates.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(ContentTemplates)
    private readonly repo: Repository<ContentTemplates>,
  ) {}

  create(dto: Partial<ContentTemplates>) {
    return this.repo.save(this.repo.create(dto));
  }

  findByTenant(tenantId: string) {
    return this.repo.find({ where: { tenantId }, order: { updated_at: 'DESC' } });
  }

  async findOne(id: string, tenantId?: string) {
    const ent = await this.repo.findOne({
      where: tenantId ? { id, tenantId } : { id },
    });
    if (!ent) throw new NotFoundException('Template not found');
    return ent;
  }

  async update(id: string, dto: Partial<ContentTemplates>, tenantId?: string) {
    await this.findOne(id, tenantId);
    await this.repo.update(id, dto as any);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId?: string) {
    await this.findOne(id, tenantId);
    await this.repo.delete(id);
  }
}
