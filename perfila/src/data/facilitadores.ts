/**
 * Facilitadores e assessments
 * ---------------------------
 * Espelha as tabelas `users`, `assessments` e `credit_transactions`
 * da especificação, com dados de exemplo.
 */

import { initials } from '@/lib/text'
import type { FatorDisc } from './dna'
import type { CodigoRelatorio } from './planos'

export type Facilitador = {
  id: string
  nome: string
  email: string
  empresa: string
  /** Saldo de créditos disponível. */
  creditos: number
  ativo: boolean
  criadoEm: string
  iniciais: string
}

const base: Omit<Facilitador, 'iniciais'>[] = [
  {
    id: 'valmer',
    nome: 'Valmer Albuquerque dos Santos',
    email: 'valmersantos1@gmail.com',
    empresa: 'Impacto Academy',
    creditos: 182,
    ativo: true,
    criadoEm: '06/01/2026',
  },
  {
    id: 'juliana-rocha',
    nome: 'Juliana Rocha',
    email: 'juliana@rhconsult.com.br',
    empresa: 'RH Consult',
    creditos: 34,
    ativo: true,
    criadoEm: '18/03/2026',
  },
  {
    id: 'marcos-tavares',
    nome: 'Marcos Tavares',
    email: 'marcos@grupotavares.com',
    empresa: 'Grupo Tavares',
    creditos: 7,
    ativo: true,
    criadoEm: '02/05/2026',
  },
  {
    id: 'dani-pires',
    nome: 'Dani Pires',
    email: 'dani@danipires.com.br',
    empresa: 'Dani Pires Consultoria',
    creditos: 0,
    ativo: false,
    criadoEm: '21/07/2026',
  },
]

export const facilitadores: Facilitador[] = base.map((item) => ({
  ...item,
  iniciais: initials(item.nome),
}))

/** Facilitador logado no ambiente do parceiro. */
export const facilitadorAtual = facilitadores[0]!

export type SituacaoAssessment = 'pendente' | 'em_andamento' | 'concluido' | 'expirado'

export type Assessment = {
  id: string
  token: string
  facilitadorId: string
  avaliadoNome: string
  avaliadoEmail: string
  tipoRelatorio: CodigoRelatorio
  situacao: SituacaoAssessment
  creditosUsados: number
  criadoEm: string
  expiraEm: string
  concluidoEm?: string
  /** Perfil combinado, quando já calculado. */
  perfil?: string
  /**
   * Quantas das 28 respostas caíram em cada fator. Somam 28, então os
   * percentuais derivados somam 100 — é assim que o instrumento novo
   * funciona, e é isso que o relatório afirma ao leitor.
   *
   * Guardar os contadores em vez do perfil pronto evita que a lista e
   * o relatório discordem: os dois derivam do mesmo número.
   */
  contadores?: Record<FatorDisc, number>
}

