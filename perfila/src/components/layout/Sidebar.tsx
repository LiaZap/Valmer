'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { isNavItemActive, type NavGroup } from '@/lib/routes'
import { LogoMark } from './Logo'
import styles from './Sidebar.module.css'

type SidebarProps = {
  collapsed: boolean
  grupos: NavGroup[]
  /** Raiz do ambiente — destino da marca e âncora do item ativo. */
  base: string
  /** Linha sob a marca, que diz em qual ambiente você está. */
  subtitulo: string
}

/**
 * Sidebar
 * -------
 * Navegação principal, agrupada por contexto de trabalho. Recolhe
 * para uma faixa de ícones — e nunca ganha rolagem própria.
 *
 * Serve aos dois ambientes com moldura: o que muda é a lista de
 * grupos e o subtítulo sob a marca.
 */
export function Sidebar({ collapsed, grupos, base, subtitulo }: SidebarProps) {
  const pathname = usePathname()
  const { toast } = useToast()

  return (
    <aside
      className={[styles.sidebar, collapsed ? styles.collapsed : null].filter(Boolean).join(' ')}
    >
      <Link href={base} className={styles.brand}>
        <span className={styles.brandMark}>
          <LogoMark />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>Perfila</span>
          <span className={styles.brandRole}>{subtitulo}</span>
        </span>
      </Link>

      <nav className={styles.nav} aria-label="Navegação principal">
        {grupos.map((group) => (
          <div className={styles.group} key={group.label}>
            <div className={styles.groupLabel}>{group.label}</div>
            {group.items.map((item) => {
              const active = isNavItemActive(item.href, pathname, base)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={[styles.item, active ? styles.itemActive : null]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className={styles.itemIcon}>
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span className={styles.label}>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <Link href="/" title="Sair" className={styles.logout} onClick={() => toast('Sessão encerrada')}>
          <span className={styles.itemIcon}>
            <Icon name="logout" size={16} />
          </span>
          <span className={styles.label}>Sair</span>
        </Link>
      </div>
    </aside>
  )
}
