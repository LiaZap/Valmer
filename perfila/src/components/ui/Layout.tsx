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
    gridTemplateColumns: `repeat(${fill ? 'auto-fill' : 'auto-fit'}, minmax(${min}px, ${max}))`,
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
