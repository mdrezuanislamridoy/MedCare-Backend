import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import type { SignOptions } from 'jsonwebtoken';
import { AuthProvider, User } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CodePurpose } from './code-purpose.enum';
import { CodeService } from './code.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  private readonly passwordSaltRounds = 12;
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly codeService: CodeService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.passwordSaltRounds);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name?.trim() || null,
      },
    });

    return this.authResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.authResponse(updatedUser);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return this.serializeUser(user);
  }

  async issueEmailVerificationCode(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const issuedCode = await this.codeService.issueCode(
      CodePurpose.EmailVerification,
      user.email,
    );

    return {
      expiresInSeconds: issuedCode.expiresInSeconds,
      ...(process.env.NODE_ENV === 'production'
        ? {}
        : { code: issuedCode.code }),
    };
  }

  async verifyEmail(userId: string, dto: VerifyEmailDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    await this.codeService.verifyCode(
      CodePurpose.EmailVerification,
      user.email,
      dto.code,
    );

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    return this.serializeUser(updatedUser);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { expiresInSeconds: 10 * 60 };
    }

    const issuedCode = await this.codeService.issueCode(
      CodePurpose.PasswordReset,
      user.email,
    );

    return {
      expiresInSeconds: issuedCode.expiresInSeconds,
      ...(process.env.NODE_ENV === 'production'
        ? {}
        : { code: issuedCode.code }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase().trim();

    await this.codeService.verifyCode(
      CodePurpose.PasswordReset,
      email,
      dto.code,
    );

    const passwordHash = await bcrypt.hash(dto.password, this.passwordSaltRounds);
    await this.prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    return { success: true };
  }

  async googleAuth(dto: GoogleAuthDto) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new UnauthorizedException('Google auth is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const email = payload.email.toLowerCase().trim();
    const now = new Date();

    const user = await this.prisma.$transaction(async (tx) => {
      const providerAccount = await tx.providerAccount.findUnique({
        where: {
          provider_providerUserId: {
            provider: AuthProvider.GOOGLE,
            providerUserId: payload.sub,
          },
        },
        include: { user: true },
      });

      if (providerAccount) {
        return tx.user.update({
          where: { id: providerAccount.userId },
          data: { lastLoginAt: now },
        });
      }

      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      const userRecord =
        existingUser ??
        (await tx.user.create({
          data: {
            email,
            name: payload.name ?? null,
            emailVerifiedAt: payload.email_verified ? now : null,
          },
        }));

      const updatedUser = await tx.user.update({
        where: { id: userRecord.id },
        data: {
          lastLoginAt: now,
          emailVerifiedAt:
            userRecord.emailVerifiedAt ?? (payload.email_verified ? now : null),
        },
      });

      await tx.providerAccount.create({
        data: {
          provider: AuthProvider.GOOGLE,
          providerUserId: payload.sub,
          email,
          userId: updatedUser.id,
        },
      });

      return updatedUser;
    });

    return this.authResponse(user);
  }

  private authResponse(user: User) {
    return {
      accessToken: this.signAccessToken(user),
      user: this.serializeUser(user),
    };
  }

  private signAccessToken(user: User) {
    return this.jwtService.sign(
      {
        email: user.email,
        role: user.role,
      },
      {
        subject: user.id,
        expiresIn: this.configService.get<SignOptions['expiresIn']>(
          'JWT_EXPIRES_IN',
          '15m',
        ),
      },
    );
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
