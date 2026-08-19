const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const services = [
  'auth-service',
  'doctor-service',
  'patient-service',
  'appointment-service',
  'clinic-service',
  'billing-service',
  'notification-service',
  'audit-service',
  'chat-service',
];

console.log('🔄 Generating Prisma Clients for all microservices...\n');

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://medcare:medcare_secure_pass@localhost:5432/medcare_db?schema=public',
};

for (const service of services) {
  const schemaPath = `apps/${service}/prisma/schema.prisma`;
  if (fs.existsSync(schemaPath)) {
    console.log(`📦 Generating: ${service}...`);
    execSync(`npx prisma generate --schema=${schemaPath}`, { stdio: 'inherit', env });

    const genDir = path.resolve(__dirname, `../apps/${service}/src/generated/prisma`);
    if (fs.existsSync(genDir)) {
      const indexTsPath = path.join(genDir, 'index.ts');
      const content = `export * from './client';\nexport * from './enums';\nexport * from './models';\n`;
      fs.writeFileSync(indexTsPath, content, 'utf-8');
    }
  }
}

console.log('\n✅ All Prisma Clients successfully generated and indexed!');
