import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('deposits/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  initiate(
    @Body()
    body: { tenantId: string; plan: string; phone?: string; correspondent?: string },
  ) {
    return this.payments.initiateDeposit(body);
  }

  @Post('webhooks/deposit')
  @ApiExcludeEndpoint()
  webhook(@Body() body: { depositId?: string; status?: string }) {
    if (body.status === 'COMPLETED' && body.depositId) {
      return this.payments.completeDeposit(body.depositId);
    }
    return { received: true };
  }

  @Post('deposits/check-pending')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  checkPending() {
    return this.payments.checkPendingDeposits();
  }

  @Get('deposits/tenant/:tenantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  list(@Param('tenantId') tenantId: string) {
    return this.payments.findByTenant(tenantId);
  }
}
