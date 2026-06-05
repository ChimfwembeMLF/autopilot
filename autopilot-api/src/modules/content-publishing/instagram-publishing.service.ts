import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { SocialAccounts } from '../social_accounts/entities/social_accounts.entity';
import { PublishResult, ContentToPublish } from './interfaces/publish-result.interface';

@Injectable()
export class InstagramPublishingService {
  private readonly logger = new Logger(InstagramPublishingService.name);

  constructor(
    @InjectRepository(SocialAccounts)
    private readonly socialAccountsRepo: Repository<SocialAccounts>,
  ) {}

  async publishPost(content: ContentToPublish, media: any[] = []): Promise<PublishResult> {
    try {
      const socialAccount = await this.socialAccountsRepo.findOne({
        where: {
          userId: content.userId,
          platform: 'instagram',
          connected: true,
        },
      });

      if (!socialAccount) {
        return { published: false, message: 'Instagram account not connected' };
      }

      const igToken = socialAccount.accessToken;
      const igAccountId = socialAccount.externalId;

      if (!igToken || !igAccountId) {
        return {
          published: false,
          message: 'Instagram credentials missing',
        };
      }

      const plainText = content.content.replace(/<[^>]*>/g, '');

      if (!media || media.length === 0) {
        return {
          published: false,
          message: 'Instagram requires at least one image or video attachment',
        };
      }

      // Create media containers
      const containerIds: string[] = [];
      for (const m of media) {
        try {
          let mediaTypeParam = 'IMAGE';
          const containerPayload: any = {
            access_token: igToken,
            caption: plainText,
            is_carousel_item: media.length > 1 ? true : undefined,
            alt_text: m.alt_text || undefined,
          };

          if (m.media_type === 'image') {
            containerPayload.image_url = m.media_url;
          } else if (m.media_type === 'video') {
            mediaTypeParam = 'VIDEO';
            containerPayload.media_type = 'VIDEO';
            containerPayload.video_url = m.media_url;
          } else {
            continue;
          }

          const containerRes = await axios.post(
            `https://graph.facebook.com/v25.0/${igAccountId}/media`,
            containerPayload,
          );

          // Check for Instagram token expiration
          if (containerRes.data?.error?.code === 190) {
            if (containerRes.data.error.error_subcode === 463) {
              return {
                published: false,
                message: 'Instagram access token expired. Please reconnect your account.',
              };
            }
            return {
              published: false,
              message: `Instagram token error: ${containerRes.data.error.message}`,
            };
          }

          if (!containerRes.data?.id) {
            throw new Error(`Failed to create media container: ${JSON.stringify(containerRes.data)}`);
          }

          containerIds.push(containerRes.data.id);
        } catch (err) {
          this.logger.error(`Instagram media container error`, err);
          throw err;
        }
      }

      // Publish post (carousel if multiple media)
      let publishData: any;
      let publishRes: any;

      if (containerIds.length === 1) {
        publishRes = await axios.post(
          `https://graph.facebook.com/v25.0/${igAccountId}/media_publish`,
          {
            creation_id: containerIds[0],
            access_token: igToken,
          },
        );
        publishData = publishRes.data;
      } else {
        // Create carousel container
        const carouselRes = await axios.post(
          `https://graph.facebook.com/v25.0/${igAccountId}/media`,
          {
            media_type: 'CAROUSEL',
            children: containerIds,
            caption: plainText,
            access_token: igToken,
          },
        );

        // Check for token expiration on carousel
        if (carouselRes.data?.error?.code === 190) {
          if (carouselRes.data.error.error_subcode === 463) {
            return {
              published: false,
              message: 'Instagram access token expired. Please reconnect your account.',
            };
          }
          return {
            published: false,
            message: `Instagram token error: ${carouselRes.data.error.message}`,
          };
        }

        if (!carouselRes.data?.id) {
          throw new Error(
            `Failed to create carousel container: ${JSON.stringify(carouselRes.data)}`,
          );
        }

        // Publish carousel
        publishRes = await axios.post(
          `https://graph.facebook.com/v25.0/${igAccountId}/media_publish`,
          {
            creation_id: carouselRes.data.id,
            access_token: igToken,
          },
        );
        publishData = publishRes.data;
      }

      // Check for token expiration on publish
      if (publishData?.error?.code === 190) {
        if (publishData.error.error_subcode === 463) {
          return {
            published: false,
            message: 'Instagram access token expired. Please reconnect your account.',
          };
        }
        return {
          published: false,
          message: `Instagram token error: ${publishData.error.message}`,
        };
      }

      if (publishData?.id) {
        this.logger.log(`Published to Instagram: ${publishData.id}`);
        return {
          published: true,
          message: `Published to Instagram. Post ID: ${publishData.id}`,
          externalPostId: publishData.id,
        };
      } else {
        return {
          published: false,
          message: `Instagram publish error: ${JSON.stringify(publishData)}`,
        };
      }
    } catch (err) {
      this.logger.error(`Instagram publish error`, err);
      return {
        published: false,
        message: `Instagram publish error: ${err instanceof Error ? err.message : String(err)}`,
        error: String(err),
      };
    }
  }
}
