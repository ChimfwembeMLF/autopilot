import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { SocialAccountsService } from './social_accounts.service';
import { SocialAccountsCreateDto } from './dto/create-social_accounts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Social Accounts')
@Controller('api/v1/social-accounts')
export class SocialAccountsController {
  constructor(private readonly service: SocialAccountsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connect a social account for the current user' })
  @Post('connect')
  connect(@Req() req: Request, @Body() dto: SocialAccountsCreateDto) {
    const userId = req.user?.['sub'] || req.user?.['id'];

    if (!userId) {
      throw new UnauthorizedException('Unable to resolve authenticated user');
    }

    if (dto.userId && dto.userId !== userId) {
      throw new UnauthorizedException('Cannot connect social account for another user');
    }

    return this.service.connectAccount({
      ...dto,
      userId,
      connected: true,
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get connected social accounts for the current user' })
  @Get('me')
  getMyAccounts(@Req() req: Request) {
    const userId = req.user?.['sub'] || req.user?.['id'];
    if (!userId) {
      throw new UnauthorizedException('Unable to resolve authenticated user');
    }
    return this.service.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get connected social accounts for a specific user' })
  @Get('user/:userId')
  findByUser(@Req() req: Request, @Param('userId') userId: string) {
    const currentUserId = req.user?.['sub'] || req.user?.['id'];
    if (!currentUserId || currentUserId !== userId) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.findByUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect a social account belonging to the current user' })
  @Post(':id/disconnect')
  disconnect(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user?.['sub'] || req.user?.['id'];
    return this.service.disconnect(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a social account belonging to the current user' })
  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = req.user?.['sub'] || req.user?.['id'];
    return this.service.remove(id, userId);
  }
}
