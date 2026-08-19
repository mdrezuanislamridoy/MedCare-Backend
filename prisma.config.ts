import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://medcare:medcare_secure_pass@localhost:5432/medcare_db?schema=public",
  },
});
