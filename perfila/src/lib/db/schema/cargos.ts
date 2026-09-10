/**
 * Cargos: o perfil comportamental ALVO de uma posicao, na Arquitetura de
 * Cargos.
 *
 * Os quatro alvos sao PERCENTUAIS, e nao faixa (min/max), porque a tela
 * promete comparar candidatos entre si — e comparar exige distancia. Com faixa
 * so da para responder "esta dentro ou fora"; dois candidatos fora da faixa
 * ficariam empatados, sem ordem nenhuma para mostrar.
 */
import {
  pgTable, uuid, text, smallint, boolean, timestamp, index, uniqueIndex, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usuarios } from "./usuarios";
import { TEMPO } from "./tempo";

export const cargos = pgTable(
  "cargos",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    facilitador_id: uuid("facilitador_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    nome: text("nome").notNull(),

    /**
     * Alvo DISC da posicao, em percentual. NULAVEIS de proposito: o cargo que
     * ja existe nos dados foi cadastrado em 2020 sem alvo nenhum, porque o
     * campo nao existia. NOT NULL tornaria a tabela impossivel de preencher —
     * ou obrigaria a inventar um alvo para cargo que nunca teve.
     *
     * Os quatro andam juntos: ou todos preenchidos ou todos vazios. Quem
     * garante isso e o CHECK abaixo, no banco.
     */
    alvo_d: smallint("alvo_d"),
    alvo_i: smallint("alvo_i"),
    alvo_s: smallint("alvo_s"),
    alvo_c: smallint("alvo_c"),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    // A regra vive no BANCO, e nao so no zod, porque o estrago dela e SILENCIOSO:
    // um alvo que soma 250 comparado contra um perfil que soma 100 produz uma
    // distancia sem significado, e a tela mostra ranking de candidatos errado
    // sem quebrar nada. Validacao de aplicacao protege o formulario; seed,
    // script de importacao e UPDATE no psql passam por fora dele.
    check(
      "ck_cargos_alvo",
      // Os `IS NOT NULL` do segundo ramo NAO sao enfeite. Sem eles, tres alvos
      // preenchidos e um vazio produzem `50 + 30 + 20 + NULL = 100`, que em SQL
      // nao e falso: e NULL — e CHECK que resulta em NULL ACEITA a linha. O
      // furo passava calado justamente no caso que mais interessa barrar, o
      // formulario salvo pela metade.
      sql`(${t.alvo_d} IS NULL AND ${t.alvo_i} IS NULL AND ${t.alvo_s} IS NULL AND ${t.alvo_c} IS NULL)
        OR (${t.alvo_d} IS NOT NULL AND ${t.alvo_i} IS NOT NULL
            AND ${t.alvo_s} IS NOT NULL AND ${t.alvo_c} IS NOT NULL
            AND ${t.alvo_d} + ${t.alvo_i} + ${t.alvo_s} + ${t.alvo_c} = 100
            AND ${t.alvo_d} BETWEEN 0 AND 100
            AND ${t.alvo_i} BETWEEN 0 AND 100
            AND ${t.alvo_s} BETWEEN 0 AND 100
            AND ${t.alvo_c} BETWEEN 0 AND 100)`,
    ),

    uniqueIndex("uq_cargos_id_facilitador").on(t.id, t.facilitador_id),
    index("idx_cargos_dono").on(t.facilitador_id, t.is_deleted),
  ],
);

export type Cargo = typeof cargos.$inferSelect;
export type NovoCargo = typeof cargos.$inferInsert;
