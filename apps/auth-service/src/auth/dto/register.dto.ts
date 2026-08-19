import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@medcare.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123!',
    minLength: 8,
    description: 'User account password',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  name?: string;
}
