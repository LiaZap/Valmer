/**
 * Conexao com o PostgreSQL.
 *
 * Uso: `import { db } from '@/lib/db'` e depois `db.select().from(usuarios)`.
 * Toda query padrao filtra `is_deleted = false` — o delete aqui e logico.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DATABASE_URL nao definida. Copie .env.example para .env.local e suba o banco com `docker compose up -d db`.",
  );
}

// Em dev o Next reavalia os modulos a cada hot reload. Sem guardar o pool no
// escopo global, cada recarga abre um pool novo e o Postgres chega ao limite
// de conexoes em poucos minutos.
const cache = globalThis as unknown as { __valmerPool?: Pool };
const pool = cache.__valmerPool ?? new Pool({ connectionString: url });
if (process.env.NODE_ENV !== "production") cache.__valmerPool = pool;

export const db = drizzle(pool, { schema });
export { schema };
