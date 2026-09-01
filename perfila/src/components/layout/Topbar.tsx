'use client'

import { usePathname } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { SearchInput } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { usuario, usuarioResumo } from '@/data/usuario'
import { resolveBreadcrumb } from '@/lib/routes'
import styles from './Topbar.module.css'

/**
 * Topbar
 * ------
 * Barra fixa com o caminho da tela atual, busca global e o menu do
 * analista. O breadcrumb é derivado da URL — nenhuma página precisa
 * declarar seu próprio título.
 */
export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const pathname = usePathname()
  const { title, sub } = resolveBreadcrumb(pathname)

  return (
    <header className={styles.topbar}>
      <IconButton
        icon="menu"
        label="Recolher menu"
        variant="topbar"
        onClick={onToggleSidebar}
      />

      <nav className={styles.breadcrumb} aria-label="Trilha de navegação">
        <span>{usuario.papel}</span>
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
        placeholder="Buscar cliente, campanha…"
        rounded
        className={styles.search}
        aria-label="Buscar cliente ou campanha"
      />

      <div className={styles.user}>
        <button type="button" className={styles.userButton}>
          <Avatar size="md" tone="ink">
            {usuario.iniciais}
          </Avatar>
          <span className={styles.userText}>
            <span className={styles.userName}>{usuario.nome}</span>
            <span className={styles.userMeta}>{usuarioResumo}</span>
          </span>
          <span className={styles.chevron}>
            <Icon name="chevD" size={16} />
          </span>
        </button>
      </div>
    </header>
  )
}
