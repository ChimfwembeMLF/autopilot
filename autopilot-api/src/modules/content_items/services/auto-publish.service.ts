import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentItems } from '../entities/content_items.entity';
import { PublishContentService } from './publish-content.service';
import { isContentDue } from '../utils/schedule.util';

@Injectable()
export class AutoPublishService {
  private readonly logger = new Logger(AutoPublishService.name);

  constructor(
    @InjectRepository(ContentItems)
    private readonly contentRepo: Repository<ContentItems>,
    private readonly publishContent: PublishContentService,
  ) {}

  async publishDueItems(): Promise<{
    attempted: number;
    published: number;
    failed: number;
    errors: string[];
  }> {
    const items = await this.contentRepo.find({ where: { status: 'approved' } });
    const due = items.filter((item) => isContentDue(item));
    let published = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const item of due) {
      try {
        const result = await this.publishContent.publish({
          contentId: item.id,
          userId: item.userId,
          platforms: item.platforms,
        });
        if (result.published) {
          published++;
          this.logger.log(`Published content ${item.id}`);
        } else {
          failed++;
          const msg = Object.values(result.results ?? {})
            .map((r) => r.message)
            .join('; ');
          errors.push(`${item.id}: ${msg || 'publish failed'}`);
        }
      } catch (err) {
        failed++;
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${item.id}: ${msg}`);
        this.logger.warn(`Auto-publish failed for ${item.id}: ${msg}`);
      }
    }

    return { attempted: due.length, published, failed, errors };
  }
}
