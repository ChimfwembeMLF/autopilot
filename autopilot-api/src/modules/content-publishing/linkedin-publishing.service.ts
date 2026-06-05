import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { SocialAccounts } from '../social_accounts/entities/social_accounts.entity';
import { PublishResult, ContentToPublish } from './interfaces/publish-result.interface';

@Injectable()
export class LinkedInPublishingService {
  private readonly logger = new Logger(LinkedInPublishingService.name);

  constructor(
    @InjectRepository(SocialAccounts)
    private readonly socialAccountsRepo: Repository<SocialAccounts>,
  ) {}

  async publishPost(content: ContentToPublish, media: any[] = []): Promise<PublishResult> {
    try {
      const socialAccount = await this.socialAccountsRepo.findOne({
        where: {
          userId: content.userId,
          platform: 'linkedin',
          connected: true,
        },
      });

      if (!socialAccount) {
        return { published: false, message: 'LinkedIn account not connected' };
      }

      const liToken = socialAccount.accessToken;
      const liPersonId = socialAccount.metadata?.person_id;

      if (!liToken || !liPersonId) {
        return {
          published: false,
          message: 'LinkedIn credentials missing',
        };
      }

      const plainText = content.content.replace(/<[^>]*>/g, '');
      const mediaArray: any[] = [];
      let shareMediaCategory = 'NONE';

      // Upload media attachments
      if (media && media.length > 0) {
        for (const att of media) {
          try {
            let recipe = null;
            let mediaType = null;

            if (att.media_type === 'image') {
              recipe = 'urn:li:digitalmediaRecipe:feedshare-image';
              mediaType = 'IMAGE';
            } else if (att.media_type === 'video') {
              recipe = 'urn:li:digitalmediaRecipe:feedshare-video';
              mediaType = 'VIDEO';
            } else {
              continue;
            }

            // Step 1: Register upload
            const registerRes = await axios.post(
              'https://api.linkedin.com/v2/assets?action=registerUpload',
              {
                registerUploadRequest: {
                  owner: `urn:li:person:${liPersonId}`,
                  recipes: [recipe],
                  serviceRelationships: [
                    {
                      relationshipType: 'OWNER',
                      identifier: 'urn:li:userGeneratedContent',
                    },
                  ],
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${liToken}`,
                  'Content-Type': 'application/json',
                  'X-Restli-Protocol-Version': '2.0.0',
                },
              },
            );

            const uploadUrl =
              registerRes.data?.value?.uploadMechanism?.[
                'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'
              ]?.uploadUrl;
            const asset = registerRes.data?.value?.asset;

            if (uploadUrl && asset) {
              // Step 2: Upload media binary
              const mediaRes = await axios.get(att.media_url, {
                responseType: 'arraybuffer',
              });
              const mediaBlob = mediaRes.data;

              await axios.put(uploadUrl, mediaBlob, {
                headers: { 'Content-Type': 'application/octet-stream' },
              });

              // Step 3: Add to media array
              mediaArray.push({ status: 'READY', media: asset });

              // Set shareMediaCategory
              if (mediaType === 'VIDEO') {
                shareMediaCategory = 'VIDEO';
              } else if (shareMediaCategory !== 'VIDEO') {
                shareMediaCategory = 'IMAGE';
              }
            }
          } catch (err) {
            this.logger.error(`LinkedIn media upload error`, err);
          }
        }
      }

      // Create post
      const postBody: any = {
        author: `urn:li:person:${liPersonId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: plainText },
            shareMediaCategory,
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      if (mediaArray.length > 0) {
        postBody.specificContent['com.linkedin.ugc.ShareContent'].media = mediaArray;
      }

      const res = await axios.post('https://api.linkedin.com/v2/ugcPosts', postBody, {
        headers: {
          Authorization: `Bearer ${liToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      const externalPostId =
        res.headers['x-restli-id'] ?? res.data?.id ?? undefined;

      if (res.status === 201 || externalPostId) {
        this.logger.log(`Published to LinkedIn: ${externalPostId}`);
        return {
          published: true,
          message: `Published to LinkedIn.`,
          externalPostId,
        };
      } else {
        return {
          published: false,
          message: `LinkedIn error: ${JSON.stringify(res.data)}`,
        };
      }
    } catch (err) {
      this.logger.error(`LinkedIn publish error`, err);
      return {
        published: false,
        message: `LinkedIn publish error: ${err instanceof Error ? err.message : String(err)}`,
        error: String(err),
      };
    }
  }
}
