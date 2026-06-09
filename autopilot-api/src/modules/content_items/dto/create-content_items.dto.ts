import {
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class ContentItemsCreateDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  workspaceId: string;

  /** Set server-side from JWT; optional in request body. */
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' ? undefined : value))
  userId?: string;

  /** Resolved server-side from tenant + user brand profile when omitted. */
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => (value === '' ? undefined : value))
  brandProfileId?: string;

  @IsString()
  contentType: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

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
  platformPayloads?: string;

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
