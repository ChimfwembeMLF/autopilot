import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  Query,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenVerificationDto } from './dtos/token-verification.dto';
import { GoogleAuthService } from './google-auth.service';
import { FacebookAuthService } from './facebook-auth.service';
import { LinkedInAuthService } from './linkedin-auth.service';
import { InstagramAuthService } from './instagram-auth.service';
import { SocialAccountsService } from '../social_accounts/social_accounts.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

type SocialOAuthUser = {
  accessToken?: string;
  provider?: string;
  providerId?: string;
  email?: string;
  picture?: string;
  user?: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
};

@Controller('api/v1/auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
    private readonly facebookAuthService: FacebookAuthService,
    private readonly linkedInAuthService: LinkedInAuthService,
    private readonly instagramAuthService: InstagramAuthService,
    private readonly socialAccountsService: SocialAccountsService,
    private readonly config: ConfigService,
  ) { }

  private encodeState(state: Record<string, string | undefined>) {
    return encodeURIComponent(Buffer.from(JSON.stringify(state)).toString('base64'));
  }

  private decodeState(state: string) {
    try {
      const decoded = Buffer.from(decodeURIComponent(state), 'base64').toString('utf8');
      return JSON.parse(decoded) as Record<string, string>;
    } catch {
      return null;
    }
  }

  private buildRedirectUrl(req: Request, path: string, state: string) {
    const host = req.get('host');
    const protocol = req.protocol;
    return `${protocol}://${host}${path}?state=${state}`;
  }

  private async saveConnectedAccount(payload: {
    userId: string;
    tenantId: string;
    platform: string;
    accountName: string;
    externalId?: string;
    username?: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    metadata?: Record<string, any>;
  }) {
    return this.socialAccountsService.connectAccount({
      tenantId: payload.tenantId,
      userId: payload.userId,
      platform: payload.platform,
      accountName: payload.accountName,
      externalId: payload.externalId,
      username: payload.username,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiresAt: payload.expiresAt,
      metadata: payload.metadata,
      connected: true,
    });
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refresh(refreshDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  async logout(@Req() req: Request) {
    const userId = req.user?.['sub'];
    await this.authService.revokeRefreshToken(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@Req() req: Request) {
    const userId = req.user?.['sub'];
    return this.authService.getUserProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('facebook/connect')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Facebook connect OAuth for the current user' })
  async facebookConnect(
    @Req() req: Request,
    @Query('tenantId') tenantId: string,
    @Query('returnUrl') returnUrl?: string,
  ) {
    const userId = req.user?.['sub'] || req.user?.['id'];
    if (!userId) {
      throw new UnauthorizedException('Unable to resolve authenticated user');
    }
    if (!tenantId) {
      throw new BadRequestException('tenantId query parameter is required');
    }

    const state = this.encodeState({
      action: 'connect',
      userId,
      tenantId,
      returnUrl,
      provider: 'facebook',
    });

    return {
      redirectUrl: this.buildRedirectUrl(req, '/api/v1/auth/facebook', state),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('linkedin/connect')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start LinkedIn connect OAuth for the current user' })
  async linkedInConnect(
    @Req() req: Request,
    @Query('tenantId') tenantId: string,
    @Query('returnUrl') returnUrl?: string,
  ) {
    const userId = req.user?.['sub'] || req.user?.['id'];
    if (!userId) {
      throw new UnauthorizedException('Unable to resolve authenticated user');
    }
    if (!tenantId) {
      throw new BadRequestException('tenantId query parameter is required');
    }

    const state = this.encodeState({
      action: 'connect',
      userId,
      tenantId,
      returnUrl,
      provider: 'linkedin',
    });

    return {
      redirectUrl: this.linkedInAuthService.getAuthorizationUrl(state),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('instagram/connect')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Instagram connect OAuth for the current user' })
  async instagramConnect(
    @Req() req: Request,
    @Query('tenantId') tenantId: string,
    @Query('returnUrl') returnUrl?: string,
  ) {
    const userId = req.user?.['sub'] || req.user?.['id'];
    if (!userId) {
      throw new UnauthorizedException('Unable to resolve authenticated user');
    }
    if (!tenantId) {
      throw new BadRequestException('tenantId query parameter is required');
    }

    const state = this.encodeState({
      action: 'connect',
      userId,
      tenantId,
      returnUrl,
      provider: 'instagram',
    });

    return {
      redirectUrl: this.instagramAuthService.getAuthorizationUrl(state),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('google/connect')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start Google connect OAuth for the current user' })
  async googleConnect(
    @Req() req: Request,
    @Query('tenantId') tenantId: string,
    @Query('returnUrl') returnUrl?: string,
  ) {
    const userId = req.user?.['sub'] || req.user?.['id'];
    if (!userId) {
      throw new UnauthorizedException('Unable to resolve authenticated user');
    }
    if (!tenantId) {
      throw new BadRequestException('tenantId query parameter is required');
    }

    const state = this.encodeState({
      action: 'connect',
      userId,
      tenantId,
      returnUrl,
      provider: 'google',
    });

    return {
      redirectUrl: this.buildRedirectUrl(req, '/api/v1/auth/google', state),
    };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Start Google OAuth login' })
  googleAuth() {
    return;
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthRedirect(
    @Req() req: Request,
    @Query('state') state?: string,
  ) {
    const profile = req.user as SocialOAuthUser & { refreshToken?: string };
    const decodedState = state ? this.decodeState(state) : null;

    if (decodedState?.action === 'connect' && decodedState.provider === 'google') {
      const account = await this.saveConnectedAccount({
        userId: decodedState.userId,
        tenantId: decodedState.tenantId,
        platform: 'google',
        accountName: profile.email || profile.providerId || 'Google Account',
        externalId: profile.providerId,
        username: profile.email,
        accessToken: profile.accessToken!,
        refreshToken: profile.refreshToken,
        expiresAt: undefined,
        metadata: {
          provider: 'google',
          picture: profile.picture,
          email: profile.email,
        },
      });

      if (decodedState.returnUrl) {
        return req.res?.redirect(`${decodedState.returnUrl}?connected=google`);
      }

      return account;
    }

    const user = await this.googleAuthService.authenticate(profile.accessToken!);
    return {
      ...this.authService.issueTokensForUser(user),
      provider: 'google',
      providerAccessToken: profile.accessToken,
      providerId: profile.providerId,
      email: profile.email,
      picture: profile.picture,
    };
  }

  @Post('google-auth')
  @ApiOperation({ summary: 'Authenticate with Google access token' })
  async googleAuthenticate(@Body() dto: TokenVerificationDto) {
    const user = await this.googleAuthService.authenticate(dto.token);
    return this.authService.issueTokensForUser(user);
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Start Facebook OAuth login' })
  facebookLogin() {
    return;
  }

  @Get('facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  async facebookLoginRedirect(
    @Req() req: Request,
    @Query('state') state?: string,
  ) {
    const payload = req.user as SocialOAuthUser;
    const decodedState = state ? this.decodeState(state) : null;

    if (decodedState?.action === 'connect' && decodedState.provider === 'facebook') {
      const longLived = await this.facebookAuthService.exchangeShortLivedToken(
        payload.accessToken!,
      );
      const profile = await this.facebookAuthService.getUserData(longLived.accessToken);

      const account = await this.saveConnectedAccount({
        userId: decodedState.userId,
        tenantId: decodedState.tenantId,
        platform: 'facebook',
        accountName: profile.name || 'Facebook Account',
        externalId: profile.id,
        username: profile.email,
        accessToken: longLived.accessToken,
        refreshToken: undefined,
        expiresAt: longLived.expiresAt,
        metadata: {
          profile,
        },
      });

      if (decodedState.returnUrl) {
        return req.res?.redirect(`${decodedState.returnUrl}?connected=facebook`);
      }

      return account;
    }

    const user = await this.facebookAuthService.authenticate(payload.accessToken!);
    return {
      ...this.authService.issueTokensForUser(user),
      provider: 'facebook',
      providerAccessToken: payload.accessToken,
      providerId: payload.providerId,
      email: payload.email,
    };
  }

  @Post('facebook-auth')
  @ApiOperation({ summary: 'Authenticate with Facebook access token' })
  async facebookAuthenticate(@Body() dto: TokenVerificationDto) {
    const user = await this.facebookAuthService.authenticate(dto.token);
    return this.authService.issueTokensForUser(user);
  }

  @Get('connect')
  connect(@Res() res: any) {
    const url =
      `https://www.facebook.com/v18.0/dialog/oauth` +
      `?client_id=${this.config.get('FACEBOOK_APP_ID')}` +
      `&redirect_uri=${this.config.get('FACEBOOK_CALLBACK_URL')}` +
      `&scope=pages_show_list,pages_manage_posts,pages_read_engagement` +
      `&response_type=code`;

    return res.redirect(url);
  }

  @Get('facebook/callback')
  async callback(
    @Query('code') code: string,
    @Res() res: Response,
  ) {
    if (!code) {
      return res.redirect(
        `${this.config.get('FRONTEND_URL')}/oauth/error?reason=missing_code`,
      );
    }

    try {
      const token = await this.facebookAuthService.exchangeCode(code);

      const pages = await axios.get(
        `https://graph.facebook.com/me/accounts`,
        { params: { access_token: token } },
      );

      /**
       * Store temporarily or pass to frontend
       * (better: store in DB keyed by user session)
       */
      const payload = encodeURIComponent(
        JSON.stringify({
          token,
          pages: pages.data.data,
        }),
      );

      return res.redirect(
        `${this.config.get('FRONTEND_URL')}/oauth/facebook/select?data=${payload}`,
      );
    } catch (e) {
      return res.redirect(
        `${this.config.get('FRONTEND_URL')}/oauth/error?reason=facebook_failed`,
      );
    }
  }

  @Get('linkedin')
  @ApiOperation({ summary: 'Start LinkedIn OAuth login' })
  linkedInLogin(@Res() res: Response) {
    return res.redirect(this.linkedInAuthService.getAuthorizationUrl());
  }

  @Get('linkedin/redirect')
  @ApiOperation({ summary: 'LinkedIn OAuth callback' })
  async linkedInLoginRedirect(
    @Req() req: Request,
    @Query('code') code?: string,
    @Query('state') state?: string,
  ) {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }

    const decodedState = state ? this.decodeState(state) : null;

    if (decodedState?.action === 'connect' && decodedState.provider === 'linkedin') {
      const tokenResult = await this.linkedInAuthService.exchangeCodeForTokens(code);
      const profile = await this.linkedInAuthService.getUserData(tokenResult.accessToken);

      const account = await this.saveConnectedAccount({
        userId: decodedState.userId,
        tenantId: decodedState.tenantId,
        platform: 'linkedin',
        accountName: `${profile.given_name ?? ''} ${profile.family_name ?? ''}`.trim() || 'LinkedIn Account',
        externalId: profile.sub,
        username: profile.email,
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        expiresAt: tokenResult.expiresAt,
        metadata: { profile },
      });

      if (decodedState.returnUrl) {
        return req.res?.redirect(`${decodedState.returnUrl}?connected=linkedin`);
      }

      return account;
    }

    const accessToken = await this.linkedInAuthService.exchangeCode(code);
    const user = await this.linkedInAuthService.authenticate(accessToken);
    return {
      ...this.authService.issueTokensForUser(user),
      provider: 'linkedin',
      providerAccessToken: accessToken,
    };
  }

  @Post('linkedin-auth')
  @ApiOperation({ summary: 'Authenticate with LinkedIn access token' })
  async linkedInAuthenticate(@Body() dto: TokenVerificationDto) {
    const user = await this.linkedInAuthService.authenticate(dto.token);
    return this.authService.issueTokensForUser(user);
  }

  @Get('instagram')
  @ApiOperation({ summary: 'Start Instagram OAuth login' })
  instagramLogin(@Res() res: Response) {
    return res.redirect(this.instagramAuthService.getAuthorizationUrl());
  }

  @Get('instagram/redirect')
  @ApiOperation({ summary: 'Instagram OAuth callback' })
  async instagramLoginRedirect(
    @Req() req: Request,
    @Query('code') code?: string,
    @Query('state') state?: string,
  ) {
    if (!code) {
      throw new BadRequestException('Missing authorization code');
    }

    const decodedState = state ? this.decodeState(state) : null;

    if (decodedState?.action === 'connect' && decodedState.provider === 'instagram') {
      const tokenResult = await this.instagramAuthService.exchangeCodeForTokens(code);
      const profile = await this.instagramAuthService.getUserData(tokenResult.accessToken);

      const account = await this.saveConnectedAccount({
        userId: decodedState.userId,
        tenantId: decodedState.tenantId,
        platform: 'instagram',
        accountName: profile.username || 'Instagram Account',
        externalId: profile.id,
        username: profile.username,
        accessToken: tokenResult.accessToken,
        refreshToken: undefined,
        expiresAt: tokenResult.expiresAt,
        metadata: { profile },
      });

      if (decodedState.returnUrl) {
        return req.res?.redirect(`${decodedState.returnUrl}?connected=instagram`);
      }

      return account;
    }

    const accessToken = await this.instagramAuthService.exchangeCode(code);
    const user = await this.instagramAuthService.authenticate(accessToken);
    return {
      ...this.authService.issueTokensForUser(user),
      provider: 'instagram',
      providerAccessToken: accessToken,
    };
  }

  @Post('instagram-auth')
  @ApiOperation({ summary: 'Authenticate with Instagram access token' })
  async instagramAuthenticate(@Body() dto: TokenVerificationDto) {
    const user = await this.instagramAuthService.authenticate(dto.token);
    return this.authService.issueTokensForUser(user);
  }
}
