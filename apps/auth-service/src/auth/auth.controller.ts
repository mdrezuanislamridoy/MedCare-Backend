import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthGuard } from '@nestjs/passport';
import { Roles, CurrentUser, RolesGuard } from '@medcare/shared';
import { PATTERNS, UserRole } from '@medcare/contracts';
import type { AuthUser } from './strategies/jwt.strategy';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthService } from './auth.service';

const JwtGuard = AuthGuard('jwt');

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(PATTERNS.AUTH.REGISTER)
  @Post('register')
  register(@Payload() @Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern(PATTERNS.AUTH.LOGIN)
  @Post('login')
  login(@Payload() @Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @MessagePattern(PATTERNS.AUTH.GOOGLE_AUTH)
  @Post('google')
  googleAuth(@Payload() @Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(dto);
  }

  @MessagePattern(PATTERNS.AUTH.FORGOT_PASSWORD)
  @Post('forgot-password')
  forgotPassword(@Payload() @Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @MessagePattern(PATTERNS.AUTH.RESET_PASSWORD)
  @Post('reset-password')
  resetPassword(@Payload() @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @MessagePattern(PATTERNS.AUTH.GET_PROFILE)
  @UseGuards(JwtGuard)
  @Get('me')
  me(@CurrentUser() user: AuthUser, @Payload() payload?: any) {
    const userId = user?.id || payload?.userId || payload?.id;
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtGuard)
  @Post('email/verification-code')
  issueEmailVerificationCode(@CurrentUser() user: AuthUser) {
    return this.authService.issueEmailVerificationCode(user.id);
  }

  @UseGuards(JwtGuard)
  @Post('email/verify')
  verifyEmail(@CurrentUser() user: AuthUser, @Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(user.id, dto);
  }

  @MessagePattern(PATTERNS.AUTH.UPDATE_ROLE)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') id: string,
    @Payload() payload: any,
    @Body() dto?: UpdateUserRoleDto,
  ) {
    const targetId = id || payload?.id;
    const role = dto?.role || payload?.role;
    return this.authService.updateUserRole(targetId, role);
  }
}
