/**
 * Métricas da plataforma
 * ----------------------
 * Tudo é derivado dos dados, nunca digitado. Assim os números do
 * painel não podem divergir das listas que os originam.
 */

import { assessments, facilitadores, transacoes } from '@/data/facilitadores'
import { pacotesCreditos } from '@/data/planos'

export function metricasPlataforma() {
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
export function taxaConclusao(): number {
  if (assessments.length === 0) return 0
  const concluidos = assessments.filter((item) => item.situacao === 'concluido').length
  return Math.round((concluidos / assessments.length) * 100)
}
