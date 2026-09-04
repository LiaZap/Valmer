/**
 * Cursos da Impacto Academy, criados e hospedados pelo dono da plataforma.
 *
 * Quem escreve e publica e o admin, pelo /admin/cursos. O ALUNO NAO entra por
 * este login: ele tera plataforma e login proprios, e o que essa plataforma
 * vai ler daqui e so o que estiver `publicado`. Por isso a publicacao e um
 * campo, e nao um delete: rascunho continua existindo, so nao sai daqui.
 */
import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { TEMPO } from "./tempo";

export const cursos = pgTable(
  "cursos",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    titulo: text("titulo").notNull(),
    /** Uma frase. E o que aparece embaixo do titulo no card. */
    descricao: text("descricao").notNull(),
    /** O corpo do curso: programa, modulos e os enderecos das aulas. */
    conteudo: text("conteudo").notNull(),
    publicado: boolean("publicado").notNull().default(false),
    /** Quando saiu do rascunho. Volta a nulo se for despublicado. */
    publicado_em: timestamp("publicado_em", TEMPO),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  // A plataforma do aluno vai perguntar sempre a mesma coisa: o que esta
  // publicado e vivo.
  (t) => [index("idx_cursos_publicados").on(t.is_deleted, t.publicado)],
);

export type Curso = typeof cursos.$inferSelect;
export type NovoCurso = typeof cursos.$inferInsert;
