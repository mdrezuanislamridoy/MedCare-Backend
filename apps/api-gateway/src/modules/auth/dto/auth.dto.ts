import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'doctor.john@medcare.com',
    description: 'Valid email address for registration',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password@123',
    minLength: 8,
    description: 'Account password (minimum 8 characters)',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: 'Dr. John Smith',
    description: 'Full name of the user',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'doctor.john@medcare.com',
    description: 'Registered email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class GoogleAuthDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImFiY2RlZiIs...',
    description: 'Google OAuth 2.0 ID Token obtained from client SDK',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'doctor.john@medcare.com',
    description: 'Email address to receive the password reset code',
  })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'doctor.john@medcare.com',
    description: 'Email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit verification code received via email/SMS',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({
    example: 'NewSecurePassword@123',
    minLength: 8,
    description: 'New password for the account',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Valid refresh token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    example: '123456',
    description: '6-digit email verification code',
  })
  @IsString()
  @IsNotEmpty()
  code!: string;
}
