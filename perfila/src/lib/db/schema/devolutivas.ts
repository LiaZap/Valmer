/**
 * Devolutivas: a sessao de feedback do facilitador com o respondente.
 *
 * Pendura no ASSESSMENT, e nao no cliente: a conversa e sobre UM resultado
 * especifico. A mesma pessoa avaliada duas vezes tem duas devolutivas, uma por
 * mapa, e e assim que o parceiro compara a de antes com a de agora.
 *
 * NAO EXISTE coluna `situacao` e nao ha enum de situacao. O estado e DERIVADO:
 * `finalizada_em` preenchido = Finalizada, vazio = Pausada. Coluna derivavel de
 * outra coluna da mesma linha e segunda fonte de verdade — este projeto ja se
 * queimou com isso no campo `perfil` do assessment (ver CONTINUIDADE.md), onde
 * o valor gravado e o valor calculado so batiam por coincidencia dos dados de
 * exemplo.
 */
import {
  pgTable, uuid, integer, boolean, timestamp, index, foreignKey, uniqueIndex, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { assessments } from "./assessments";
import { TEMPO } from "./tempo";

export const devolutivas = pgTable(
  "devolutivas",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    assessment_id: uuid("assessment_id").notNull(),
    /**
     * DENORMALIZADO do assessment, e nao redundancia por descuido: e a metade
     * da FK composta abaixo. Sem esta coluna aqui, o banco nao tem como
     * comparar o dono da devolutiva com o dono do assessment, e a unica
     * protecao contra um parceiro dar devolutiva sobre o mapa de outro passa a
     * ser alguem lembrar de escrever o WHERE.
     */
    facilitador_id: uuid("facilitador_id").notNull(),
    /** Cronometro da sessao. Nulo enquanto ninguem parou o relogio. */
    duracao_segundos: integer("duracao_segundos"),
    /** Preenchido = Finalizada; vazio = Pausada. Nao ha terceira situacao. */
    finalizada_em: timestamp("finalizada_em", TEMPO),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    // Escopo do dono na CHAVE. Aponta para `uq_assessments_id_facilitador`: o
    // BANCO recusa uma devolutiva de um parceiro sobre o assessment de outro,
    // em vez de depender do WHERE da action. WHERE alguem esquece, chave nao.
    foreignKey({
      name: "fk_devolutivas_assessment_dono",
      columns: [t.assessment_id, t.facilitador_id],
      foreignColumns: [assessments.id, assessments.facilitador_id],
    }).onDelete("restrict"),

    // Tempo negativo nao e "zero mal arredondado": e sinal de relogio lido ao
    // contrario, e somado no total de horas do parceiro ele encolhe o numero
    // sem que nada acuse.
    check("ck_devolutivas_duracao", sql`${t.duracao_segundos} IS NULL OR ${t.duracao_segundos} >= 0`),

    uniqueIndex("uq_devolutivas_id_facilitador").on(t.id, t.facilitador_id),
    index("idx_devolutivas_dono").on(t.facilitador_id, t.is_deleted),
  ],
);

export type Devolutiva = typeof devolutivas.$inferSelect;
export type NovaDevolutiva = typeof devolutivas.$inferInsert;