export const assessments: Assessment[] = [
  {
    id: 'a1',
    token: 'demo',
    facilitadorId: 'valmer',
    avaliadoNome: 'Paulo V S Melo',
    avaliadoEmail: 'contatopaulonvr@gmail.com',
    tipoRelatorio: 'S2',
    situacao: 'pendente',
    creditosUsados: 2,
    criadoEm: '02/09/2026',
    expiraEm: '09/09/2026',
  },
  {
    id: 'a2',
    token: 'k3mq81',
    facilitadorId: 'valmer',
    avaliadoNome: 'Elias da Silva Maia',
    avaliadoEmail: 'elmaiasilva83@gmail.com',
    tipoRelatorio: 'S3',
    situacao: 'concluido',
    creditosUsados: 3,
    criadoEm: '28/08/2026',
    expiraEm: '04/09/2026',
    concluidoEm: '29/08/2026',
    perfil: 'ID',
    contadores: { D: 8, I: 12, S: 3, C: 5 },
  },
  {
    id: 'a3',
    token: 'p7xa20',
    facilitadorId: 'valmer',
    avaliadoNome: 'Thais da Silva Muniz',
    avaliadoEmail: 'thaismuniz83@gmail.com',
    tipoRelatorio: 'S1',
    situacao: 'em_andamento',
    creditosUsados: 1,
    criadoEm: '30/08/2026',
    expiraEm: '06/09/2026',
  },
  {
    id: 'a4',
    token: 'expirado',
    facilitadorId: 'valmer',
    avaliadoNome: 'Fernando Brambilla',
    avaliadoEmail: 'fernandobrambilla@hotmail.com',
    tipoRelatorio: 'S1',
    situacao: 'expirado',
    creditosUsados: 1,
    criadoEm: '13/08/2026',
    expiraEm: '20/08/2026',
  },
  {
    id: 'a5',
    token: 'z9bt44',
    facilitadorId: 'juliana-rocha',
    avaliadoNome: 'Antonio Rodrigues Vidal',
    avaliadoEmail: 'vidalantonio6167@gmail.com',
    tipoRelatorio: 'S4',
    situacao: 'concluido',
    creditosUsados: 4,
    criadoEm: '25/08/2026',
    expiraEm: '01/09/2026',
    concluidoEm: '26/08/2026',
    perfil: 'CS',
    contadores: { D: 4, I: 5, S: 8, C: 11 },
  },
]

export const ROTULO_SITUACAO: Record<SituacaoAssessment, string> = {
  pendente: 'Aguardando resposta',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  expirado: 'Expirado',
}

export type TipoTransacao = 'compra' | 'uso' | 'estorno' | 'bonus'

export type Transacao = {
  id: string
  facilitadorId: string
  tipo: TipoTransacao
  /** Positivo em compras e bônus, negativo em uso. */
  quantidade: number
  descricao: string
  data: string
}

export const transacoes: Transacao[] = [
  {
    id: 't1',
    facilitadorId: 'valmer',
    tipo: 'compra',
    quantidade: 100,
    descricao: 'Pacote Business',
    data: '06/01/2026',
  },
  {
    id: 't2',
    facilitadorId: 'valmer',
    tipo: 'compra',
    quantidade: 100,
    descricao: 'Pacote Business',
    data: '14/06/2026',
  },
  {
    id: 't3',
    facilitadorId: 'valmer',
    tipo: 'uso',
    quantidade: -3,
    descricao: 'Assessment S3 · Elias da Silva Maia',
    data: '28/08/2026',
  },
  {
    id: 't4',
    facilitadorId: 'valmer',
    tipo: 'uso',
    quantidade: -1,
    descricao: 'Assessment S1 · Thais da Silva Muniz',
    data: '30/08/2026',
  },
  {
    id: 't5',
    facilitadorId: 'valmer',
    tipo: 'uso',
    quantidade: -2,
    descricao: 'Assessment S2 · Paulo V S Melo',
    data: '02/09/2026',
  },
  {
    id: 't6',
    facilitadorId: 'juliana-rocha',
    tipo: 'compra',
    quantidade: 50,
    descricao: 'Pacote Pro',
    data: '18/03/2026',
  },
  {
    id: 't7',
    facilitadorId: 'marcos-tavares',
    tipo: 'compra',
    quantidade: 10,
    descricao: 'Pacote Starter',
    data: '02/05/2026',
  },
  {
    id: 't8',
    facilitadorId: 'marcos-tavares',
    tipo: 'bonus',
    quantidade: 2,
    descricao: 'Bônus de indicação',
    data: '10/05/2026',
  },
]

export function transacoesDe(facilitadorId: string): Transacao[] {
  return transacoes.filter((transacao) => transacao.facilitadorId === facilitadorId)
}

export function assessmentsDe(facilitadorId: string): Assessment[] {
  return assessments.filter((assessment) => assessment.facilitadorId === facilitadorId)
}
