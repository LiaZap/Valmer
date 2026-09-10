import { z } from "zod";

/**
 * Fronteira da tabela comercial: o que o admin pode escrever em
 * /admin/precos.
 *
 * Numero de credito e numero de dinheiro entram como INTEIRO nao negativo, e
 * nao como `number` livre. Um preco fracionario viraria arredondamento
 * diferente em cada tela, e um credito fracionario nao existe: o saldo do
 * parceiro e `integer` no banco desde a primeira migration.
 *
 * Os tetos nao sao burocracia: preco e o unico dado do sistema em que um zero
 * a mais digitado por engano vira cobranca real. Melhor recusar 99999 creditos
 * no formulario do que descobrir na fatura.
 */
const creditosDoPreco = z
  .number()
  .int("Creditos deve ser um numero inteiro")
  .min(1, "O custo minimo e 1 credito")
  .max(10_000, "Valor de creditos alto demais para ser digitacao correta");

const reais = z
  .number()
  .int("O valor deve ser em reais inteiros, sem centavos")
  .min(0, "Valor nao pode ser negativo")
  .max(1_000_000, "Valor alto demais para ser digitacao correta");

/**
 * Edicao do preco de um nivel de relatorio.
 *
 * `codigo` NAO entra. Ele e a identidade da linha (S1..S4, o mesmo enum de
 * `assessments.tipo_relatorio`) e trocar o codigo de um preco existente moveria
 * o preco de um nivel para outro sem ninguem perceber. Para mudar o que S1
 * custa, edite a linha do S1.
 *
 * Nao existe criar/excluir aqui: os niveis sao os quatro valores do enum do
 * banco, todos semeados. Um quinto exige mudar o enum, que e migration.
 */
export const atualizarPrecoRelatorioSchema = z
  .strictObject({
    nome: z.string().trim().min(3, "Nome muito curto").max(60, "Nome muito longo"),
    creditos: creditosDoPreco,
    conteudo: z
      .string()
      .trim()
      .min(10, "Descreva o que este nivel entrega")
      .max(400, "Descricao muito longa"),
    revenda_min: reais,
    revenda_max: reais,
  })
  .refine((preco) => preco.revenda_min <= preco.revenda_max, {
    message: "A revenda minima nao pode ser maior que a maxima",
    path: ["revenda_min"],
  });

/**
 * Pacote de credito.
 *
 * `strictObject` pelo mesmo motivo de `atualizarFacilitadorSchema`: o zod
 * descarta chave desconhecida em silencio, e uma action que recebe uma chave a
 * mais e nao reclama parece ter aceitado.
 */
export const pacoteSchema = z.strictObject({
  nome: z.string().trim().min(2, "Nome do pacote muito curto").max(60, "Nome muito longo"),
  creditos: creditosDoPreco,
  preco: reais,
  publico: z
    .string()
    .trim()
    .min(5, "Descreva para quem e este pacote")
    .max(160, "Descricao muito longa"),
});

export type AtualizarPrecoRelatorio = z.infer<typeof atualizarPrecoRelatorioSchema>;
export type Pacote = z.infer<typeof pacoteSchema>;
