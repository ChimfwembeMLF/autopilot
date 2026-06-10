import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueueDispatchService } from './queue-dispatch.service';
import { ALL_QUEUES } from './queue.constants';

@ApiTags('Queue Jobs')
@Controller('api/v1/queues')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QueueJobsController {
  constructor(private readonly dispatch: QueueDispatchService) {}

  @Get('queues')
  listQueues() {
    return { queues: ALL_QUEUES, enabled: this.dispatch.isEnabled() };
  }

  @Get(':queue/jobs/:jobId')
  getJob(@Param('queue') queue: string, @Param('jobId') jobId: string) {
    return this.dispatch.getJobStatus(queue, jobId);
  }
}
