import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MICROSERVICES, PATTERNS } from '@medcare/contracts';
import { JwtAuthGuard, Public } from '@medcare/shared';

@ApiTags('Authentication & Identity')
@Controller('auth')
export class AuthGatewayController {
  constructor(
    @Inject(MICROSERVICES.AUTH) private readonly authClient: ClientProxy,
  ) {}

  @Public()
  @ApiOperation({ summary: 'Register a new patient or user account' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @Post('register')
  async register(@Body() body: any) {
    return this.authClient.send(PATTERNS.AUTH.REGISTER, body);
  }

  @Public()
  @ApiOperation({ summary: 'Log in with email & password' })
  @ApiResponse({ status: 200, description: 'Authentication token returned' })
  @Post('login')
  async login(@Body() body: any) {
    return this.authClient.send(PATTERNS.AUTH.LOGIN, body);
  }

  @Public()
  @ApiOperation({ summary: 'Refresh expired JWT access token' })
  @ApiResponse({ status: 200, description: 'New JWT access token returned' })
  @Post('refresh')
  async refreshToken(@Body() body: any) {
    return this.authClient.send(PATTERNS.AUTH.REFRESH_TOKEN, body);
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
