/**
 * Extrato de creditos do facilitador.
 *
 * O saldo em `usuarios.creditos` e a soma destas linhas. Quem move o saldo
 * grava a transacao na mesma operacao, para o extrato sempre explicar o saldo.
 */
import { pgTable, uuid, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { usuarios } from "./usuarios";
import { assessments } from "./assessments";
import { tipoTransacao } from "./enums";

export const creditosTransacoes = pgTable(
  "creditos_transacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    usuario_id: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    tipo: tipoTransacao("tipo").notNull(),
    /** Positivo em compra, bonus e estorno. Negativo em uso. */
    quantidade: integer("quantidade").notNull(),
    descricao: text("descricao").notNull(),
    /** Preenchido quando o movimento e o consumo de um assessment. */
    assessment_id: uuid("assessment_id").references(() => assessments.id, {
      onDelete: "restrict",
    }),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    index("idx_transacoes_usuario").on(t.usuario_id),
    index("idx_transacoes_ativas").on(t.is_deleted),
  ],
);

export type CreditoTransacao = typeof creditosTransacoes.$inferSelect;
export type NovaCreditoTransacao = typeof creditosTransacoes.$inferInsert;
