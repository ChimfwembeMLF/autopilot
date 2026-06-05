import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { UserPermissionsService } from './user_permissions.service';
import { UserPermissions } from './entities/user_permissions.entity';
import { UserPermissionsCreateDto } from './dto/create-user_permissions.dto';
import { UserPermissionsUpdateDto } from './dto/update-user_permissions.dto';

@Controller('api/v1/user-permissions')
export class UserPermissionsController {
  constructor(private readonly service: UserPermissionsService) {}

  @Post()
  create(@Body() dto: UserPermissionsCreateDto): Promise<UserPermissions> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<UserPermissions[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserPermissions> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UserPermissionsUpdateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
