import {
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  IsArray,
  IsObject,
} from 'class-validator';

export class ContentItemsUpdateDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  brandProfileId?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  campaignTheme?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsObject()
  platformPayloads?: Record<string, unknown>;

  @IsOptional()
  @IsDate()
  scheduledDate?: Date;

  @IsOptional()
  @IsDate()
  scheduledTime?: Date;

  @IsOptional()
  @IsDate()
  publishedAt?: Date;

  @IsOptional()
  @IsString()
  externalPostId?: string;

  @IsOptional()
  @IsString()
  publishFailedReason?: string;

  @IsOptional()
  @IsDate()
  deletedAt?: Date;
}
