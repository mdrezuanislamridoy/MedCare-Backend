import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '@medcare/contracts';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.DOCTOR,
    description: 'New role assigned to user',
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
