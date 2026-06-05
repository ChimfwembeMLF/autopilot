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

export class WorkspacesCreateDto {
  @IsUUID()
  tenantId: string;

  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;
}
