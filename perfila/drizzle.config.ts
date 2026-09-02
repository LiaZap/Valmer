import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// A app le .env.local (padrao do Next); o drizzle-kit roda fora dela e
// precisa carregar o arquivo na mao.
config({ path: [".env.local", ".env"] });

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./src/lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  verbose: true,
  strict: true,
});
