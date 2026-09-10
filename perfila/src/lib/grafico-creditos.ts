/**
 * O agrupamento do grafico de creditos do painel do parceiro.
 *
 * Mora aqui, e nao dentro do componente, por um motivo so: aqui da para
 * testar. O componente importa CSS Modules, e o test runner do projeto nao
 * carrega CSS — a conta que decide a altura de cada barra ficaria sem prova
 * nenhuma dentro dele.
 */
import type { Transacao } from "@/data/facilitadores";
import { opcoes } from "@/data/opcoes";

export type Periodo = (typeof opcoes.periodo)[number];

/** Quantas colunas cada agrupamento mostra. Mais que isso vira serrilha. */
export const COLUNAS: Record<Periodo, number> = { Mensal: 6, Semanal: 8, "Diário": 14 };

export type ColunaDoGrafico = { rotulo: string; comprados: number; utilizados: number };

/**
 * "dd/mm/aaaa" — o formato que `lib/painel.ts` ja entrega pronto.
 *
 * O mes entra em `new Date` com um a menos porque o construtor conta de zero.
 * Escrito a mao, e nao por `new Date(texto)`: o construtor le "03/04/2026" como
 * 4 de MARCO, no formato americano, e o extrato inteiro deslizaria de mes sem
 * ninguem ver.
 */
export function paraData(br: string): Date {
  const [dia, mes, ano] = br.split("/").map(Number);
  return new Date(ano ?? 1970, (mes ?? 1) - 1, dia ?? 1);
}

/**
 * O rotulo da coluna E a chave do agrupamento, de uma vez so.
 *
 * Dois campos separados — uma chave para agrupar e um texto para mostrar —
 * sairiam do lugar no dia em que alguem mexesse em um sem o outro. Aqui, se
 * dois movimentos mostram o mesmo rotulo, eles estao na mesma coluna por
 * construcao.
 */
export function rotuloDoPeriodo(data: Date, periodo: Periodo): string {
  if (periodo === "Mensal") {
    return data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  }
  if (periodo === "Diário") {
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  // Semana comeca no domingo, como o calendario brasileiro.
  const domingo = new Date(data);
  domingo.setDate(data.getDate() - data.getDay());
  return domingo.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/**
 * Agrupa o extrato em colunas, da mais antiga para a mais recente.
 *
 * O extrato chega do servidor em ordem DECRESCENTE (o mais novo primeiro), que
 * e o certo para uma lista e o errado para um grafico: com o tempo correndo
 * para tras, alta le-se como queda. Por isso a inversao.
 */
export function agruparCreditos(
  movimentos: Pick<Transacao, "data" | "quantidade">[],
  periodo: Periodo,
): ColunaDoGrafico[] {
  const porRotulo = new Map<string, ColunaDoGrafico>();

  for (const movimento of [...movimentos].reverse()) {
    const chave = rotuloDoPeriodo(paraData(movimento.data), periodo);
    const coluna = porRotulo.get(chave) ?? { rotulo: chave, comprados: 0, utilizados: 0 };
    if (movimento.quantidade >= 0) coluna.comprados += movimento.quantidade;
    else coluna.utilizados += Math.abs(movimento.quantidade);
    porRotulo.set(chave, coluna);
  }

  return [...porRotulo.values()].slice(-COLUNAS[periodo]);
}

/**
 * A altura de cada barra sai deste teto, e ele e o maior valor das DUAS series.
 *
 * Escalar cada serie pelo proprio maximo faria uma compra de 10 aparecer do
 * mesmo tamanho de um uso de 100 — duas reguas diferentes no mesmo desenho.
 * O piso de 1 evita divisao por zero na coluna que so tem movimento zero.
 */
export function tetoDoGrafico(colunas: ColunaDoGrafico[]): number {
  return Math.max(1, ...colunas.map((c) => Math.max(c.comprados, c.utilizados)));
}
