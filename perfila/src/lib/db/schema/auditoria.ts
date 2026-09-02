/**
 * Trilha de auditoria: quem fez, o que fez e quando.
 *
 * compliance:append-only — esta tabela nao tem updated_at, deleted_at nem
 * is_deleted de proposito. Um log que pode ser alterado ou "soft deletado"
 * nao e trilha de auditoria. So recebe INSERT; nada no sistema atualiza ou
 * apaga linha daqui. Especificado assim em docs/back.md.
 */
import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { TEMPO } from "./tempo";

export const auditoria = pgTable(
  "auditoria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Quem executou. Sem FK: o log sobrevive ao usuario. */
    user_id: uuid("user_id").notNull(),
    /** 'criar' | 'atualizar' | 'excluir' */
    acao: text("acao").notNull(),
    tabela: text("tabela").notNull(),
    registro_id: uuid("registro_id").notNull(),
    detalhes: text("detalhes").notNull(),
    /** JSON serializado do estado antes e depois. */
    dados_anteriores: text("dados_anteriores"),
    dados_novos: text("dados_novos"),
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
  },
  (t) => [
    index("idx_auditoria_registro").on(t.tabela, t.registro_id),
    index("idx_auditoria_usuario").on(t.user_id),
  ],
);

export type Auditoria = typeof auditoria.$inferSelect;
export type NovaAuditoria = typeof auditoria.$inferInsert;
