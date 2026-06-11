import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bot, Loader2, MessageSquare, Send } from 'lucide-react';
import { whatsappApi } from '@/lib/api';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageAttachments } from './MessageAttachments';
import { MessageReactions } from './MessageReactions';
import { cn } from '@/lib/utils';

type Conversation = {
  phone: string;
  lastMessage: string;
  lastAt: string;
  inboundCount: number;
};

type Message = {
  id: string;
  phone: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: string;
  attachments?: Array<{ url?: string; type?: string; name?: string }>;
  reactions?: Array<{ type: string; count?: number }>;
  created_at: string;
};

export function WhatsAppInbox() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!tenant) return;
    try {
      const rows = await whatsappApi.conversations(tenant.id);
      setConversations(rows);
      setSelectedPhone((prev) => prev ?? rows[0]?.phone ?? null);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  const loadMessages = useCallback(async () => {
    if (!tenant || !selectedPhone) {
      setMessages([]);
      return;
    }
    try {
      const rows = await whatsappApi.listMessages(tenant.id, selectedPhone);
      setMessages(
        [...rows].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ),
      );
    } catch {
      setMessages([]);
    }
  }, [tenant, selectedPhone]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  async function sendReply() {
    if (!tenant || !selectedPhone || !replyText.trim()) return;
    setSending(true);
    try {
      const result = await whatsappApi.reply({
        tenantId: tenant.id,
        phone: selectedPhone,
        message: replyText.trim(),
      });
      if (!result.sent) {
        throw new Error(result.message ?? 'Send failed');
      }
      setReplyText('');
      await loadMessages();
      await loadConversations();
      toast({ title: 'Message sent' });
    } catch (err: unknown) {
      toast({
        title: 'Send failed',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading WhatsApp…
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
        <MessageSquare className="h-8 w-8 mx-auto opacity-40" />
        <p>No WhatsApp messages yet. Inbound DMs appear here when your number is connected.</p>
        <p className="text-xs">Enable auto-reply rules for WhatsApp on the Rules tab.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-4 min-h-[480px]">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-3 border-b text-xs font-medium text-muted-foreground">Conversations</div>
          <div className="max-h-[520px] overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.phone}
                type="button"
                onClick={() => setSelectedPhone(c.phone)}
                className={cn(
                  'w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors',
                  selectedPhone === c.phone && 'bg-primary/5',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">{c.phone}</span>
                  {c.inboundCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {c.inboundCount}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {formatDistanceToNow(new Date(c.lastAt), { addSuffix: true })}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        <CardContent className="p-0 flex flex-col flex-1 min-h-[480px]">
          <div className="p-3 border-b flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">WhatsApp</Badge>
            <span className="text-sm font-medium">{selectedPhone}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex',
                  m.direction === 'outbound' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                    m.direction === 'outbound'
                      ? m.status === 'auto_reply'
                        ? 'bg-primary/15 border border-primary/25 rounded-br-sm'
                        : 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm',
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <MessageAttachments items={m.attachments ?? []} />
                  <MessageReactions items={m.reactions ?? []} />
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] opacity-70">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                    {m.status === 'auto_reply' && (
                      <Badge variant="secondary" className="text-[9px] h-4 gap-0.5">
                        <Bot className="h-2.5 w-2.5" /> auto
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t space-y-2">
            <Textarea
              rows={2}
              placeholder="Reply on WhatsApp…"
              className="resize-none text-sm"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendReply();
                }
              }}
            />
            <Button size="sm" onClick={() => void sendReply()} disabled={sending || !replyText.trim()}>
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Send className="h-3.5 w-3.5 mr-2" />}
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
