import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDate,
  IsArray,
  IsNumber,
  IsInt,
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

  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @IsOptional()
  @IsDate()
  updatedAt?: Date;
}
