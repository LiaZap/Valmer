/**
 * O catalogo comercial LIDO: quanto custa cada nivel de relatorio e o que cada
 * pacote entrega.
 *
 * Fica separado de `actions/precos.ts` de proposito, e a divisao e de
 * permissao:
 *
 * - ESCREVER preco e do admin, passa pelo rbac (`precos:*`) e mora na action.
 * - LER preco e de todo mundo. O facilitador precisa saber que um S1 custa 1
 *   credito antes de gastar, e `actions/assessments.ts` precisa do numero para
 *   cobrar. Guardar a leitura atras de `precos:ler` (que e so do admin)
 *   trancaria o parceiro fora do proprio preco.
 *
 * Este modulo NAO e "use server": nada aqui vira endpoint POST publico. Quem o
 * chama ja fez a checagem de sessao da propria operacao.
 *
 * Todas as funcoes aceitam um `leitor` — o `db` normal ou o `tx` de uma
 * transacao em curso. O custo do mapa e lido DENTRO da transacao que o cobra,
 * junto da linha do dono travada: assim o preco que a recusa de saldo usou e o
 * mesmo que foi gravado em `creditos_usados`.
 */
import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { precosPacotes, precosRelatorios } from "@/lib/db/schema";
import { RecusaDeRegra } from "@/lib/actions/recusa";

/** Quem executa a leitura: o `db` normal ou o `tx` da transacao em curso. */
export type Leitor = Pick<typeof db, "select">;

export type CodigoRelatorio = "S1" | "S2" | "S3" | "S4";

/** A tabela de precos vigente, do nivel mais barato ao mais caro. */
export async function listarPrecosRelatorios(leitor: Leitor = db) {
  return leitor
    .select()
    .from(precosRelatorios)
    .where(eq(precosRelatorios.is_deleted, false))
    .orderBy(asc(precosRelatorios.creditos));
}

/** Os pacotes a venda, do menor para o maior. */
export async function listarPacotes(leitor: Leitor = db) {
  return leitor
    .select()
    .from(precosPacotes)
    .where(eq(precosPacotes.is_deleted, false))
    .orderBy(asc(precosPacotes.creditos));
}

/**
 * O preco vigente de um nivel.
 *
 * A ausencia e RECUSA DE REGRA, e nao `null` devolvido em silencio: sem preco
 * o sistema nao sabe quanto cobrar, e cobrar zero seria mapa de graca. A
 * mensagem diz onde resolver, porque quem a le e o parceiro que so queria
 * enviar um mapa.
 */
export async function precoDoRelatorio(codigo: CodigoRelatorio, leitor: Leitor = db) {
  const [preco] = await leitor
    .select()
    .from(precosRelatorios)
    .where(
      and(eq(precosRelatorios.codigo, codigo), eq(precosRelatorios.is_deleted, false)),
    )
    .limit(1);

  if (!preco) {
    throw new RecusaDeRegra(
      `O nivel ${codigo} nao tem preco cadastrado. Peca ao administrador para definir o preco em /admin/precos.`,
    );
  }

  return preco;
}

/** Quantos creditos o mapa deste nivel custa HOJE. O de ontem ja esta pago. */
export async function custoDoRelatorio(
  codigo: CodigoRelatorio,
  leitor: Leitor = db,
): Promise<number> {
  return (await precoDoRelatorio(codigo, leitor)).creditos;
}

/**
 * O pacote pelo nome, que e como a venda o referencia.
 *
 * Substitui `getPacote` de `data/planos.ts`. A validacao do formulario nao
 * consegue mais ser um `z.enum` da lista fixa — a lista agora e editavel pelo
 * admin — entao a existencia do pacote passa a ser conferida AQUI, contra o
 * banco, dentro da mesma transacao que credita. E o mesmo contrato de antes:
 * a quantidade de creditos vem do pacote, nunca de um numero digitado na tela.
 */
export async function pacotePorNome(nome: string, leitor: Leitor = db) {
  const [pacote] = await leitor
    .select()
    .from(precosPacotes)
    .where(and(eq(precosPacotes.nome, nome), eq(precosPacotes.is_deleted, false)))
    .limit(1);

  if (!pacote) throw new RecusaDeRegra(`Pacote "${nome}" nao existe ou foi descontinuado.`);

  return pacote;
}
