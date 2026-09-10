/**
 * Clientes: a pessoa avaliada, com nome, e-mail e celular proprios.
 *
 * Hoje o avaliado vive solto em `assessments.avaliado_nome` e
 * `avaliado_email`, e a tela de Clientes le um array fixo. Cliente e avaliado
 * sao a MESMA entidade — a tabela existe para o parceiro ter carteira, e nao
 * para haver um segundo cadastro de pessoa ao lado do primeiro.
 *
 * A MESMA pessoa atendida por dois facilitadores vira DUAS linhas, uma por
 * dono. E deliberado: cliente e a carteira do parceiro, nao cadastro global.
 * Linha compartilhada obrigaria concorrentes a verem o mesmo nome, o mesmo
 * celular e o mesmo historico de edicao — e aqui vazamento entre parceiros e o
 * defeito mais grave que existe.
 *
 * O que NAO entra neste bloco: ligar `assessments` a esta tabela e aposentar
 * `avaliado_nome`/`avaliado_email`. Isso e migracao de dado existente, com
 * decisao propria sobre o que fazer com o avaliado que nunca virou cliente.
 */
import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usuarios } from "./usuarios";
import { TEMPO } from "./tempo";

export const clientes = pgTable(
  "clientes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    facilitador_id: uuid("facilitador_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    nome: text("nome").notNull(),
    /** Sempre minusculo: quem normaliza e `emailPessoa`, em validators. */
    email: text("email").notNull(),
    /** Opcional: o convite vai por e-mail; o celular e so contato do parceiro. */
    celular: text("celular"),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    // PARCIAL, e por duas razoes independentes:
    //
    // 1. O dono entra na chave. Sem `facilitador_id` aqui, o parceiro B
    //    receberia "e-mail duplicado" ao cadastrar alguem que o concorrente A
    //    ja atende — e descobriria a carteira do outro por mensagem de erro.
    // 2. O WHERE deixa recadastrar quem foi removido. Com indice unico cheio,
    //    a linha soft deletada continua ocupando o par (dono, e-mail) para
    //    sempre, e o parceiro que excluiu por engano nunca mais cadastra
    //    aquela pessoa.
    uniqueIndex("uq_clientes_facilitador_email")
      .on(t.facilitador_id, t.email)
      .where(sql`${t.is_deleted} = false`),

    // Alvo de FK composta, como em turmas: quem vier pendurar algo no cliente
    // (o assessment, quando a migracao de dado acontecer) leva o dono junto na
    // referencia, e o BANCO recusa o cruzamento de parceiro.
    uniqueIndex("uq_clientes_id_facilitador").on(t.id, t.facilitador_id),

    // Dono PRIMEIRO: o formato do indice e o formato da consulta que alguem
    // vai escrever. Consulta que esquecer o dono deixa de ser servida pelo
    // prefixo, e o erro aparece como lentidao antes de aparecer como vazamento.
    index("idx_clientes_dono").on(t.facilitador_id, t.is_deleted),
  ],
);

export type Cliente = typeof clientes.$inferSelect;
export type NovoCliente = typeof clientes.$inferInsert;
