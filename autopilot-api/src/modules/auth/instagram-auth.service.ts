import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { FindOptionsWhere } from 'typeorm';

import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { SocialAuthRegisterDto } from './dtos/social-auth.dto';

type InstagramUserData = {
  id?: string;
  username?: string;
};

type InstagramTokenResponse = {
  access_token?: string;
  user_id?: string;
  expires_in?: number;
};

@Injectable()
export class InstagramAuthService {
  private readonly logger = new Logger(InstagramAuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  /**
   * STEP 1: Redirect user to Facebook OAuth (NOT instagram.com/oauth)
   */
  getAuthorizationUrl(state?: string): string {
    const params: Record<string, string> = {
      client_id: this.config.getOrThrow<string>('FACEBOOK_APP_ID'),
      redirect_uri: this.config.getOrThrow<string>('INSTAGRAM_CALLBACK_URL'),
      scope: [
        'instagram_basic',
        'pages_show_list',
        'pages_read_engagement',
      ].join(','),
      response_type: 'code',
    };

    if (state) {
      params.state = state;
    }

    return `https://www.facebook.com/v18.0/dialog/oauth?${new URLSearchParams(params).toString()}`;
  }

  /**
   * STEP 2: Exchange code for access token (FACEBOOK endpoint)
   */
  async exchangeCode(code: string): Promise<string> {
    const result = await this.exchangeCodeForTokens(code);
    return result.accessToken;
  }

  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    expiresAt?: Date;
  }> {
    const shortLivedParams = new URLSearchParams({
      client_id: this.config.getOrThrow<string>('FACEBOOK_APP_ID'),
      client_secret: this.config.getOrThrow<string>('FACEBOOK_APP_SECRET'),
      redirect_uri: this.config.getOrThrow<string>('INSTAGRAM_CALLBACK_URL'),
      code,
    });

    const { data: shortData } = await axios.get<
      InstagramTokenResponse & { error?: { message: string } }
    >(
      `https://graph.facebook.com/v19.0/oauth/access_token?${shortLivedParams.toString()}`,
    );

    if (shortData.error) {
      this.logger.error('Instagram code exchange error', shortData.error);
      throw new BadRequestException(`Instagram code exchange error: ${shortData.error.message}`);
    }

    if (!shortData.access_token) {
      this.logger.error('Instagram token exchange failed', shortData as any);
      throw new BadRequestException('Instagram token exchange failed');
    }

    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: this.config.getOrThrow<string>('FACEBOOK_APP_ID'),
      client_secret: this.config.getOrThrow<string>('FACEBOOK_APP_SECRET'),
      fb_exchange_token: shortData.access_token,
    });

    const { data: longData } = await axios.get<
      InstagramTokenResponse & { error?: { message: string } }
    >(
      `https://graph.facebook.com/v19.0/oauth/access_token?${longLivedParams.toString()}`,
    );

    if (longData.error) {
      this.logger.error('Instagram long-lived token exchange error', longData.error);
      throw new BadRequestException(`Instagram long-lived token exchange error: ${longData.error.message}`);
    }

    if (!longData.access_token) {
      this.logger.error('Instagram long lived token exchange failed', longData as any);
      throw new BadRequestException('Instagram long lived token exchange failed');
    }

    return {
      accessToken: longData.access_token,
      expiresAt: longData.expires_in
        ? new Date(Date.now() + longData.expires_in * 1000)
        : undefined,
    };
  }

  async getUserData(token: string): Promise<InstagramUserData> {
    const { data } = await axios.get<
      InstagramUserData & { error?: { message: string } }
    >(`https://graph.instagram.com/me`, {
      params: {
        fields: 'id,username',
        access_token: token,
      },
    });

    if (data.error) {
      this.logger.error('Instagram profile error', data.error);
      throw new BadRequestException(`Instagram profile error: ${data.error.message}`);
    }

    if (!data || !data.id) {
      throw new BadRequestException('Invalid Instagram token');
    }

    return data;
  }

  /**
   * STEP 3: Authenticate / Create user
   */
  async authenticate(token: string): Promise<UserEntity> {
    try {
      const userData = await this.getUserData(token);

      const instagramId = userData.id;

      if (!instagramId) {
        throw new BadRequestException('Invalid Instagram response');
      }

      this.logger.log('Instagram user fetched', {
        instagramId,
        username: userData.username,
      });

      // PRIMARY IDENTITY RULE
      const where: FindOptionsWhere<UserEntity> = {
        provider: 'instagram',
        providerId: instagramId,
      };

      const existingUser = await this.userService.findOne(where);

      if (existingUser) {
        this.logger.log('Existing Instagram user found', {
          userId: existingUser.id,
          instagramId,
        });

        return existingUser;
      }

      // CREATE USER
      const newUser: SocialAuthRegisterDto = {
        provider: 'instagram',
        providerId: instagramId,

        firstName: userData.username ?? undefined,
        email: undefined,

        isRegisteredWithInstagram: true,
      };

      this.logger.log('Creating new Instagram user', {
        instagramId,
      });

      return await this.userService.createSociallAuthUser(newUser);
    } catch (err) {
      this.logger.error('Instagram authentication failed', {
        error: err instanceof Error ? err.message : err,
      });

      throw new BadRequestException('Instagram authentication failed');
    }
  }

}