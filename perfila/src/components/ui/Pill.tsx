import type { ReactNode } from 'react'
import styles from './Pill.module.css'

type PillProps = {
  children: ReactNode
  tone?: 'neutral' | 'success' | 'warning' | 'strong' | 'onInk'
  size?: 'sm' | 'md'
  /** Ponto colorido antes do rótulo — usado em status. */
  dot?: boolean
  className?: string
}

/**
 * Pill
 * ----
 * Etiqueta arredondada para status, escopo e perfil comportamental.
 */
export function Pill({ children, tone = 'neutral', size = 'md', dot, className }: PillProps) {
  const classes = [styles.pill, styles[tone], size === 'sm' ? styles.sm : null, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={classes}>
      {dot ? <i className={styles.dot} aria-hidden /> : null}
      {children}
    </span>
  )
}
