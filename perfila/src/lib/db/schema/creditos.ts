/**
 * Extrato de creditos do facilitador.
 *
 * O saldo em `usuarios.creditos` e a soma destas linhas. Quem move o saldo
 * grava a transacao na mesma operacao, para o extrato sempre explicar o saldo.
 */
import { pgTable, uuid, text, integer, boolean, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { TEMPO } from "./tempo";
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
    /**
     * Quanto a plataforma COBROU nesta compra, em reais inteiros, como
     * `precos_pacotes.preco`. Copiado do pacote no momento da venda e nunca
     * recalculado depois: enquanto a receita do painel era casada com o pacote
     * vigente PELA QUANTIDADE, mudar o preco em /admin/precos reescrevia o
     * faturamento do mes passado, e compra que nao casava com pacote nenhum
     * somava zero calada. Mesma decisao de `assessments.creditos_usados` — ver
     * "o que acontece com o passado quando o preco muda", em `schema/precos.ts`.
     *
     * NULO em movimento que nao e compra (uso, bonus e estorno nao cobram nada)
     * e nas compras anteriores a esta coluna. Sem DEFAULT de proposito: zero
     * seria afirmar que a venda foi de graca e o preco de hoje seria justamente
     * a mentira que a coluna existe para acabar. O painel conta essas compras a
     * parte, em vez de inventar valor para elas.
     *
     * NAO alcanca a CONSTRAINT TRIGGER da migration 0005: aquela guarda confere
     * `usuarios.creditos` contra a soma de `quantidade`, e dinheiro nao entra na
     * conta de credito.
     */
    valor_cobrado: integer("valor_cobrado"),
    /** Preenchido quando o movimento e o consumo de um assessment. */
    assessment_id: uuid("assessment_id").references(() => assessments.id, {
      onDelete: "restrict",
    }),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    index("idx_transacoes_usuario").on(t.usuario_id),
    index("idx_transacoes_ativas").on(t.is_deleted),
    // Cobranca negativa viraria receita descontada por engano de digitacao. NULL
    // passa, que e o caso legitimo da linha que nao cobrou nada.
    check("ck_transacoes_valor_cobrado", sql`${t.valor_cobrado} >= 0`),
  ],
);

export type CreditoTransacao = typeof creditosTransacoes.$inferSelect;
export type NovaCreditoTransacao = typeof creditosTransacoes.$inferInsert;
