import type { ReactNode } from 'react'
import styles from './Card.module.css'

type CardProps = {
  children: ReactNode
  /** `none` para cards que embalam tabelas ou cabeçalho próprio. */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  tone?: 'default' | 'ink' | 'accent'
  /** Contém a rolagem horizontal da tabela dentro do card. */
  scrollX?: boolean
  /** Recorta o conteúdo no raio do card (capas, tabelas). */
  clip?: boolean
  className?: string
}

const PADDING_CLASS = {
  none: null,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
} as const

/**
 * Card
 * ----
 * A superfície branca sobre o fundo bege é a unidade de composição de
 * todas as telas. Três tons: padrão, escuro (destaque) e verde (aviso
 * positivo).
 */
export function Card({
  children,
  padding = 'md',
  tone = 'default',
  scrollX,
  clip,
  className,
}: CardProps) {
  const classes = [
    styles.card,
    tone !== 'default' ? styles[tone] : null,
    PADDING_CLASS[padding],
    scrollX ? styles.scrollX : null,
    clip ? styles.clip : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}

/** Faixa de título no topo de um card, com ações opcionais à direita. */
export function CardHeader({
  title,
  actions,
  className,
}: {
  title: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(' ')}>
      <div className={styles.headerTitle}>{title}</div>
      {actions ? <div className={styles.headerActions}>{actions}</div> : null}
    </div>
  )
}

/** Faixa de ações no pé de um formulário em card. */
export function CardFooter({ children }: { children: ReactNode }) {
  return <div className={styles.footer}>{children}</div>
}
