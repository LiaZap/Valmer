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
 */

import type { Assessment, Facilitador, Transacao } from '@/data/facilitadores'
import { pacotesCreditos } from '@/data/planos'

export type DadosPlataforma = {
  facilitadores: Facilitador[]
  assessments: Assessment[]
  transacoes: Transacao[]
}

export function metricasPlataforma({ facilitadores, assessments, transacoes }: DadosPlataforma) {
  const ativos = facilitadores.filter((facilitador) => facilitador.ativo)

  const creditosVendidos = transacoes
    .filter((transacao) => transacao.tipo === 'compra')
    .reduce((soma, transacao) => soma + transacao.quantidade, 0)

  const creditosUsados = transacoes
    .filter((transacao) => transacao.tipo === 'uso')
    .reduce((soma, transacao) => soma + Math.abs(transacao.quantidade), 0)

  const concluidos = assessments.filter((item) => item.situacao === 'concluido')

  // Receita estimada: cada compra é casada com o pacote de mesmo
  // tamanho. Quando não há pacote correspondente, fica de fora.
  const receita = transacoes
    .filter((transacao) => transacao.tipo === 'compra')
    .reduce((soma, transacao) => {
      const pacote = pacotesCreditos.find((item) => item.creditos === transacao.quantidade)
      return soma + (pacote?.preco ?? 0)
    }, 0)

  return {
    facilitadoresAtivos: ativos.length,
    facilitadoresTotal: facilitadores.length,
    creditosVendidos,
    creditosUsados,
    creditosEmCarteira: facilitadores.reduce((soma, item) => soma + item.creditos, 0),
    assessmentsTotal: assessments.length,
    assessmentsConcluidos: concluidos.length,
    receita,
  }
}

/** Taxa de conclusão dos assessments enviados, em percentual. */
export function taxaConclusao(assessments: Assessment[]): number {
  if (assessments.length === 0) return 0
  const concluidos = assessments.filter((item) => item.situacao === 'concluido').length
  return Math.round((concluidos / assessments.length) * 100)
}
