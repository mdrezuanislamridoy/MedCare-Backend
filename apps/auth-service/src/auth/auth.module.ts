import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { SignOptions } from 'jsonwebtoken';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CodeService } from './code.service';
import { JwtStrategy } from './strategies/jwt.strategy';

import { PrismaModule } from '../prisma/prisma.module';
import { MailModule, MailService } from '@medcare/common';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<SignOptions['expiresIn']>(
            'JWT_EXPIRES_IN',
            '15m',
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CodeService, MailService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
