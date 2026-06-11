import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BrandProfiles } from './entities/brand_profiles.entity';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class BrandProfileSeedService {
  private readonly logger = new Logger(BrandProfileSeedService.name);

  constructor(
    @InjectRepository(BrandProfiles)
    private readonly repo: Repository<BrandProfiles>,
  ) {}

  /** Minimal brand profile shell so AI and onboarding have something to work with. */
  async ensureStarterForUser(tenantId: string, user: UserEntity): Promise<boolean> {
    const existing = await this.repo.findOne({
      where: { tenantId, userId: user.id },
    });
    if (existing) return false;

    const companyName =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.email?.split('@')[0]?.trim() ||
      undefined;

    if (!companyName) return false;

    await this.repo.save(
      this.repo.create({
        tenantId,
        userId: user.id,
        companyName,
        toneOfVoice: 'Professional, clear, and friendly',
        brandPersonality: 'Helpful and trustworthy',
        description: undefined,
      }),
    );

    this.logger.log(`Seeded starter brand profile for tenant ${tenantId}`);
    return true;
  }
}
