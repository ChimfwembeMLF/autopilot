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

export class AuditLogsCreateDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  userId: string;

  @IsString()
  action: string;

  @IsString()
  resourceType: string;

  @IsUUID()
  resourceId: string;

  @IsOptional()
  beforeState?: string;

  @IsOptional()
  afterState?: string;

  @IsOptional()
  metadata?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsDate()
  createdAt: Date;
}
