require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');
const { Client } = require('pg');

const defaultDbUrl =
  process.env.DATABASE_URL ||
  'postgresql://medcare:medcare_secure_pass@localhost:5435/medcare_db';

const services = [
  { name: 'auth-service', schema: 'auth', specificUrl: process.env.DATABASE_URL_AUTH },
  { name: 'doctor-service', schema: 'doctor', specificUrl: process.env.DATABASE_URL_DOCTOR },
  { name: 'patient-service', schema: 'patient', specificUrl: process.env.DATABASE_URL_PATIENT },
  { name: 'appointment-service', schema: 'appointment', specificUrl: process.env.DATABASE_URL_APPOINTMENT },
  { name: 'clinic-service', schema: 'clinic', specificUrl: process.env.DATABASE_URL_CLINIC },
  { name: 'billing-service', schema: 'billing', specificUrl: process.env.DATABASE_URL_BILLING },
  { name: 'notification-service', schema: 'notification', specificUrl: process.env.DATABASE_URL_NOTIFICATION },
  { name: 'audit-service', schema: 'audit', specificUrl: process.env.DATABASE_URL_AUDIT },
  { name: 'chat-service', schema: 'chat', specificUrl: process.env.DATABASE_URL_CHAT },
];

async function syncAll() {
  console.log('🚀 Initializing PostgreSQL microservice schemas...\n');

  // 1. If using a shared PostgreSQL database, ensure each schema exists
  try {
    const pgClient = new Client({ connectionString: defaultDbUrl });
    await pgClient.connect();
    console.log('🔗 Connected to PostgreSQL database. Creating schema namespaces...');
    for (const svc of services) {
      await pgClient.query(`CREATE SCHEMA IF NOT EXISTS "${svc.schema}";`);
    }
    console.log('✅ All 9 PostgreSQL schemas created or verified.\n');
    await pgClient.end();
  } catch (err) {
    console.warn(`⚠️ Notice: Could not pre-create schemas via pg client: ${err.message}. Continuing with db push...`);
  }

  // 2. Resolve Prisma CLI binary path
  const prismaBin = path.resolve(__dirname, '../node_modules/prisma/build/index.js');

  // 3. Push schema for each microservice
  for (const svc of services) {
    let serviceUrl = svc.specificUrl;

    if (!serviceUrl) {
      try {
        const parsed = new URL(defaultDbUrl);
        parsed.searchParams.set('schema', svc.schema);
        serviceUrl = parsed.toString();
      } catch {
        serviceUrl = `${defaultDbUrl}?schema=${svc.schema}`;
      }
    }

    const schemaPath = `apps/${svc.name}/prisma/schema.prisma`;
    console.log(`📤 Pushing ${svc.name} (schema: ${svc.schema})...`);

    try {
      execSync(
        `node "${prismaBin}" db push --schema="${schemaPath}" --url="${serviceUrl}" --accept-data-loss`,
        {
          stdio: 'inherit',
          env: {
            ...process.env,
            DATABASE_URL: serviceUrl,
          },
        },
      );
      console.log(`✅ ${svc.name} synced successfully.\n`);
    } catch (err) {
      console.error(`❌ Failed to push ${svc.name}:`, err.message);
    }
  }

  console.log('🎉 Database synchronization cycle finished!');
}

syncAll().catch((err) => {
  console.error('Fatal database push error:', err);
});
