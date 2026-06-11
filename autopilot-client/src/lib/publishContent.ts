import { contentAiApi, waitForQueueJob } from '@/lib/api';
import { platformOf } from '@/lib/platforms';

export type PublishToast = (params: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) => void;

export type PublishJobResult = {
  published?: boolean;
  results?: Record<string, { published: boolean; message: string }>;
};

export async function submitPublish(
  contentId: string,
  platforms: string[] | undefined,
  platformPayloads: Record<string, unknown> | undefined,
  toast: PublishToast,
  opts?: { waitInForeground?: boolean },
): Promise<PublishJobResult> {
  const response = await contentAiApi.publish(contentId, platforms, platformPayloads);

  if (response.queued && response.jobId != null && response.queue) {
    toast({
      title: 'Added to publish queue',
      description: response.message ?? 'Your content will publish shortly.',
    });

    const finish = async (): Promise<PublishJobResult> => {
      const result = (await waitForQueueJob(response.queue!, response.jobId!)) as PublishJobResult;
      if (result?.published) {
        const labels =
          platforms?.map((p) => platformOf(p).label).join(', ') ?? 'your platforms';
        toast({
          title: 'Published successfully',
          description: `Content was sent to ${labels}.`,
        });
      } else {
        const details = Object.entries(result?.results ?? {})
          .map(([p, r]) => `${platformOf(p).label}: ${r.message}`)
          .join('\n');
        toast({
          title: 'Publish failed',
          description: details || 'Check platform connections and try again.',
          variant: 'destructive',
        });
      }
      return result;
    };

    if (opts?.waitInForeground) {
      return finish();
    }
    void finish();
    return { published: false };
  }

  if (response.published) {
    const labels =
      platforms?.map((p) => platformOf(p).label).join(', ') ?? 'your platforms';
    toast({
      title: 'Published successfully',
      description: `Sent to ${labels}.`,
    });
  } else {
    const details = Object.entries(response.results ?? {})
      .map(([p, r]) => `${platformOf(p).label}: ${r.message}`)
      .join('\n');
    toast({
      title: 'Publish failed',
      description: details || 'Check platform connections.',
      variant: 'destructive',
    });
  }

  return response;
}
