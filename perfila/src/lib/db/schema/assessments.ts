/**
 * Assessment aplicado, as respostas e os relatorios gerados.
 *
 * Nomenclatura hierarquica: assessments -> assessments_respostas,
 * assessments -> assessments_relatorios.
 */
import {
  pgTable, uuid, text, integer, boolean, timestamp, jsonb, foreignKey, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { usuarios } from "./usuarios";
import { turmas } from "./turmas";
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
    /**
     * A turma que originou este assessment. Nulo para o que foi criado avulso,
     * pela tela de novo mapa, que e como todos os assessments existentes
     * nasceram — por isso opcional, e nao NOT NULL.
     *
     * Existe desde ja porque sem ele a exclusao de turma nao tem como recusar:
     * o soft delete deixaria assessment vivo apontando para turma invisivel.
     * A FK COMPOSTA (turma_id, facilitador_id) -> uq_turmas_id_facilitador,
     * que e o que impede um assessment de cruzar de dono, ja esta declarada
     * abaixo: entrou com o Envio Rapido, o fluxo que passou a gravar a coluna.
     */
    turma_id: uuid("turma_id").references(() => turmas.id, { onDelete: "restrict" }),
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
    // Escopo do dono na CHAVE. Aponta para `uq_turmas_id_facilitador`: o BANCO
    // recusa um assessment de um parceiro apontando para a turma de outro, em
    // vez de depender do WHERE da action. WHERE alguem esquece, chave nao.
    //
    // MATCH SIMPLE (o padrao) e o que faz o mapa avulso continuar valendo: com
    // `turma_id` nulo a checagem nem roda, e os assessments criados pela tela
    // de novo mapa — que nunca tiveram turma — seguem legais.
    foreignKey({
      name: "fk_assessments_turma_dono",
      columns: [t.turma_id, t.facilitador_id],
      foreignColumns: [turmas.id, turmas.facilitador_id],
    }).onDelete("restrict"),

    uniqueIndex("uq_assessments_token").on(t.token),
    // NAO e redundante com a PK. E o alvo da FK COMPOSTA de devolutivas
    // (assessment_id, facilitador_id): com ela, o banco RECUSA uma devolutiva
    // de um parceiro sobre o assessment de outro. Escopo na chave, e nao so no
    // WHERE — WHERE alguem esquece de escrever, chave nao. E o mesmo papel que
    // `uq_turmas_id_facilitador` cumpre para os assessments.
    uniqueIndex("uq_assessments_id_facilitador").on(t.id, t.facilitador_id),
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
