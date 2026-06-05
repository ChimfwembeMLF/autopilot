import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TenantMembersService } from './tenant_members.service';
import { TenantMembers } from './entities/tenant_members.entity';
import { TenantMembersCreateDto } from './dto/create-tenant_members.dto';
import { TenantMembersUpdateDto } from './dto/update-tenant_members.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("Tenant Members")
@Controller('api/v1/tenant_members')
export class TenantMembersController {
  constructor(private readonly service: TenantMembersService) {}

  @Post()
  create(@Body() dto: TenantMembersCreateDto): Promise<TenantMembers> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<TenantMembers[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<TenantMembers> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: TenantMembersUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
