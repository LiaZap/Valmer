import type { CSSProperties, ReactNode } from 'react'

/**
 * Auxiliares de layout
 * --------------------
 * Grades e pilhas aparecem em todas as telas com pequenas variações
 * de medida. Em vez de dezenas de classes quase iguais, o valor entra
 * como propriedade — o padrão de composição continua único.
 */

type AutoGridProps = {
  children: ReactNode
  /** Largura mínima de cada coluna, em px. */
  min: number
  /** Largura máxima da coluna. `1fr` ocupa o espaço livre. */
  max?: string
  gap?: number
  /** `auto-fill` mantém colunas vazias; `auto-fit` (padrão) as recolhe. */
  fill?: boolean
  /** Alinha os cards ao topo quando têm alturas diferentes. */
  alignStart?: boolean
  className?: string
}

export function AutoGrid({
  children,
  min,
  max = '1fr',
  gap = 16,
  fill,
  alignStart,
  className,
}: AutoGridProps) {
  const style: CSSProperties = {
    display: 'grid',
    // O `min()` é o que faz a coluna caber no telefone. `minmax(320px, 1fr)`
    // desenha uma coluna de 320px mesmo dentro de um container de 288px, e aí a
    // PÁGINA inteira ganha rolagem lateral — o defeito que a quebra de 720px
    // existe para eliminar. Com o `min()`, o piso passa a ser "320px, ou a
    // largura disponível, o que for menor", e a grade vira uma coluna sozinha,
    // sem `@media` em nenhuma das quinze telas que usam isto.
    gridTemplateColumns: `repeat(${fill ? 'auto-fill' : 'auto-fit'}, minmax(min(${min}px, 100%), ${max}))`,
    gap,
    alignItems: alignStart ? 'start' : undefined,
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}

/** Empilha elementos na vertical com espaçamento constante. */
export function Stack({
  children,
  gap = 12,
  className,
}: {
  children: ReactNode
  gap?: number
  className?: string
}) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap }}>
      {children}
    </div>
  )
}

/** Alinha elementos na horizontal. */
export function Row({
  children,
  gap = 8,
  align = 'center',
  justify,
  wrap,
  className,
}: {
  children: ReactNode
  gap?: number
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
  wrap?: boolean
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : undefined,
        gap,
      }}
    >
      {children}
    </div>
  )
}
