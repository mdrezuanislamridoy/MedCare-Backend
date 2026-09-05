require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const defaultDbUrl =
  process.env.DATABASE_URL_AUTH ||
  process.env.DATABASE_URL ||
  'postgresql://medcare:medcare_secure_pass@localhost:5435/medcare_db';

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@medcare.com').toLowerCase().trim();
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin12345!';
const adminName = process.env.ADMIN_NAME || 'Super Administrator';

async function seedAdmin() {
  console.log('🌱 Checking default Super Admin user account...');

  let client;
  try {
    // If DATABASE_URL has schema param or not, standard pg connection
    client = new Client({ connectionString: defaultDbUrl });
    await client.connect();

    // Check if "auth"."User" exists, else fallback to "public"."User"
    let targetTable = '"auth"."User"';
    try {
      await client.query('SELECT 1 FROM "auth"."User" LIMIT 1');
    } catch {
      targetTable = '"public"."User"';
    }

    // Check if admin already exists
    const checkRes = await client.query(
      `SELECT id, email, role FROM ${targetTable} WHERE email = $1`,
      [adminEmail],
    );

    if (checkRes.rows.length > 0) {
      console.log(`ℹ️ Admin account (${adminEmail}) already exists. Role: ${checkRes.rows[0].role}`);
      await client.end();
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const userId = randomUUID();
    const now = new Date();

    await client.query(
      `INSERT INTO ${targetTable} (
        "id", "email", "passwordHash", "name", "role", "status", "isEmailVerified", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, 'SUPER_ADMIN', 'ACTIVE', true, $5, $6)`,
      [userId, adminEmail, passwordHash, adminName, now, now],
    );

    console.log('🎉 Default Super Admin created successfully:');
    console.log(`   📧 Email:    ${adminEmail}`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   👑 Role:     SUPER_ADMIN\n`);

    await client.end();
  } catch (err) {
    console.warn(`⚠️ Admin seed notice: ${err.message}`);
    if (client) {
      try {
        await client.end();
      } catch {}
    }
  }
}

seedAdmin();
