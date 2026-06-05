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

export class LeadSourcesCreateDto {
  @IsUUID()
  tenantId: string;

  @IsUUID()
  userId: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  webhookSecret?: string;

  @IsDate()
  createdAt: Date;
}
