import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@medcare/contracts';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
};

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ||
        process.env.JWT_SECRET ||
        'medcare_enterprise_super_secret_jwt_key_2026',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
