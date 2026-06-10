import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { google } from 'googleapis';
import { ContentPublications } from '../content_publications/entities/content_publications.entity';
import { SocialAccounts } from '../social_accounts/entities/social_accounts.entity';
import { CommentReplies } from '../comment_replies/entities/comment_replies.entity';
import { YoutubePublishingService } from './youtube-publishing.service';
import { SocialCommentAutoReplyService } from './social-comment-auto-reply.service';

type FetchedComment = {
  externalCommentId: string;
  externalPostId: string;
  commenterName: string;
  commenterAvatarUrl?: string;
  commentText: string;
  parentCommentId?: string;
};

@Injectable()
export class FetchCommentsService {
  private readonly logger = new Logger(FetchCommentsService.name);

  constructor(
    @InjectRepository(ContentPublications)
    private readonly publicationsRepo: Repository<ContentPublications>,
    @InjectRepository(SocialAccounts)
    private readonly socialRepo: Repository<SocialAccounts>,
    @InjectRepository(CommentReplies)
    private readonly commentsRepo: Repository<CommentReplies>,
    private readonly youtubePublish: YoutubePublishingService,
    private readonly autoReply: SocialCommentAutoReplyService,
    private readonly config: ConfigService,
  ) {}

  async fetchForTenant(params: {
    tenantId: string;
    userId: string;
    runAutoReply?: boolean;
  }): Promise<{ fetched: number; autoReplied: number }> {
    const publications = await this.publicationsRepo.find({
      where: { tenantId: params.tenantId, status: 'published' },
      order: { publishedAt: 'DESC' },
    });

    const latestByPlatform = new Map<string, ContentPublications>();
    for (const pub of publications) {
      if (!pub.externalPostId) continue;
      const key = `${pub.contentId}:${pub.platform}`;
      if (!latestByPlatform.has(key)) latestByPlatform.set(key, pub);
    }

    let fetched = 0;
    const newCommentIds: string[] = [];
    for (const pub of latestByPlatform.values()) {
      try {
        const comments = await this.pullComments(pub, params.userId);
        for (const c of comments) {
          const exists = await this.commentsRepo.findOne({
            where: { tenantId: params.tenantId, externalCommentId: c.externalCommentId },
          });
          if (exists) continue;

          const saved = await this.commentsRepo.save(
            this.commentsRepo.create({
              tenantId: params.tenantId,
              contentId: pub.contentId,
              platform: pub.platform,
              externalCommentId: c.externalCommentId,
              externalPostId: c.externalPostId,
              commenterName: c.commenterName,
              commenterAvatarUrl: c.commenterAvatarUrl,
              commentText: c.commentText,
              parentCommentId: c.parentCommentId,
              status: 'pending',
            }),
          );
          fetched++;
          newCommentIds.push(saved.id);
        }
      } catch (err) {
        this.logger.warn(`Comment fetch failed for ${pub.platform} post ${pub.externalPostId}`, err);
      }
    }

    let autoReplied = 0;
    if (params.runAutoReply !== false && newCommentIds.length) {
      const result = await this.autoReply.processNewComments(newCommentIds, params.userId);
      autoReplied = result.sent;
    }

    return { fetched, autoReplied };
  }

  /** Sync comments for every tenant with published posts (cron). */
  async fetchAllTenants(): Promise<{
    fetched: number;
    tenants: number;
    autoReplied: number;
  }> {
    const pubs = await this.publicationsRepo.find({
      where: { status: 'published' },
      order: { publishedAt: 'DESC' },
    });

    const tenantUsers = new Map<string, string>();
    for (const pub of pubs) {
      if (!pub.externalPostId || tenantUsers.has(pub.tenantId)) continue;
      tenantUsers.set(pub.tenantId, pub.userId);
    }

    let fetched = 0;
    let autoReplied = 0;
    let tenants = 0;
    const delayMs = Number(this.config.get('COMMENT_SYNC_TENANT_DELAY_MS') ?? 300);

    for (const [tenantId, userId] of tenantUsers) {
      const result = await this.fetchForTenant({ tenantId, userId, runAutoReply: true });
      fetched += result.fetched;
      autoReplied += result.autoReplied;
      tenants++;
      if (delayMs > 0) {
        await this.sleep(delayMs);
      }
    }

    return { fetched, tenants, autoReplied };
  }

