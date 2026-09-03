/**
 * Sessoes de login.
 *
 * A sessao mora no banco, e nao num JWT assinado: revogar um acesso passa a
 * ser um DELETE, e nao esperar o token expirar sozinho. O cookie carrega so o
 * hash do token, entao vazar o banco nao entrega sessao viva a ninguem — ver
 * o cabecalho de lib/auth/senha.ts.
 */
import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { usuarios } from "./usuarios";
import { TEMPO } from "./tempo";

export const sessoes = pgTable(
  "sessoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    /**
     * SHA-256 do token que vai no cookie, nunca o token em si. Quem le a
     * tabela nao consegue se passar por ninguem.
     */
    token_hash: text("token_hash").notNull(),
    expira_em: timestamp("expira_em", TEMPO).notNull(),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    uniqueIndex("uq_sessoes_token").on(t.token_hash),
    index("idx_sessoes_usuario").on(t.usuario_id),
  ],
);

// `SessaoRegistro`, e nao `Sessao`: o tipo de lib/auth com esse nome descreve
// quem esta logado, e os dois se encontram no mesmo import em varios arquivos.
export type SessaoRegistro = typeof sessoes.$inferSelect;
export type NovaSessaoRegistro = typeof sessoes.$inferInsert;
