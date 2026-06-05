import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspaces } from './entities/workspaces.entity';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Workspaces])],
  providers: [WorkspacesService],
  controllers: [WorkspacesController],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
