require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

const services = [
  { name: 'auth-service', url: process.env.DATABASE_URL_AUTH || 'postgresql://medcare:medcare_secure_pass@localhost:5435/auth_db?schema=public' },
  { name: 'doctor-service', url: process.env.DATABASE_URL_DOCTOR || 'postgresql://medcare:medcare_secure_pass@localhost:5435/doctor_db?schema=public' },
  { name: 'patient-service', url: process.env.DATABASE_URL_PATIENT || 'postgresql://medcare:medcare_secure_pass@localhost:5435/patient_db?schema=public' },
  { name: 'appointment-service', url: process.env.DATABASE_URL_APPOINTMENT || 'postgresql://medcare:medcare_secure_pass@localhost:5435/appointment_db?schema=public' },
  { name: 'clinic-service', url: process.env.DATABASE_URL_CLINIC || 'postgresql://medcare:medcare_secure_pass@localhost:5435/clinic_db?schema=public' },
  { name: 'billing-service', url: process.env.DATABASE_URL_BILLING || 'postgresql://medcare:medcare_secure_pass@localhost:5435/billing_db?schema=public' },
  { name: 'notification-service', url: process.env.DATABASE_URL_NOTIFICATION || 'postgresql://medcare:medcare_secure_pass@localhost:5435/notification_db?schema=public' },
  { name: 'audit-service', url: process.env.DATABASE_URL_AUDIT || 'postgresql://medcare:medcare_secure_pass@localhost:5435/audit_db?schema=public' },
  { name: 'chat-service', url: process.env.DATABASE_URL_CHAT || 'postgresql://medcare:medcare_secure_pass@localhost:5435/chat_db?schema=public' },
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
