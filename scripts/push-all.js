require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

const defaultDbUrl =
  process.env.DATABASE_URL ||
  'postgresql://medcare:medcare_secure_pass@localhost:5435/medcare_db?schema=public';

const services = [
  { name: 'auth-service', url: process.env.DATABASE_URL_AUTH || defaultDbUrl },
  { name: 'doctor-service', url: process.env.DATABASE_URL_DOCTOR || defaultDbUrl },
  { name: 'patient-service', url: process.env.DATABASE_URL_PATIENT || defaultDbUrl },
  { name: 'appointment-service', url: process.env.DATABASE_URL_APPOINTMENT || defaultDbUrl },
  { name: 'clinic-service', url: process.env.DATABASE_URL_CLINIC || defaultDbUrl },
  { name: 'billing-service', url: process.env.DATABASE_URL_BILLING || defaultDbUrl },
  { name: 'notification-service', url: process.env.DATABASE_URL_NOTIFICATION || defaultDbUrl },
  { name: 'audit-service', url: process.env.DATABASE_URL_AUDIT || defaultDbUrl },
  { name: 'chat-service', url: process.env.DATABASE_URL_CHAT || defaultDbUrl },
];

console.log('🚀 Pushing schemas to dedicated microservice databases...\n');

for (const svc of services) {
  const schemaPath = `apps/${svc.name}/prisma/schema.prisma`;
  console.log(`📤 Pushing ${svc.name} to its isolated database...`);
  try {
    execSync(`npx prisma db push --schema=${schemaPath} --accept-data-loss`, {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: svc.url,
      },
    });
    console.log(`✅ ${svc.name} synced successfully.\n`);
  } catch (err) {
    console.error(`❌ Failed to push ${svc.name}:`, err.message);
    process.exit(1);
  }
}

console.log('🎉 All 9 microservice databases synced successfully!');
