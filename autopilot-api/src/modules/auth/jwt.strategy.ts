import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

/**
 * JWT strategy – validates platform JWTs signed with JWT_SECRET.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'default_secret',
    });
  }

  async validate(payload: any) {
    // Payload contains the fields we signed (e.g., sub, email).
    // Returning the payload makes it available as req.user.
    return payload;
  }
}
