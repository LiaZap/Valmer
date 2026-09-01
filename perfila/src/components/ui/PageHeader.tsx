import Link from 'next/link'
import type { ReactNode } from 'react'
import { Icon } from './Icon'
import styles from './PageHeader.module.css'

type PageHeaderProps = {
  title: string
  subtitle?: ReactNode
  /** Botões alinhados à direita do título. */
  actions?: ReactNode
}

/**
 * PageHeader
 * ----------
 * Abre toda tela: H1 em Sora, linha de contexto e as ações da tela.
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  )
}

/** Link de retorno exibido acima do título nas telas de detalhe. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={styles.back}>
      <Icon name="chevL" size={16} />
      {children}
    </Link>
  )
}
