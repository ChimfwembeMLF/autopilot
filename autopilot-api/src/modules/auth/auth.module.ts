import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google-stategy';
import { FacebookStrategy } from './strategies/facebook-strategy';
import { GoogleAuthService } from './google-auth.service';
import { FacebookAuthService } from './facebook-auth.service';
import { LinkedInAuthService } from './linkedin-auth.service';
import { InstagramAuthService } from './instagram-auth.service';
import { UserModule } from '../user/user.module';
import { SocialAccountsModule } from '../social_accounts/social_accounts.module';

@Module({
  imports: [
    UserModule,
    SocialAccountsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    GoogleAuthService,
    FacebookAuthService,
    LinkedInAuthService,
    InstagramAuthService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
