import { formatDistanceToNow } from 'date-fns';
import { Bot, ChevronRight, Loader2, PenLine, Send, ThumbsUp } from 'lucide-react';
import type { CommentInboxNode } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { MessageAttachments } from './MessageAttachments';
import { MessageReactions } from './MessageReactions';
import { cn } from '@/lib/utils';

type Props = {
  node: CommentInboxNode;
  depth?: number;
  brandPageName?: string | null;
  canReply: boolean;
  sendingId: string | null;
  replyingToId: string | null;
  getDraft: (id: string) => string;
  onDraftChange: (id: string, text: string) => void;
  onStartReply: (id: string) => void;
  onSend: (node: CommentInboxNode) => void;
  onAiDraft: (node: CommentInboxNode) => void;
  onDismiss: (node: CommentInboxNode) => void;
};

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function replyBody(node: CommentInboxNode): string {
  return (node.replyText ?? node.commentText ?? '').trim();
}

function hasSyncedBrandReply(node: CommentInboxNode): boolean {
  const parentReply = node.replyText?.trim();
  if (!parentReply) return false;
  return node.children.some(
    (child) => child.isFromBrand && replyBody(child) === parentReply,
  );
}

function CommentBubble({
  node,
  brandPageName,
  canReply,
  sendingId,
  replyingToId,
  getDraft,
  onDraftChange,
  onStartReply,
  onSend,
  onAiDraft,
  onDismiss,
}: Props) {
  const isAuthor = node.isFromBrand;
  const showComposer = canReply && node.status === 'pending' && replyingToId === node.id;
  const displayName = isAuthor && brandPageName ? brandPageName : node.commenterName;
  const displayText = isAuthor ? replyBody(node) : node.commentText;
  const showInlineReply =
    !isAuthor &&
    node.status === 'sent' &&
    Boolean(node.replyText?.trim()) &&
    !hasSyncedBrandReply(node);
  const attachments = node.attachments ?? [];
  const reactions = [
    ...(node.reactions ?? []),
    ...(node.likeCount > 0 ? [{ type: 'like', count: node.likeCount }] : []),
  ];

  return (
    <div className="flex gap-2 sm:gap-2.5">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        {node.commenterAvatarUrl ? (
          <AvatarImage src={node.commenterAvatarUrl} alt={node.commenterName} />
        ) : null}
        <AvatarFallback className="text-[10px] bg-muted">
          {initials(node.commenterName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[13px] font-semibold leading-none">{displayName}</span>
          {isAuthor && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 px-1.5 gap-0.5 font-normal bg-primary/15 text-primary border-0"
            >
              <PenLine className="h-2.5 w-2.5" />
              Author
            </Badge>
          )}
        </div>

        <div
          className={cn(
            'inline-block max-w-full rounded-2xl px-3 py-2 text-[13px] leading-relaxed',
            isAuthor ? 'bg-muted/90 text-foreground' : 'bg-muted/50 text-foreground',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{displayText}</p>
          <MessageAttachments items={attachments} />
          <MessageReactions items={reactions} />
        </div>

        {showInlineReply && (
          <div className="mt-2 ml-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[12px] font-semibold">{brandPageName ?? 'Author'}</span>
              <Badge
                variant="secondary"
                className="text-[10px] h-4 px-1.5 gap-0.5 font-normal bg-primary/15 text-primary border-0"
              >
                <PenLine className="h-2.5 w-2.5" />
                Author
              </Badge>
            </div>
            <div className="inline-block rounded-2xl bg-muted/90 px-3 py-2 text-[13px] leading-relaxed">
              {node.replyText}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground pl-1">
          <span>{formatDistanceToNow(new Date(node.created_at), { addSuffix: true })}</span>
          {canReply && node.status === 'pending' && (
            <>
              <button
                type="button"
                className="font-semibold hover:underline"
                onClick={() => onStartReply(node.id)}
              >
                Reply
              </button>
              <button type="button" className="hover:underline" onClick={() => onDismiss(node)}>
                Dismiss
              </button>
            </>
          )}
        </div>

        {showComposer && (
          <div className="mt-2 space-y-2 pl-1">
            <Textarea
              rows={2}
              autoFocus
              placeholder={`Reply as ${brandPageName ?? 'your page'}…`}
              className="text-sm resize-none rounded-xl bg-background"
              value={getDraft(node.id)}
              onChange={(e) => onDraftChange(node.id, e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-8 rounded-lg"
                onClick={() => onSend(node)}
                disabled={sendingId === node.id || !getDraft(node.id).trim()}
              >
                {sendingId === node.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1" /> Reply
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg"
                onClick={() => onAiDraft(node)}
                disabled={sendingId === node.id}
              >
                <Bot className="h-3.5 w-3.5 mr-1" /> AI draft
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentThread(props: Props) {
  const { node, depth = 0, brandPageName } = props;
  const hasChildren = node.children.length > 0;
  const preview = (node.isFromBrand ? replyBody(node) : node.commentText).slice(0, 80);

  if (!hasChildren) {
    return (
      <div className={cn('relative', depth > 0 && 'mt-2')}>
        {depth > 0 && (
          <div
            className="absolute -left-[18px] sm:-left-[22px] top-0 bottom-0 w-0.5 bg-border/80 rounded-full"
            aria-hidden
          />
        )}
        <CommentBubble {...props} />
      </div>
    );
  }

  return (
    <div className={cn('relative', depth > 0 && 'mt-2')}>
      {depth > 0 && (
        <div
          className="absolute -left-[18px] sm:-left-[22px] top-0 bottom-0 w-0.5 bg-border/80 rounded-full"
          aria-hidden
        />
      )}
      <Accordion type="single" collapsible className="w-full border-0">
        <AccordionItem value={node.id} className="border-0">
          <AccordionTrigger className="py-2 hover:no-underline [&[data-state=open]>svg]:rotate-90">
            <div className="flex items-center gap-2 text-left flex-1 min-w-0 pr-2">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform" />
              <span className="text-[13px] font-semibold truncate">
                {node.isFromBrand && brandPageName ? brandPageName : node.commenterName}
              </span>
              <span className="text-xs text-muted-foreground truncate flex-1">{preview}</span>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {node.children.length} repl{node.children.length === 1 ? 'y' : 'ies'}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-2 pt-0">
            <CommentBubble {...props} />
            <div className="ml-9 sm:ml-10 mt-2 space-y-1 border-l-2 border-border/60 pl-3 sm:pl-4">
              {node.children.map((child) => (
                <CommentThread
                  key={child.id}
                  {...props}
                  node={child}
                  depth={depth + 1}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
