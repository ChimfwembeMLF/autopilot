import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { SocialAccounts } from '../social_accounts/entities/social_accounts.entity';
import { PublishResult, ContentToPublish } from './interfaces/publish-result.interface';

@Injectable()
export class FacebookPublishingService {
  private readonly logger = new Logger(FacebookPublishingService.name);

  constructor(
    @InjectRepository(SocialAccounts)
    private readonly socialAccountsRepo: Repository<SocialAccounts>,
  ) {}

  async publishPost(content: ContentToPublish, media: any[] = []): Promise<PublishResult> {
    try {
      const socialAccount = await this.socialAccountsRepo.findOne({
        where: {
          userId: content.userId,
          platform: 'facebook',
          connected: true,
        },
      });

      if (!socialAccount) {
        return { published: false, message: 'Facebook account not connected' };
      }

      const pageToken = socialAccount.metadata?.page_token;
      const pageId = socialAccount.externalId;

      if (!pageToken || !pageId) {
        return {
          published: false,
          message: 'Facebook credentials missing: page_token or page_id',
        };
      }

      const plainText = content.content.replace(/<[^>]*>/g, '');
      let attachedMedia: any[] = [];
      let videoFbId: string | null = null;

      // Upload media attachments
      if (media && media.length > 0) {
        for (const att of media) {
          try {
            if (att.media_type === 'image') {
              const photoRes = await axios.post(
                `https://graph.facebook.com/v19.0/${pageId}/photos`,
                {
                  url: att.media_url,
                  published: false,
                  access_token: pageToken,
                },
              );
              if (photoRes.data?.id) {
                attachedMedia.push({ media_fbid: photoRes.data.id });
              }
            } else if (att.media_type === 'video' && !videoFbId) {
              // Verify video URL is accessible
              try {
                const headRes = await axios.head(att.media_url);
                if (headRes.status !== 200) {
                  this.logger.warn(`Video URL not accessible: ${att.media_url}`);
                  continue;
                }
              } catch (err) {
                this.logger.warn(`Video URL fetch error: ${err}`);
                continue;
              }

              // Upload video
              const videoRes = await axios.post(
                `https://graph.facebook.com/v19.0/${pageId}/videos`,
                {
                  file_url: att.media_url,
                  description: plainText,
                  access_token: pageToken,
                },
              );
              if (videoRes.data?.id) {
                videoFbId = videoRes.data.id;
                attachedMedia.push({ media_fbid: videoRes.data.id });
              }
            }
          } catch (err) {
            this.logger.error(`Media upload error for Facebook`, err);
          }
        }
      }

      // Create feed post
      const postBody: any = {
        message: plainText,
        access_token: pageToken,
      };
      if (attachedMedia.length > 0) {
        postBody.attached_media = attachedMedia;
      } else if (media && media.length > 0) {
        return {
          published: false,
          message:
            'Facebook could not fetch media attachments. Use a public HTTPS URL (Supabase storage or set API_PUBLIC_URL to a reachable host).',
        };
      }

      const postRes = await axios.post(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        postBody,
      );

      if (postRes.data?.id) {
        this.logger.log(`Published to Facebook: ${postRes.data.id}`);
        return {
          published: true,
          message: `Published to Facebook. Post ID: ${postRes.data.id}`,
          externalPostId: postRes.data.id,
        };
      } else {
        return {
          published: false,
          message: `Facebook error: ${JSON.stringify(postRes.data?.error || postRes.data)}`,
        };
      }
    } catch (err) {
      this.logger.error(`Facebook publish error`, err);
      return {
        published: false,
        message: `Facebook publish error: ${err instanceof Error ? err.message : String(err)}`,
        error: String(err),
      };
    }
  }
}
