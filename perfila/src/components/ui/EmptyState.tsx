import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

type EmptyStateProps = {
  children: ReactNode
  /** `dashed` sinaliza uma área que ainda vai receber conteúdo. */
  variant?: 'plain' | 'dashed'
}

/** Mensagem de lista vazia, sempre em tom discreto e centralizada. */
export function EmptyState({ children, variant = 'plain' }: EmptyStateProps) {
  return <div className={[styles.empty, styles[variant]].join(' ')}>{children}</div>
}
