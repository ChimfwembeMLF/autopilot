import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Leads } from './entities/leads.entity';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Leads])],
  providers: [LeadsService],
  controllers: [LeadsController],
  exports: [LeadsService],
})
export class LeadsModule {}
