import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'patient@medcare.com',
    description: 'Account email address',
  })
  @IsEmail()
  email!: string;
}
