/**
 * Tipos de relatório e pacotes de crédito
 * ---------------------------------------
 * Valores da especificação. O facilitador gasta créditos por
 * assessment; o admin vende os créditos em pacotes.
 */

export type CodigoRelatorio = 'S1' | 'S2' | 'S3' | 'S4'

export type TipoRelatorio = {
  codigo: CodigoRelatorio
  nome: string
  /** Quantos créditos o assessment consome. */
  creditos: number
  /** O que entra além do nível anterior. */
  conteudo: string
  /** Faixa sugerida de revenda ao cliente final, em reais. */
  revendaMin: number
  revendaMax: number
}

export const tiposRelatorio: TipoRelatorio[] = [
  {
    codigo: 'S1',
    nome: 'Perfil Essencial',
    creditos: 1,
    conteudo: 'DISC + narrativa por IA básica + encaixe de cargos',
    revendaMin: 97,
    revendaMax: 147,
  },
  {
    codigo: 'S2',
    nome: 'Perfil Completo',
    creditos: 2,
    conteudo: 'S1 + estilo de liderança + como gerir este perfil',
    revendaMin: 147,
    revendaMax: 197,
  },
  {
    codigo: 'S3',
    nome: 'Perfil Executivo',
    creditos: 3,
    conteudo: 'S2 + Plano de Desenvolvimento Individual (PDI)',
    revendaMin: 197,
    revendaMax: 297,
  },
  {
    codigo: 'S4',
    nome: 'Perfil Estratégico',
    creditos: 4,
    conteudo: 'S3 + dashboard online do avaliado + histórico de evolução',
    revendaMin: 297,
    revendaMax: 497,
  },
]

export function getTipoRelatorio(codigo: CodigoRelatorio): TipoRelatorio {
  return tiposRelatorio.find((tipo) => tipo.codigo === codigo)!
}

export type PacoteCreditos = {
  nome: string
  creditos: number
  /** Preço do pacote, em reais. */
  preco: number
  publico: string
}

export const pacotesCreditos: PacoteCreditos[] = [
  {
    nome: 'Starter',
    creditos: 10,
    preco: 290,
    publico: 'Consultores iniciando, testando a ferramenta',
  },
  { nome: 'Pro', creditos: 50, preco: 990, publico: 'Consultores ativos, empresas médias' },
  {
    nome: 'Business',
    creditos: 100,
    preco: 1790,
    publico: 'Consultorias de RH, empresas maiores',
  },
  {
    nome: 'Enterprise',
    creditos: 500,
    preco: 6990,
    publico: 'Grandes empresas, contratos anuais',
  },
]

/** Custo por crédito, derivado do pacote — nunca digitado à mão. */
export function custoPorCredito(pacote: PacoteCreditos): number {
  return pacote.preco / pacote.creditos
}

const REAL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 2,
})

export function moeda(valor: number): string {
  return REAL.format(valor)
}
