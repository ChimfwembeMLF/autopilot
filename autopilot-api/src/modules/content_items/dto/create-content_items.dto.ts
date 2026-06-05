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

export class ContentItemsCreateDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  workspaceId: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  brandProfileId: string;

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

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
