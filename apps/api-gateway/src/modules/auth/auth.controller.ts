import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS } from '@medcare/contracts';
import {
  JwtAuthGuard,
  Public,
  CurrentUser,
  RateLimitTier,
  ApiRateLimitTier,
} from '@medcare/shared';
import {
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@ApiTags('Authentication & Identity')
@RateLimitTier(ApiRateLimitTier.AUTH)
@Controller('auth')
export class AuthGatewayController {
  constructor(
    @Inject(MICROSERVICES.AUTH) private readonly authClient: ClientProxy,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Register a new patient or user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authClient.send(PATTERNS.AUTH.REGISTER, body);
  }

  @Public()
  @ApiOperation({ summary: 'Log in with email & password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Authentication token returned' })
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authClient.send(PATTERNS.AUTH.LOGIN, body);
  }

  @Public()
  @ApiOperation({ summary: 'Google OAuth 2.0 Single Sign-On (SSO)' })
  @ApiBody({ type: GoogleAuthDto })
  @ApiResponse({ status: 200, description: 'Google token verified, user logged in or registered' })
  @Post('google')
  async googleAuth(@Body() body: GoogleAuthDto) {
    return this.authClient.send(PATTERNS.AUTH.GOOGLE_AUTH, body);
  }

  @Public()
  @ApiOperation({ summary: 'Request password reset verification code' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Reset code issued' })
  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authClient.send(PATTERNS.AUTH.FORGOT_PASSWORD, body);
  }

  @Public()
  @ApiOperation({ summary: 'Reset password with verification code' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authClient.send(PATTERNS.AUTH.RESET_PASSWORD, body);
  }

  @Public()
  @ApiOperation({ summary: 'Refresh expired JWT access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'New JWT access token returned' })
  @Post('refresh')
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authClient.send(PATTERNS.AUTH.REFRESH_TOKEN, body);
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Authenticated user profile returned' })
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.authClient.send(PATTERNS.AUTH.GET_PROFILE, { userId: user.id });
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify current JWT session' })
  @ApiResponse({ status: 200, description: 'Session valid' })
  @Get('verify')
  async verifySession(@Req() req: any) {
    return this.authClient.send(PATTERNS.AUTH.VERIFY_TOKEN, { user: req.user });
  }
}
