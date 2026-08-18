import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
    description: 'Google OAuth ID token',
  })
  @IsString()
  @MinLength(20)
  idToken!: string;
}
