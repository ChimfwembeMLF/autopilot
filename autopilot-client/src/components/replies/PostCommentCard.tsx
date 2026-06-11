import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, MessageCircle, Share2, ThumbsUp, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CommentInboxNode, PostInboxGroup } from '@/lib/api';
import { platformOf } from '@/lib/platforms';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CommentThread } from './CommentThread';
import { PostMediaGallery } from './PostMediaGallery';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

type Props = {
  post: PostInboxGroup;
  canReply: boolean;
  sendingId: string | null;
  manualText: Record<string, string>;
  onDraftChange: (id: string, text: string) => void;
  onSend: (node: CommentInboxNode) => void;
  onAiDraft: (node: CommentInboxNode) => void;
  onDismiss: (node: CommentInboxNode) => void;
  /** Hide link when already on content detail page */
  hideViewLink?: boolean;
  /** Show full media gallery instead of compact thumb in header */
  fullMedia?: boolean;
};

export function PostCommentCard({
  post,
  canReply,
  sendingId,
  manualText,
  onDraftChange,
  onSend,
  onAiDraft,
  onDismiss,
  hideViewLink = false,
  fullMedia = false,
}: Props) {
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const platform = platformOf(post.platform);
  const PlatformIcon = platform.icon;
  const media = post.postMedia?.filter((m) => m.url) ?? [];

  return (
    <Card className="overflow-hidden border-border/80 bg-card">
      <div className="p-4 border-b bg-muted/20">
        <div className="flex gap-3">
          {!fullMedia && (
            media.length > 0 ? (
              <PostMediaGallery items={media} variant="compact" />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <PlatformIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-[10px] gap-1">
                <PlatformIcon className="h-3 w-3" />
                {platform.label}
              </Badge>
              {post.brandPageName && (
                <span className="text-xs text-muted-foreground">{post.brandPageName}</span>
              )}
              {post.engagementScore > 0 && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <TrendingUp className="h-3 w-3" />
                  score {post.engagementScore}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-snug">{post.postTitle}</h3>
            {post.postContent && (
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                {post.postContent}
              </p>
            )}
            {post.publishedAt && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Published {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        {fullMedia && media.length > 0 && <PostMediaGallery items={media} variant="full" />}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground flex-wrap">
          {post.likeCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white">
                <ThumbsUp className="h-2.5 w-2.5" />
              </span>
              {post.likeCount}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount || post.totalComments} comment
            {(post.commentCount || post.totalComments) === 1 ? '' : 's'}
          </span>
          {post.shareCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5" />
              {post.shareCount}
            </span>
          )}
          {post.viewCount > 0 && <span>{post.viewCount.toLocaleString()} views</span>}
          {!hideViewLink && (
            <Link
              to={`/content/${post.contentId}`}
              className="inline-flex items-center gap-1 text-primary hover:underline ml-auto"
            >
              View post <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      <CardContent className="p-0 bg-background/50">
        {post.comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4 px-4">
            No comments on this post yet. Pull comments to sync.
          </p>
        ) : (
          <Accordion type="single" collapsible defaultValue="comments" className="w-full">
            <AccordionItem value="comments" className="border-0">
              <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm font-medium">
                <span className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Comments ({post.totalComments || post.comments.length})
                  {post.pendingCount > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {post.pendingCount} pending
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                {post.comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    node={comment}
                    brandPageName={post.brandPageName}
                    canReply={canReply}
                    sendingId={sendingId}
                    replyingToId={replyingToId}
                    getDraft={(id) => manualText[id] ?? ''}
                    onDraftChange={onDraftChange}
                    onStartReply={setReplyingToId}
                    onSend={(node) => {
                      onSend(node);
                      setReplyingToId(null);
                    }}
                    onAiDraft={onAiDraft}
                    onDismiss={onDismiss}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
