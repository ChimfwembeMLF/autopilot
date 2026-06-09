import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join, extname } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { MediaAssets } from '../content_items/entities/media_assets.entity';
import { SupabaseStorageService } from './supabase-storage.service';
import { canonicalMediaUrl } from '../content_items/utils/media-url.util';

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class MediaService {
  private uploadsDir(): string {
    const dir = join(process.cwd(), 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  constructor(
    @InjectRepository(MediaAssets)
    private readonly mediaRepo: Repository<MediaAssets>,
    private readonly storage: SupabaseStorageService,
  ) {}

  async findByTenant(tenantId: string) {
    if (!tenantId) return [];
    return this.mediaRepo.find({
      where: { tenantId },
      order: { created_at: 'DESC' },
    });
  }

  async upload(params: {
    tenantId: string;
    userId: string;
    file: Express.Multer.File;
    contentId?: string;
  }) {
    if (!params.tenantId) throw new BadRequestException('tenantId is required');
    if (!params.file?.buffer?.length) throw new BadRequestException('file is required');
    if (params.file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('File exceeds 50 MB limit');
    }

    const mediaType = params.file.mimetype.startsWith('video/') ? 'video' : 'image';
    let mediaUrl: string;

    if (this.storage.isEnabled()) {
      const uploaded = await this.storage.uploadBuffer({
        tenantId: params.tenantId,
        buffer: params.file.buffer,
        contentType: params.file.mimetype,
        originalName: params.file.originalname,
        prefix: 'uploads',
      });
      mediaUrl = uploaded.publicUrl;
    } else {
      const ext = extname(params.file.originalname) || '.bin';
      const filename = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = join(this.uploadsDir(), filename);
      await pipeline(Readable.from(params.file.buffer), createWriteStream(filePath));
      mediaUrl = `/uploads/${filename}`;
    }

    return this.mediaRepo.save(
      this.mediaRepo.create({
        tenantId: params.tenantId,
        contentId: params.contentId,
        mediaUrl,
        mediaType,
        name: params.file.originalname,
        uploadedBy: params.userId,
        fileSizeBytes: String(params.file.size),
      }),
    );
  }

  async attachToContent(params: {
    tenantId: string;
    contentId: string;
    items: Array<{ url: string; type?: string }>;
    userId: string;
  }) {
    const saved: MediaAssets[] = [];
    for (const item of params.items) {
      const mediaUrl = canonicalMediaUrl(item.url);
      const existing = await this.mediaRepo.findOne({
        where: { tenantId: params.tenantId, contentId: params.contentId, mediaUrl },
      });
      if (existing) {
        saved.push(existing);
        continue;
      }
      saved.push(
        await this.mediaRepo.save(
          this.mediaRepo.create({
            tenantId: params.tenantId,
            contentId: params.contentId,
            mediaUrl,
            mediaType: item.type ?? 'image',
            uploadedBy: params.userId,
          }),
        ),
      );
    }
    return saved;
  }

  async remove(id: string, tenantId: string) {
    const asset = await this.mediaRepo.findOne({ where: { id, tenantId } });
    if (!asset) throw new NotFoundException('Media not found');

    if (this.storage.isEnabled() && this.storage.isSupabaseUrl(asset.mediaUrl)) {
      await this.storage.deleteByUrl(asset.mediaUrl);
    } else if (asset.mediaUrl.startsWith('/uploads/')) {
      const filename = asset.mediaUrl.replace(/^\/uploads\//, '');
      const filePath = join(this.uploadsDir(), filename);
      try {
        if (existsSync(filePath)) unlinkSync(filePath);
      } catch {
        /* ignore */
      }
    }

    await this.mediaRepo.delete(id);
    return { deleted: true };
  }
}
