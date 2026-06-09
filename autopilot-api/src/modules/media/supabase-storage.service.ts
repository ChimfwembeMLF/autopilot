import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

export interface StorageUploadResult {
  publicUrl: string;
  storagePath: string;
}

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    const url = this.config.get<string>('SUPABASE_URL')?.trim();
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    return Boolean(url && key);
  }

  get bucket(): string {
    return this.config.get<string>('SUPABASE_STORAGE_BUCKET')?.trim() || 'media';
  }

  isSupabaseUrl(url: string): boolean {
    if (!url) return false;
    const base = this.config.get<string>('SUPABASE_URL')?.trim().replace(/\/$/, '');
    if (base && url.startsWith(base)) return true;
    return /supabase\.co\/storage\/v1\/object\//.test(url);
  }

  private getClient(): SupabaseClient {
    if (this.client) return this.client;
    const url = this.config.get<string>('SUPABASE_URL')?.trim();
    const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')?.trim();
    if (!url || !key) {
      throw new Error('Supabase storage is not configured');
    }
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this.client;
  }

  buildObjectPath(params: {
    tenantId: string;
    prefix?: string;
    ext: string;
  }): string {
    const safeTenant = params.tenantId.replace(/[^a-zA-Z0-9-]/g, '');
    const folder = params.prefix ?? 'uploads';
    return `${safeTenant}/${folder}/${randomUUID()}${params.ext}`;
  }

  async uploadBuffer(params: {
    tenantId: string;
    buffer: Buffer;
    contentType: string;
    originalName?: string;
    prefix?: string;
  }): Promise<StorageUploadResult> {
    const ext =
      extname(params.originalName ?? '') ||
      (params.contentType.startsWith('video/') ? '.mp4' : '.bin');
    const storagePath = this.buildObjectPath({
      tenantId: params.tenantId,
      prefix: params.prefix,
      ext,
    });

    const client = this.getClient();
    const { error } = await client.storage.from(this.bucket).upload(storagePath, params.buffer, {
      contentType: params.contentType,
      upsert: false,
      cacheControl: '3600',
    });

    if (error) {
      this.logger.error(`Supabase upload failed: ${error.message}`);
      throw error;
    }

    const { data } = client.storage.from(this.bucket).getPublicUrl(storagePath);
    return { publicUrl: data.publicUrl, storagePath };
  }

  pathFromPublicUrl(publicUrl: string): string | null {
    if (!publicUrl) return null;
    const marker = `/storage/v1/object/public/${this.bucket}/`;
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(publicUrl.slice(idx + marker.length));
  }

  async deleteByUrl(publicUrl: string): Promise<void> {
    const path = this.pathFromPublicUrl(publicUrl);
    if (!path) return;
    await this.deleteByPath(path);
  }

  async deleteByPath(storagePath: string): Promise<void> {
    const client = this.getClient();
    const { error } = await client.storage.from(this.bucket).remove([storagePath]);
    if (error) {
      this.logger.warn(`Supabase delete failed for ${storagePath}: ${error.message}`);
    }
  }
}
