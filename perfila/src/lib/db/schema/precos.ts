/**
 * A tabela comercial da plataforma: quanto cada tipo de relatorio custa em
 * credito, e por quanto o credito e vendido em pacote.
 *
 * Sai de `src/data/planos.ts`, que era codigo: mudar preco exigia deploy, e a
 * tela /admin/precos so sabia dizer que a edicao "nao esta disponivel".
 *
 * ESTAS DUAS TABELAS NAO TEM `facilitador_id`, E ISSO NAO E ESQUECIMENTO
 * ---------------------------------------------------------------------
 * Todas as outras tabelas deste projeto tem dono, porque o dado e do parceiro
 * e o recorte por dono e o que impede um de ver o do outro. Preco nao e dado
 * de parceiro: e o preco DA PLATAFORMA, o mesmo para todo mundo, escrito pelo
 * dono do negocio. Um `facilitador_id` aqui significaria preco por parceiro —
 * um produto diferente do que existe hoje, e que ninguem pediu.
 *
 * Quem restringe a escrita e o rbac (`precos:*`, so admin), e a LEITURA e
 * aberta de proposito: o facilitador precisa ver que um S1 custa 1 credito
 * antes de gastar. Ver `lib/precos.ts`.
 *
 * O QUE ACONTECE COM O PASSADO QUANDO O PRECO MUDA: NADA
 * ------------------------------------------------------
 * O custo cobrado por um mapa fica gravado em `assessments.creditos_usados`,
 * na linha do proprio mapa, no momento da criacao. Estas tabelas dizem quanto
 * custa o PROXIMO mapa. O credito ja foi debitado e a linha do extrato ja foi
 * lancada — reprecificar o passado faria o extrato parar de explicar o saldo,
 * que e exatamente o que a CONSTRAINT TRIGGER da migration 0005 aborta.
 */
import { pgTable, uuid, text, integer, boolean, timestamp, check, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { TEMPO } from "./tempo";
import { tipoRelatorio } from "./enums";

export const precosRelatorios = pgTable(
  "precos_relatorios",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    /**
     * O mesmo enum de `assessments.tipo_relatorio`, e nao um texto livre: um
     * preco de "S5" — nivel que nao existe — seria recusado pelo banco, e nao
     * so pelo formulario.
     */
    codigo: tipoRelatorio("codigo").notNull(),
    nome: text("nome").notNull(),
    /** Quantos creditos o mapa deste nivel consome. E o preco de venda interno. */
    creditos: integer("creditos").notNull(),
    /** O que este nivel entrega alem do anterior. Aparece na tela de precos. */
    conteudo: text("conteudo").notNull(),
    /** Faixa SUGERIDA de revenda ao cliente final, em reais. Nao cobra nada. */
    revenda_min: integer("revenda_min").notNull(),
    revenda_max: integer("revenda_max").notNull(),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    /**
     * Um preco vigente por nivel. PARCIAL (`where is_deleted = false`) porque
     * o delete aqui e logico: com indice cheio, a linha excluida continuaria
     * ocupando o codigo e o nivel nunca mais poderia ser recadastrado.
     */
    uniqueIndex("uq_precos_relatorios_codigo")
      .on(t.codigo)
      .where(sql`${t.is_deleted} = false`),
    // Custo zero seria mapa de graca por engano de digitacao — o caminho de
    // graca e a degustacao, que tem saldo proprio.
    check("ck_precos_relatorios_creditos", sql`${t.creditos} > 0`),
    check("ck_precos_relatorios_revenda", sql`${t.revenda_min} <= ${t.revenda_max}`),
  ],
);

export const precosPacotes = pgTable(
  "precos_pacotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    /** Starter, Pro, Business, Enterprise. E o que a venda referencia pelo nome. */
    nome: text("nome").notNull(),
    /** Quantos creditos o pacote entrega. */
    creditos: integer("creditos").notNull(),
    /**
     * Preco do pacote em REAIS INTEIROS, como em `data/planos.ts` (290, 990).
     * Nenhum pacote tem centavos; se um dia tiver, a coluna vira centavos de
     * uma vez, e nao um `numeric` que arredonda diferente em cada tela.
     */
    preco: integer("preco").notNull(),
    publico: text("publico").notNull(),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    /**
     * O NOME e a chave de negocio: e por ele que a venda escolhe o pacote
     * (`validators/facilitador.ts`). Dois "Pro" ativos e o admin vendendo um
     * dos dois sem saber qual. Parcial pelo mesmo motivo do indice acima.
     *
     * A RECEITA DO PAINEL NAO PASSA MAIS POR AQUI. Ela casava cada compra com o
     * pacote de mesmo tamanho, entao reprecificar reescrevia o passado. Hoje o
     * valor cobrado fica gravado na propria linha do extrato — mesmo desenho de
     * `assessments.creditos_usados`, e pelo mesmo motivo.
     */
    uniqueIndex("uq_precos_pacotes_nome")
      .on(t.nome)
      .where(sql`${t.is_deleted} = false`),
    check("ck_precos_pacotes_creditos", sql`${t.creditos} > 0`),
    check("ck_precos_pacotes_preco", sql`${t.preco} >= 0`),
  ],
);

export type PrecoRelatorio = typeof precosRelatorios.$inferSelect;
export type NovoPrecoRelatorio = typeof precosRelatorios.$inferInsert;
export type PrecoPacote = typeof precosPacotes.$inferSelect;
export type NovoPrecoPacote = typeof precosPacotes.$inferInsert;
