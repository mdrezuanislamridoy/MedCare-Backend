import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';

export function createPrismaPgAdapter(
  serviceName: string,
  configService?: ConfigService,
): PrismaPg {
  const cleanName = serviceName.replace('-service', '').replace(/-/g, '_');
  const envKey = `DATABASE_URL_${cleanName.toUpperCase()}`;

  const specificUrl =
    configService?.get<string>(envKey) || process.env[envKey];

  if (specificUrl) {
    try {
      const url = new URL(specificUrl);
      const schema = url.searchParams.get('schema') || cleanName;
      return new PrismaPg({ connectionString: specificUrl }, { schema });
    } catch {
      return new PrismaPg({ connectionString: specificUrl }, { schema: cleanName });
    }
  }

  const baseDbUrl =
    configService?.get<string>('DATABASE_URL') ||
    process.env.DATABASE_URL ||
    'postgresql://medcare:medcare_secure_pass@localhost:5435/medcare_db';

  try {
    const url = new URL(baseDbUrl);
    // If sharing a single database, isolate via Postgres schema
    url.searchParams.set('schema', cleanName);
    const connectionString = url.toString();
    return new PrismaPg({ connectionString }, { schema: cleanName });
  } catch {
    return new PrismaPg({ connectionString: baseDbUrl }, { schema: cleanName });
  }
}