  /** @deprecated Use fetchAllTenants — kept for compatibility */
  async fetchAllWithRateLimit(
    lastRunByTenant: Map<string, number>,
    minIntervalMs: number,
  ): Promise<{ fetched: number; tenants: number }> {
    void lastRunByTenant;
    void minIntervalMs;
    const result = await this.fetchAllTenants();
    return { fetched: result.fetched, tenants: result.tenants };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async pullComments(
    pub: ContentPublications,
    userId: string,
  ): Promise<FetchedComment[]> {
    const account = pub.socialAccountId
      ? await this.socialRepo.findOne({ where: { id: pub.socialAccountId } })
      : await this.socialRepo.findOne({
          where: { userId, platform: pub.platform, connected: true },
        });

    if (!account) return [];

    switch (pub.platform.toLowerCase()) {
      case 'facebook':
        return this.fetchFacebookComments(pub.externalPostId!, account);
      case 'instagram':
        return this.fetchInstagramComments(pub.externalPostId!, account);
      case 'linkedin':
        return this.fetchLinkedInComments(pub.externalPostId!, account);
      case 'youtube':
        return this.fetchYoutubeComments(pub.externalPostId!, account);
      default:
        return [];
    }
  }

  private async fetchFacebookComments(
    postId: string,
    account: SocialAccounts,
  ): Promise<FetchedComment[]> {
    const token = account.metadata?.page_token ?? account.accessToken;
    if (!token) return [];

    const res = await axios.get(`https://graph.facebook.com/v19.0/${postId}/comments`, {
      params: {
        access_token: token,
        fields: 'id,message,from,created_time,parent',
        limit: 50,
      },
    });

    return (res.data?.data ?? []).map((c: Record<string, unknown>) => ({
      externalCommentId: String(c.id),
      externalPostId: postId,
      commenterName: String((c.from as { name?: string })?.name ?? 'Facebook user'),
      commentText: String(c.message ?? ''),
      parentCommentId: (c.parent as { id?: string })?.id,
    }));
  }

  private async fetchInstagramComments(
    mediaId: string,
    account: SocialAccounts,
  ): Promise<FetchedComment[]> {
    const token = account.accessToken;
    if (!token) return [];

    const res = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}/comments`, {
      params: {
        access_token: token,
        fields: 'id,text,username,timestamp',
        limit: 50,
      },
    });

    return (res.data?.data ?? []).map((c: Record<string, unknown>) => ({
      externalCommentId: String(c.id),
      externalPostId: mediaId,
      commenterName: String(c.username ?? 'Instagram user'),
      commentText: String(c.text ?? ''),
    }));
  }

  private async fetchLinkedInComments(
    postUrn: string,
    account: SocialAccounts,
  ): Promise<FetchedComment[]> {
    const token = account.accessToken;
    if (!token) return [];

    try {
      const res = await axios.get(
        `https://api.linkedin.com/v2/socialActions/${encodeURIComponent(postUrn)}/comments`,
        {
          headers: { Authorization: `Bearer ${token}`, 'X-Restli-Protocol-Version': '2.0.0' },
          params: { count: 50 },
        },
      );

      const elements = res.data?.elements ?? [];
      return elements.map((c: Record<string, unknown>) => {
        const actor = c.actor as string | undefined;
        const message = c.message as { text?: string } | undefined;
        return {
          externalCommentId: String(c.id ?? c.$URN ?? ''),
          externalPostId: postUrn,
          commenterName: actor?.replace('urn:li:person:', 'LinkedIn user ') ?? 'LinkedIn user',
          commentText: String(message?.text ?? ''),
        };
      });
    } catch (err) {
      this.logger.warn('LinkedIn comment fetch requires r_member_social / partner access', err);
      return [];
    }
  }

  private async fetchYoutubeComments(
    videoId: string,
    account: SocialAccounts,
  ): Promise<FetchedComment[]> {
    try {
      const auth = this.youtubePublish.oauthClient(account);
      const youtube = google.youtube({ version: 'v3', auth });
      const { data } = await youtube.commentThreads.list({
        part: ['snippet'],
        videoId,
        maxResults: 50,
        order: 'time',
      });

      return (data.items ?? []).map((thread) => {
        const top = thread.snippet?.topLevelComment?.snippet;
        const commentId = thread.snippet?.topLevelComment?.id ?? thread.id;
        return {
          externalCommentId: String(commentId ?? ''),
          externalPostId: videoId,
          commenterName: top?.authorDisplayName ?? 'YouTube user',
          commenterAvatarUrl: top?.authorProfileImageUrl,
          commentText: String(top?.textDisplay ?? top?.textOriginal ?? ''),
        };
      });
    } catch (err) {
      this.logger.warn('YouTube comment fetch failed', err);
      return [];
    }
  }
}
