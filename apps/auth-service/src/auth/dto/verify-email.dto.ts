import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: '123456',
    minLength: 6,
    maxLength: 6,
    description: '6-digit email confirmation code',
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}
