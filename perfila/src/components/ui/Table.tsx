import type { CSSProperties, ReactNode } from 'react'
import styles from './Table.module.css'

export { styles as tableStyles }

type Align = 'left' | 'right' | 'center'

const ALIGN_CLASS: Record<Align, string | null> = {
  left: null,
  right: styles.alignRight,
  center: styles.alignCenter,
}

/**
 * Tabela de dados do sistema.
 * O card em volta é quem rola horizontalmente (`<Card scrollX>`),
 * então a página nunca ganha barra horizontal.
 */
export function Table({ children }: { children: ReactNode }) {
  return <table className={styles.table}>{children}</table>
}

export function Th({
  children,
  align = 'left',
  style,
}: {
  children?: ReactNode
  align?: Align
  /** Larguras de coluna (min-width / width) quando necessário. */
  style?: CSSProperties
}) {
  return (
    <th scope="col" className={[styles.th, ALIGN_CLASS[align]].filter(Boolean).join(' ')} style={style}>
      {children}
    </th>
  )
}

export function Td({
  children,
  align = 'left',
  dense,
  muted,
  className,
}: {
  children?: ReactNode
  align?: Align
  /** Reduz o espaçamento vertical (linhas com avatar). */
  dense?: boolean
  /** Texto secundário em cinza. */
  muted?: boolean
  className?: string
}) {
  return (
    <td
      className={[
        styles.td,
        ALIGN_CLASS[align],
        dense ? styles.dense : null,
        muted ? styles.muted : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </td>
  )
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className={styles.row}>{children}</tr>
}

/** Agrupa os botões de ação no fim da linha. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}

/** Barra de filtros acima da tabela. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className={styles.filters}>{children}</div>
}

/** Rodapé com contagem e, opcionalmente, paginação. */
export function TableFooter({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className={styles.footer}>
      <span>{children}</span>
      {actions ? <div className={styles.pagination}>{actions}</div> : null}
    </div>
  )
}
