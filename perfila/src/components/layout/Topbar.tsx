'use client'

import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { SearchInput } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { resolveBreadcrumb, type NavGroup } from '@/lib/routes'
import { BotaoSair } from './BotaoSair'
import styles from './Topbar.module.css'

export type UsuarioTopbar = {
  nome: string
  iniciais: string
  /** Linha secundária: papel, plano, saldo. */
  resumo: string
}

type TopbarProps = {
  onToggleSidebar: () => void
  grupos: NavGroup[]
  base: string
  /** Primeiro nível do breadcrumb: o ambiente. */
  raiz: string
  usuario: UsuarioTopbar
  buscaPlaceholder: string
}

/**
 * Topbar
 * ------
 * Barra fixa com o caminho da tela atual, busca e o menu do usuário.
 * O breadcrumb é derivado da URL — nenhuma página declara o próprio
 * título.
 */
export function Topbar({
  onToggleSidebar,
  grupos,
  base,
  raiz,
  usuario,
  buscaPlaceholder,
}: TopbarProps) {
  const pathname = usePathname()
  const { title, sub } = resolveBreadcrumb(pathname, grupos, base)

  return (
    <header className={styles.topbar}>
      <IconButton icon="menu" label="Recolher menu" variant="topbar" onClick={onToggleSidebar} />

      <nav className={styles.breadcrumb} aria-label="Trilha de navegação">
        <span>{raiz}</span>
        <span className={styles.separator} aria-hidden>
          /
        </span>
        <span className={styles.current}>{title}</span>
        {sub ? (
          <>
            <span className={styles.separator} aria-hidden>
              /
            </span>
            <span className={`${styles.current} ${styles.currentTruncate}`}>{sub}</span>
          </>
        ) : null}
      </nav>

      <div className={styles.spacer} />

      <SearchInput
        placeholder={buscaPlaceholder}
        rounded
        className={styles.search}
        aria-label={buscaPlaceholder}
      />

      <div className={styles.user}>
        <button type="button" className={styles.userButton}>
          <Avatar size="md" tone="ink">
            {usuario.iniciais}
          </Avatar>
          <span className={styles.userText}>
            <span className={styles.userName}>{usuario.nome}</span>
            <span className={styles.userMeta}>{usuario.resumo}</span>
          </span>
          <span className={styles.chevron}>
            <Icon name="chevD" size={16} />
          </span>
        </button>
        <BotaoSair />
      </div>
    </header>
  )
}
