import { Controller, Get, Param, Query } from '@nestjs/common';
import { RbacService } from './rbac.service';

@Controller('api/v1/rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles/check/:tenantId/:userId')
  async hasRoles(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Query('roles') roles: string,
  ) {
    const requiredRoles = roles
      ?.split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const hasRole = await this.rbacService.hasRoles(
      userId,
      tenantId,
      requiredRoles,
    );

    return {
      success: true,
      hasRole,
    };
  }

  @Get('permissions/check/:tenantId/:userId')
  async hasPermission(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Query('permission') permission: string,
  ) {
    const hasPermission = await this.rbacService.hasPermission(
      userId,
      tenantId,
      permission,
    );

    return {
      success: true,
      hasPermission,
    };
  }
}