import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { RolePermissionsService } from './role_permissions.service';
import { RolePermissions } from './entities/role_permissions.entity';
import { RolePermissionsCreateDto } from './dto/create-role_permissions.dto';
import { RolePermissionsUpdateDto } from './dto/update-role_permissions.dto';

@Controller('api/v1/role-permissions')
export class RolePermissionsController {
  constructor(private readonly service: RolePermissionsService) {}

  @Post()
  create(@Body() dto: RolePermissionsCreateDto): Promise<RolePermissions> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<RolePermissions[]> {
    return this.service.findAll();
  }

  @Get(':roleId/:permissionKey')
  findOne(
    @Param('roleId') roleId: string,
    @Param('permissionKey') permissionKey: string,
  ): Promise<RolePermissions> {
    return this.service.findOne(roleId, permissionKey);
  }

  @Patch(':roleId/:permissionKey')
  update(
    @Param('roleId') roleId: string,
    @Param('permissionKey') permissionKey: string,
    @Body() dto: RolePermissionsUpdateDto,
  ) {
    return this.service.update(roleId, permissionKey, dto);
  }

  @Delete(':roleId/:permissionKey')
  remove(
    @Param('roleId') roleId: string,
    @Param('permissionKey') permissionKey: string,
  ) {
    return this.service.remove(roleId, permissionKey);
  }
}
