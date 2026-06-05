import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { LoginPayloadDto } from './dtos/login-payload.dto';
import { UserDto } from '../user/dtos/user.dto';

@Injectable()
export class AuthService {
  private refreshTokens = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  issueTokensForUser(user: UserEntity): LoginPayloadDto {
    const payload = {
      sub: String(user.id),
      provider: user.provider ?? 'local',
    };

    const token = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      {
        ...payload,
        type: 'refresh',
      },
      { expiresIn: '7d' },
    );

    this.refreshTokens.set(String(user.id), refreshToken);

    const userDto = new UserDto({
      ...user,
      token,
    });

    return {
      user: userDto,
      token,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded: any = this.jwtService.verify(refreshToken);

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token type');
      }

      const stored = this.refreshTokens.get(String(decoded.sub));

      if (stored !== refreshToken) {
        throw new UnauthorizedException('Refresh token revoked');
      }

      const newAccessToken = this.jwtService.sign({
        sub: decoded.sub,
        provider: decoded.provider,
      });

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshToken(userId: string) {
    this.refreshTokens.delete(String(userId));
  }

  async getUserProfile(userId: string) {
    const user = await this.userService.findOne({ id: userId });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return new UserDto(user);
  }
}