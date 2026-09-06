require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const defaultDbUrl =
  process.env.DATABASE_URL_AUTH ||
  process.env.DATABASE_URL ||
  'postgresql://medcare:medcare_secure_pass@localhost:5435/medcare_db';

const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'Password123!';

const seedUsers = [
  {
    role: 'SUPER_ADMIN',
    email: (process.env.SUPER_ADMIN_EMAIL || 'superadmin@medcare.com').toLowerCase().trim(),
    password: process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || defaultPassword,
    name: process.env.SUPER_ADMIN_NAME || 'Super Administrator',
  },
  {
    role: 'ADMIN',
    email: (process.env.ADMIN_EMAIL || 'admin@medcare.com').toLowerCase().trim(),
    password: process.env.ADMIN_PASSWORD || defaultPassword,
    name: process.env.ADMIN_NAME || 'System Administrator',
  },
  {
    role: 'DOCTOR',
    email: (process.env.DOCTOR_EMAIL || 'doctor@medcare.com').toLowerCase().trim(),
    password: process.env.DOCTOR_PASSWORD || defaultPassword,
    name: process.env.DOCTOR_NAME || 'Dr. Sarah Jenkins',
    specialty: 'Cardiology',
  },
  {
    role: 'PATIENT',
    email: (process.env.PATIENT_EMAIL || 'patient@medcare.com').toLowerCase().trim(),
    password: process.env.PATIENT_PASSWORD || defaultPassword,
    name: process.env.PATIENT_NAME || 'John Doe',
  },
  {
    role: 'RECEPTIONIST',
    email: (process.env.RECEPTIONIST_EMAIL || 'receptionist@medcare.com').toLowerCase().trim(),
    password: process.env.RECEPTIONIST_PASSWORD || defaultPassword,
    name: process.env.RECEPTIONIST_NAME || 'Emma Watson',
  },
  {
    role: 'CLINIC_MANAGER',
    email: (process.env.CLINIC_MANAGER_EMAIL || 'manager@medcare.com').toLowerCase().trim(),
    password: process.env.CLINIC_MANAGER_PASSWORD || defaultPassword,
    name: process.env.CLINIC_MANAGER_NAME || 'Michael Scott',
  },
  {
    role: 'SUPPORT_STAFF',
    email: (process.env.SUPPORT_STAFF_EMAIL || 'support@medcare.com').toLowerCase().trim(),
    password: process.env.SUPPORT_STAFF_PASSWORD || defaultPassword,
    name: process.env.SUPPORT_STAFF_NAME || 'Alex Taylor',
  },
];

async function seedRoles() {
  console.log('🌱 Checking & seeding default role accounts...');

  let client;
  try {
    client = new Client({ connectionString: defaultDbUrl });
    await client.connect();

    // Check if "auth"."User" exists, else fallback to "public"."User"
    let userTable = '"auth"."User"';
    try {
      await client.query('SELECT 1 FROM "auth"."User" LIMIT 1');
    } catch {
      userTable = '"public"."User"';
    }

    console.log(`📌 Using user table: ${userTable}`);

    // Detect DoctorProfile table
    let doctorProfileTable = null;
    try {
      await client.query('SELECT 1 FROM "doctor"."DoctorProfile" LIMIT 1');
      doctorProfileTable = '"doctor"."DoctorProfile"';
    } catch {
      try {
        await client.query('SELECT 1 FROM "public"."DoctorProfile" LIMIT 1');
        doctorProfileTable = '"public"."DoctorProfile"';
      } catch {}
    }

    // Detect PatientProfile table
    let patientProfileTable = null;
    try {
      await client.query('SELECT 1 FROM "patient"."PatientProfile" LIMIT 1');
      patientProfileTable = '"patient"."PatientProfile"';
    } catch {
      try {
        await client.query('SELECT 1 FROM "public"."PatientProfile" LIMIT 1');
        patientProfileTable = '"public"."PatientProfile"';
      } catch {}
    }

    const createdUsers = [];

    for (const u of seedUsers) {
      // Check if user already exists
      const checkRes = await client.query(
        `SELECT id, email, role FROM ${userTable} WHERE email = $1`,
        [u.email],
      );

      let userId;
      if (checkRes.rows.length > 0) {
        userId = checkRes.rows[0].id;
        console.log(`  ℹ️ User ${u.email} (${u.role}) already exists.`);
      } else {
        const passwordHash = await bcrypt.hash(u.password, 10);
        userId = randomUUID();
        const now = new Date();

        await client.query(
          `INSERT INTO ${userTable} (
            "id", "email", "passwordHash", "name", "role", "status", "isEmailVerified", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE', true, $6, $7)`,
          [userId, u.email, passwordHash, u.name, u.role, now, now],
        );

        console.log(`  ✨ Created user: ${u.email} [${u.role}]`);
      }

      createdUsers.push({ ...u, id: userId });

      // If DOCTOR and doctorProfileTable exists, ensure DoctorProfile exists
      if (u.role === 'DOCTOR' && doctorProfileTable) {
        try {
          const docCheck = await client.query(
            `SELECT id FROM ${doctorProfileTable} WHERE "userId" = $1`,
            [userId],
          );
          if (docCheck.rows.length === 0) {
            const docId = randomUUID();
            const now = new Date();
            await client.query(
              `INSERT INTO ${doctorProfileTable} (
                "id", "userId", "name", "email", "specialty", "consultationFee", "experienceYears", "verificationStatus", "isAvailableToday", "qualifications", "documents", "createdAt", "updatedAt"
              ) VALUES ($1, $2, $3, $4, $5, 75.0, 10, 'VERIFIED', true, $6, $7, $8, $9)`,
              [
                docId,
                userId,
                u.name,
                u.email,
                u.specialty || 'Cardiology',
                ['MD', 'FACC'],
                [],
                now,
                now,
              ],
            );
            console.log(`    🏥 Created DoctorProfile for ${u.name}`);
          }
        } catch (err) {
          console.warn(`    ⚠️ Notice creating DoctorProfile: ${err.message}`);
        }
      }

      // If PATIENT and patientProfileTable exists, ensure PatientProfile exists
      if (u.role === 'PATIENT' && patientProfileTable) {
        try {
          const patientCheck = await client.query(
            `SELECT id FROM ${patientProfileTable} WHERE "userId" = $1`,
            [userId],
          );
          if (patientCheck.rows.length === 0) {
            const patId = randomUUID();
            const now = new Date();
            await client.query(
              `INSERT INTO ${patientProfileTable} (
                "id", "userId", "name", "email", "status", "allergies", "chronicConditions", "createdAt", "updatedAt"
              ) VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $7, $8)`,
              [patId, userId, u.name, u.email, [], [], now, now],
            );
            console.log(`    🩺 Created PatientProfile for ${u.name}`);
          }
        } catch (err) {
          console.warn(`    ⚠️ Notice creating PatientProfile: ${err.message}`);
        }
      }
    }



    console.log('\n======================================================');
    console.log('✅ MedCare Role Accounts Seeded & Ready:');
    console.log('======================================================');
    for (const u of createdUsers) {
      console.log(`Role: ${u.role.padEnd(14)} | Email: ${u.email.padEnd(26)} | Password: ${u.password}`);
    }
    console.log('======================================================\n');

    await client.end();
  } catch (err) {
    console.warn(`⚠️ Role seed notice: ${err.message}`);
    if (client) {
      try {
        await client.end();
      } catch {}
    }
  }
}

seedRoles();
