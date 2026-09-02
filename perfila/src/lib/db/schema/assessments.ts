/**
 * Assessment aplicado, as respostas e os relatorios gerados.
 *
 * Nomenclatura hierarquica: assessments -> assessments_respostas,
 * assessments -> assessments_relatorios.
 */
import {
  pgTable, uuid, text, integer, boolean, timestamp, jsonb, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { usuarios } from "./usuarios";
import { fatorDisc, situacaoAssessment, tipoRelatorio } from "./enums";
import { TEMPO } from "./tempo";

export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    /** Vai na URL /avaliacao/<token>. E o unico acesso do respondente. */
    token: text("token").notNull(),
    facilitador_id: uuid("facilitador_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    avaliado_nome: text("avaliado_nome").notNull(),
    avaliado_email: text("avaliado_email").notNull(),
    tipo_relatorio: tipoRelatorio("tipo_relatorio").notNull(),
    situacao: situacaoAssessment("situacao").notNull().default("pendente"),
    creditos_usados: integer("creditos_usados").notNull().default(0),
    expira_em: timestamp("expira_em", TEMPO).notNull(),
    concluido_em: timestamp("concluido_em", TEMPO),

    /**
     * Quantas das 28 respostas cairam em cada fator. Somam 28, entao os
     * percentuais derivados somam 100.
     *
     * Guarda os contadores, e nao o perfil pronto: lista e relatorio
     * derivam do mesmo numero com `resultadoDeContadores` e nao podem
     * divergir. NAO reintroduzir uma coluna `perfil` calculada — ver
     * CONTINUIDADE.md. Nulos ate o assessment ser concluido.
     */
    contador_d: integer("contador_d"),
    contador_i: integer("contador_i"),
    contador_s: integer("contador_s"),
    contador_c: integer("contador_c"),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    uniqueIndex("uq_assessments_token").on(t.token),
    index("idx_assessments_facilitador").on(t.facilitador_id),
    index("idx_assessments_ativos").on(t.is_deleted),
  ],
);

export const assessmentsRespostas = pgTable(
  "assessments_respostas",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    assessment_id: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "restrict" }),
    /** Codigo da especificacao: Q01 ... Q28. */
    questao_codigo: text("questao_codigo").notNull(),
    /** Fator da opcao escolhida. Cada questao vale +1 para um unico fator. */
    fator: fatorDisc("fator").notNull(),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    // O progresso e salvo a cada resposta e o link pode ser retomado: a
    // segunda gravacao da mesma questao e uma correcao, nao uma linha nova.
    uniqueIndex("uq_respostas_assessment_questao").on(t.assessment_id, t.questao_codigo),
  ],
);

export const assessmentsRelatorios = pgTable(
  "assessments_relatorios",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    assessment_id: uuid("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "restrict" }),
    /** Versao incremental: v1, v2, v3. A ultima e a que o usuario ve. */
    versao: integer("versao").notNull().default(1),
    /** Narrativa gerada pela IA, no formato validado em lib/relatorio/gerar.ts. */
    narrativa: jsonb("narrativa").notNull(),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [uniqueIndex("uq_relatorios_assessment_versao").on(t.assessment_id, t.versao)],
);

export type Assessment = typeof assessments.$inferSelect;
export type NovoAssessment = typeof assessments.$inferInsert;
export type AssessmentResposta = typeof assessmentsRespostas.$inferSelect;
export type NovaAssessmentResposta = typeof assessmentsRespostas.$inferInsert;
export type AssessmentRelatorio = typeof assessmentsRelatorios.$inferSelect;
export type NovoAssessmentRelatorio = typeof assessmentsRelatorios.$inferInsert;
