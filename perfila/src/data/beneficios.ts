/** Programa de Benefícios — categorias e a matriz de vantagens. */

export type Categoria = {
  name: string
  /** Regra para alcançar a categoria. */
  rule: string
  bg: string
  fg: string
  sub: string
}

export const categorias: Categoria[] = [
  {
    name: 'Membro',
    rule: '0 créditos comprados ou 0 utilizados',
    bg: 'var(--color-bg)',
    fg: 'var(--color-text)',
    sub: 'var(--color-text-muted)',
  },
  {
    name: 'Gold',
    rule: '120 comprados ou 80 utilizados',
    bg: 'var(--color-warning-tint)',
    fg: 'var(--color-warning-text)',
    sub: 'var(--color-warning)',
  },
  {
    name: 'Platinum',
    rule: '300 comprados ou 150 utilizados',
    bg: 'var(--color-border-soft)',
    fg: 'var(--color-text)',
    sub: 'var(--color-text-muted)',
  },
  {
    name: 'Diamond',
    rule: '800 comprados ou 500 utilizados',
    bg: 'var(--color-info-tint)',
    fg: 'var(--color-info)',
    sub: 'var(--color-info-soft)',
  },
  {
    name: 'Black',
    rule: '1800 comprados ou 1200 utilizados',
    bg: 'var(--color-ink)',
    fg: 'var(--color-on-ink)',
    sub: 'var(--color-on-ink-65)',
  },
]

/**
 * Valor de uma célula da matriz:
 * "yes" = incluído (check), "no" = não incluído (traço),
 * qualquer outro texto é exibido como está (ex.: "25%").
 */
export type ValorBeneficio = 'yes' | 'no' | (string & {})

export type Beneficio = {
  name: string
  /** Um valor por categoria, na mesma ordem de `categorias`. */
  cells: ValorBeneficio[]
}

export const beneficios: Beneficio[] = [
  { name: 'Créditos (unidade)', cells: ['no', 'no', 'no', 'no', 'no'] },
  { name: 'Assinatura White Label', cells: ['no', '15%', '25%', '40%', '50%'] },
  {
    name: 'Formação em Analista de Percepção Infantil (Mini Mega Assessment)',
    cells: ['no', '15%', '25%', '50%', 'yes'],
  },
  { name: 'Formação em Coaching de Carreira (FCC)', cells: ['no', '15%', '25%', '50%', 'yes'] },
  { name: 'Jornada do Coach de Carreira', cells: ['no', '15%', '25%', '50%', 'yes'] },
  { name: 'Grupo WhatsApp exclusivo', cells: ['no', 'yes', 'yes', 'yes', 'yes'] },
]

/** Situação do analista dentro do programa. */
export const situacaoPrograma = {
  categoria: 'Membro',
  proximaCategoria: 'Gold',
  expiraEm: '06/01/2027',
  cicloIniciadoEm: '06/01/2026',
  utilizados: { atual: 71, meta: 80 },
  comprados: { atual: 52, meta: 120 },
}

export const faltamParaGold = {
  utilizados: situacaoPrograma.utilizados.meta - situacaoPrograma.utilizados.atual,
  comprados: situacaoPrograma.comprados.meta - situacaoPrograma.comprados.atual,
}
