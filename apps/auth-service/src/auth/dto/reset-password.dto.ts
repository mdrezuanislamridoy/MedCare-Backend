import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'patient@medcare.com', description: 'Account email' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '482910',
    minLength: 6,
    maxLength: 6,
    description: '6-digit verification OTP code',
  })
  @IsString()
  @Length(6, 6)
  code!: string;

  @ApiProperty({
    example: 'NewSecurePassword123!',
    minLength: 8,
    description: 'New password',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
