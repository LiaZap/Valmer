/**
 * Métricas da plataforma
 * ----------------------
 * Tudo é derivado dos dados, nunca digitado. Assim os números do
 * painel não podem divergir das listas que os originam.
 *
 * Os dados chegam por parâmetro, e não por import: quem lê o banco é
 * `@/lib/painel`, do lado servidor, com o recorte por dono no WHERE. Se este
 * módulo importasse a fonte, ele decidiria sozinho de onde vêm os números — e
 * era assim que o painel continuava somando o protótipo depois do banco pronto.
 *
 * A tabela de preços NÃO chega mais aqui, e a ausência é a correção: a receita
 * era recalculada casando cada compra com o pacote vigente de mesmo tamanho, e
 * o preço vigente é o do PRÓXIMO pacote, nunca o do que já foi vendido. Hoje o
 * valor cobrado vem gravado na própria linha da compra.
 */

import type { Assessment, Facilitador, Transacao } from '@/data/facilitadores'

export type DadosPlataforma = {
  /**
   * Os parceiros, que aqui valem por DOIS papéis: são o saldo em carteira e
   * são a população de quem a plataforma vendeu. Ver `metricasPlataforma`.
   */
  facilitadores: Facilitador[]
  assessments: Assessment[]
  transacoes: Transacao[]
}

/**
 * Os indicadores do painel do dono da plataforma.
 *
 * TUDO AQUI OLHA PARA A MESMA POPULAÇÃO: o que a plataforma vendeu A PARCEIRO.
 * Antes não era assim — "Créditos vendidos" somava toda linha de compra do
 * extrato e "em carteira" somava só o saldo de quem tem papel de facilitador,
 * então as duas metades do mesmo cartão contavam gente diferente. O próprio
 * dono tem lançamentos de crédito (ele também aplica mapas), e comprar de si
 * mesmo aparecia como venda: 260 créditos vendidos, dos quais 200 eram dele.
 *
 * O corte acontece AQUI, e não em `painel.listarTransacoes`, de propósito:
 * aquela mesma leitura alimenta o extrato de /admin/creditos, que é a conta
 * corrente da plataforma e precisa continuar mostrando toda linha, inclusive as
 * do dono. O que é indicador de venda se recorta; o extrato, não.
 */
export function metricasPlataforma({
  facilitadores,
  assessments,
  transacoes,
}: DadosPlataforma) {
  const ativos = facilitadores.filter((facilitador) => facilitador.ativo)

  const parceiros = new Set(facilitadores.map((facilitador) => facilitador.id))
  const doParceiro = transacoes.filter((transacao) => parceiros.has(transacao.facilitadorId))

  const compras = doParceiro.filter((transacao) => transacao.tipo === 'compra')

  const creditosVendidos = compras.reduce((soma, transacao) => soma + transacao.quantidade, 0)

  const creditosUsados = doParceiro
    .filter((transacao) => transacao.tipo === 'uso')
    .reduce((soma, transacao) => soma + Math.abs(transacao.quantidade), 0)

  const concluidos = assessments.filter((item) => item.situacao === 'concluido')

  // Receita é o que foi COBRADO na hora da compra, lido da própria linha — não
  // mais o preço de hoje casado com a quantidade. Aquela conta fazia a receita
  // do mês passado mudar quando o admin mexia em /admin/precos, e engolia calada
  // a compra que não casava com pacote nenhum.
  const receita = compras.reduce((soma, transacao) => soma + (transacao.valorCobrado ?? 0), 0)

  return {
    facilitadoresAtivos: ativos.length,
    facilitadoresTotal: facilitadores.length,
    creditosVendidos,
    creditosUsados,
    creditosEmCarteira: facilitadores.reduce((soma, item) => soma + item.creditos, 0),
    assessmentsTotal: assessments.length,
    assessmentsConcluidos: concluidos.length,
    receita,
    /**
     * Quantas compras entraram no crédito vendido mas ficaram FORA da receita,
     * por serem anteriores à coluna que grava o valor. A tela mostra o número em
     * vez de o painel arbitrar um preço para elas: receita menor e declarada é
     * honesta; receita inventada não tem como ser desmentida.
     */
    comprasSemValor: compras.filter((transacao) => transacao.valorCobrado == null).length,
  }
}

/** Taxa de conclusão dos assessments enviados, em percentual. */
export function taxaConclusao(assessments: Assessment[]): number {
  if (assessments.length === 0) return 0
  const concluidos = assessments.filter((item) => item.situacao === 'concluido').length
  return Math.round((concluidos / assessments.length) * 100)
}
