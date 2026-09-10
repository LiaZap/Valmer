/**
 * Turmas: o agrupamento que o parceiro cria antes de enviar os passaportes.
 *
 * E a raiz do bloco — envio rapido e DNA penduram nela — e por isso o escopo
 * por dono aqui nao pode ser so um WHERE bem escrito: as turmas de um parceiro
 * nunca podem receber assessment de outro, e quem garante isso e a CHAVE
 * (ver `uq_turmas_id_facilitador` abaixo).
 *
 * O que deliberadamente NAO existe aqui, e o motivo de cada ausencia:
 *
 * - `slug`. A rota e por uuid. Slug derivado do nome colide entre parceiros
 *   ("Turma 2026" de dois facilitadores) e uma colisao dessas e caminho de
 *   vazamento, nao inconveniencia de URL.
 * - `total`, `respondidos`, `pendentes`. Sao COUNT sobre os assessments da
 *   turma. Guardar numero calculavel e o erro que o CONTINUIDADE.md ja
 *   registra com o campo `perfil` do assessment: os dois so batiam por
 *   coincidencia dos dados de exemplo, e desencontraram no primeiro dado real.
 * - degustacao. O filtro existe na tela, o formulario nao tem o campo e nao ha
 *   tabela de degustacao. Filtro sem dado fica como pendencia; coluna vazia
 *   mentiria dizendo que o dado existe.
 */
import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { usuarios } from "./usuarios";
import { areaTurma, tipoRelatorio } from "./enums";
import { TEMPO } from "./tempo";

export const turmas = pgTable(
  "turmas",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    facilitador_id: uuid("facilitador_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    nome: text("nome").notNull(),
    area: areaTurma("area").notNull(),
    /** S1..S4, o mesmo nivel do resto do sistema. Nao ha tipo so de turma. */
    tipo_relatorio: tipoRelatorio("tipo_relatorio").notNull(),
    /** Se o respondente pode baixar o PDF ao terminar o questionario. */
    permite_download: boolean("permite_download").notNull().default(false),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    // NAO e redundante com a PK. E o alvo da FK COMPOSTA de assessments
    // (turma_id, facilitador_id): com ela, o banco RECUSA um assessment de um
    // facilitador apontando para a turma de outro. Escopo na chave, e nao so
    // no WHERE — WHERE alguem esquece de escrever, chave nao.
    uniqueIndex("uq_turmas_id_facilitador").on(t.id, t.facilitador_id),

    // O dono vem PRIMEIRO de proposito: o formato do indice e o formato da
    // consulta que alguem vai escrever. Com `facilitador_id` na frente, uma
    // consulta que esquecer o dono deixa de ser servida pelo prefixo do
    // indice — o erro aparece como lentidao antes de aparecer como vazamento.
    index("idx_turmas_dono").on(t.facilitador_id, t.is_deleted),
  ],
);

export type Turma = typeof turmas.$inferSelect;
export type NovaTurma = typeof turmas.$inferInsert;
