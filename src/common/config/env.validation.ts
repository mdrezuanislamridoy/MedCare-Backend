import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsUrl({
    require_tld: false,
    protocols: ['postgres', 'postgresql'],
    require_protocol: true,
  })
  DATABASE_URL!: string;

  @IsOptional()
  @IsUrl({
    require_tld: false,
    protocols: ['postgres', 'postgresql'],
    require_protocol: true,
  })
  SHADOW_DATABASE_URL?: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET!: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsUrl({
    require_tld: false,
    protocols: ['redis', 'rediss'],
    require_protocol: true,
  })
  REDIS_URL!: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  PORT?: number;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
