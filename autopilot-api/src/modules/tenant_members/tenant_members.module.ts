import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantMembers } from './entities/tenant_members.entity';
import { TenantMembersService } from './tenant_members.service';
import { TenantMembersController } from './tenant_members.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TenantMembers])],
  providers: [TenantMembersService],
  controllers: [TenantMembersController],
  exports: [TenantMembersService],
})
export class TenantMembersModule {}
