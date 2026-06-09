import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentItems } from '../entities/content_items.entity';
import { MediaAssets } from '../entities/media_assets.entity';
import { FacebookPublishingService } from '../../content-publishing/facebook-publishing.service';
import { InstagramPublishingService } from '../../content-publishing/instagram-publishing.service';
import { LinkedInPublishingService } from '../../content-publishing/linkedin-publishing.service';
import { TwitterPublishingService } from '../../content-publishing/twitter-publishing.service';
import { ContentToPublish, MediaAttachment } from '../../content-publishing/interfaces/publish-result.interface';
import { resolvePublicMediaUrl } from '../utils/media-url.util';

type PlatformPayloadStored = {
  content?: string;
  title?: string;
  media?: Array<{ url: string; type?: string; name?: string }>;
};

@Injectable()
export class PublishContentService {
  constructor(
    @InjectRepository(ContentItems)
    private readonly contentRepo: Repository<ContentItems>,
    @InjectRepository(MediaAssets)
    private readonly mediaRepo: Repository<MediaAssets>,
    private readonly config: ConfigService,
    private readonly facebook: FacebookPublishingService,
    private readonly instagram: InstagramPublishingService,
    private readonly linkedin: LinkedInPublishingService,
    private readonly twitter: TwitterPublishingService,
  ) {}

  async publish(params: {
    contentId: string;
    userId: string;
    platforms?: string[];
    platformPayloads?: Record<string, PlatformPayloadStored>;
  }) {
    const item = await this.contentRepo.findOne({ where: { id: params.contentId } });
    if (!item) throw new NotFoundException('Content item not found');

    const platforms = params.platforms?.length
      ? params.platforms
      : item.platforms?.length
        ? item.platforms
        : ['facebook'];

    const platformPayloads =
      params.platformPayloads && Object.keys(params.platformPayloads).length
        ? params.platformPayloads
        : this.parsePlatformPayloads(item.platformPayloads);
    const apiBase = this.config.get<string>('API_PUBLIC_URL') ?? '';

    const defaultMediaRows = await this.mediaRepo.find({
      where: { contentId: item.id, tenantId: item.tenantId },
    });
    const assetUrlByKey = new Map<string, string>();
    for (const row of defaultMediaRows) {
      const key = this.mediaUrlKey(row.mediaUrl);
      assetUrlByKey.set(key, row.mediaUrl);
    }

    const defaultMedia: MediaAttachment[] = defaultMediaRows.map((m) => ({
      id: m.id,
      media_url: resolvePublicMediaUrl(m.mediaUrl, apiBase),
      media_type: (m.mediaType as MediaAttachment['media_type']) || 'image',
      alt_text: m.altText,
    }));

    const results: Record<string, { published: boolean; message: string; externalPostId?: string }> = {};
    let anyPublished = false;

    for (const platform of platforms) {
      const pp = platformPayloads[platform];
      const payload: ContentToPublish = {
        id: item.id,
        content: pp?.content ?? item.content,
        title: pp?.title ?? item.title,
        userId: params.userId,
        tenantId: item.tenantId,
      };

      let media: MediaAttachment[];
      if (pp?.media?.length) {
        media = pp.media.map((m, i) => {
          const canonical = assetUrlByKey.get(this.mediaUrlKey(m.url)) ?? m.url;
          return {
            id: `payload-${platform}-${i}`,
            media_url: resolvePublicMediaUrl(canonical, apiBase),
            media_type: (m.type === 'video' ? 'video' : 'image') as MediaAttachment['media_type'],
            alt_text: m.name,
          };
        });
      } else {
        media = defaultMedia;
      }

      const result = await this.dispatch(platform, payload, media);
      results[platform] = {
        published: result.published,
        message: result.message,
        externalPostId: result.externalPostId,
      };
      if (result.published) anyPublished = true;
    }

    if (anyPublished) {
      await this.contentRepo.update(item.id, {
        status: 'published',
        publishedAt: new Date(),
        publishFailedReason: undefined,
      } as Partial<ContentItems>);
    } else {
      const reasons = Object.entries(results)
        .map(([p, r]) => `${p}: ${r.message}`)
        .join('; ');
      await this.contentRepo.update(item.id, {
        publishFailedReason: reasons,
      } as Partial<ContentItems>);
    }

    return { published: anyPublished, results };
  }

  private mediaUrlKey(url: string): string {
    if (!url) return '';
    try {
      const parsed = new URL(url, 'http://local');
      return parsed.pathname;
    } catch {
      return url.replace(/^https?:\/\/[^/]+/, '');
    }
  }

  private parsePlatformPayloads(raw: unknown): Record<string, PlatformPayloadStored> {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as Record<string, PlatformPayloadStored>;
      } catch {
        return {};
      }
    }
    if (typeof raw === 'object') {
      return raw as Record<string, PlatformPayloadStored>;
    }
    return {};
  }

  private async dispatch(platform: string, content: ContentToPublish, media: MediaAttachment[]) {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return this.facebook.publishPost(content, media);
      case 'instagram':
        return this.instagram.publishPost(content, media);
      case 'linkedin':
        return this.linkedin.publishPost(content, media);
      case 'twitter':
      case 'x':
        return this.twitter.publishPost(content, media);
      default:
        return { published: false, message: `Unsupported platform: ${platform}` };
    }
  }
}
