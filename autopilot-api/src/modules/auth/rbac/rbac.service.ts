import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permRepo: Repository<Permission>,
  ) {}

  /**
   * Checks if a user has at least one of the required roles within a tenant.
   */
  async hasRoles(
    userId: string,
    tenantId: string,
    requiredRoles: string[],
  ): Promise<boolean> {
    const roles = await this.roleRepo
      .createQueryBuilder('role')
      .innerJoin('role.tenants', 'tenant', 'tenant.id = :tenantId', {
        tenantId,
      })
      .innerJoin('role.users', 'user', 'user.id = :userId', { userId })
      .getMany();
    const userRoles = roles.map((r) => r.name);
    return requiredRoles.some((r) => userRoles.includes(r));
  }

  /**
   * Checks if a user possesses a specific permission within a tenant.
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    permissionName: string,
  ): Promise<boolean> {
    const permissions = await this.permRepo
      .createQueryBuilder('perm')
      .innerJoin('perm.roles', 'role')
      .innerJoin('role.tenants', 'tenant', 'tenant.id = :tenantId', {
        tenantId,
      })
      .innerJoin('role.users', 'user', 'user.id = :userId', { userId })
      .where('perm.name = :permissionName', { permissionName })
      .getMany();
    return permissions.length > 0;
  }
}
