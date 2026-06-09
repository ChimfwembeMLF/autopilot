import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';
import axios from 'axios';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { SupabaseStorageService } from '../../media/supabase-storage.service';

@Injectable()
export class MistralAgentsService {
  private readonly logger = new Logger(MistralAgentsService.name);
  private client: Mistral | null = null;
  private cachedAgentId: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly storage: SupabaseStorageService,
  ) {}

  private getClient(): Mistral {
    const apiKey = this.config.get<string>('MISTRAL_API_KEY');
    if (!apiKey?.trim()) {
      throw new ServiceUnavailableException('MISTRAL_API_KEY is not configured');
    }
    if (!this.client) {
      this.client = new Mistral({ apiKey: apiKey.trim() });
    }
    return this.client;
  }

  private get imageModel(): string {
    return this.config.get<string>('MISTRAL_IMAGE_AGENT_MODEL') || 'mistral-medium-latest';
  }

  private uploadsDir(): string {
    const dir = join(process.cwd(), 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  private async getOrCreateImageAgent(): Promise<string> {
    const fromEnv = this.config.get<string>('MISTRAL_IMAGE_AGENT_ID');
    if (fromEnv?.trim()) return fromEnv.trim();
    if (this.cachedAgentId) return this.cachedAgentId;

    const client = this.getClient();
    const agent = await client.beta.agents.create({
      model: this.imageModel,
      name: 'AutoPilot Image Generator',
      description: 'Generates marketing images',
      instructions:
        'Generate high-quality marketing images when asked. Use the image_generation tool.',
      tools: [{ type: 'image_generation' }],
    });

    if (!agent.id) throw new BadRequestException('Failed to create Mistral image agent');
    this.cachedAgentId = agent.id;
    return agent.id;
  }

  async generateImage(
    prompt: string,
    options?: { tenantId?: string },
  ): Promise<{ filePath: string; publicUrl: string; fileId: string }> {
    const client = this.getClient();
    const agentId = await this.getOrCreateImageAgent();

    const response = await client.beta.conversations.start({
      agentId,
      inputs: prompt,
    });

    const fileIds: string[] = [];
    for (const output of response.outputs ?? []) {
      const content = (output as { content?: unknown }).content;
      if (!Array.isArray(content)) continue;
      for (const chunk of content) {
        const c = chunk as { type?: string; fileId?: string; file_id?: string };
        if (c.type === 'tool_file' || c.fileId || c.file_id) {
          fileIds.push(String(c.fileId ?? c.file_id));
        }
      }
    }

    if (!fileIds.length) {
      throw new BadRequestException(
        'Image generation did not return a file. Check Mistral Agents API access on your account.',
      );
    }

    const fileId = fileIds[0];
    const apiKey = this.config.getOrThrow<string>('MISTRAL_API_KEY');
    const fileRes = await axios.get<ArrayBuffer>(
      `https://api.mistral.ai/v1/files/${fileId}/content`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        responseType: 'arraybuffer',
      },
    );

    const buffer = Buffer.from(fileRes.data);
    const tenantId = options?.tenantId ?? 'shared';

    if (this.storage.isEnabled()) {
      const uploaded = await this.storage.uploadBuffer({
        tenantId,
        buffer,
        contentType: 'image/png',
        originalName: `ai-${fileId.slice(0, 8)}.png`,
        prefix: 'ai',
      });
      this.logger.log(`Saved generated image → ${uploaded.publicUrl}`);
      return { filePath: uploaded.storagePath, publicUrl: uploaded.publicUrl, fileId };
    }

    const filename = `ai-${Date.now()}-${fileId.slice(0, 8)}.png`;
    const filePath = join(this.uploadsDir(), filename);
    await pipeline(
      (await import('stream')).Readable.from(buffer),
      createWriteStream(filePath),
    );

    const publicUrl = `/uploads/${filename}`;
    const port = this.config.get<string>('PORT') || '4000';
    this.logger.log(`Saved generated image → ${publicUrl} (port ${port})`);
    return { filePath, publicUrl, fileId };
  }
}
