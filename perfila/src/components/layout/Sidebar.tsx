'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { NAV_GROUPS, isNavItemActive } from '@/lib/routes'
import { LogoMark } from './Logo'
import styles from './Sidebar.module.css'

/**
 * Sidebar
 * -------
 * Navegação principal, agrupada por contexto de trabalho
 * (Operação, Conta, Aprendizado, Sistema). Recolhe para uma faixa de
 * ícones — e nunca ganha rolagem própria.
 */
export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname()
  const { toast } = useToast()

  return (
    <aside
      className={[styles.sidebar, collapsed ? styles.collapsed : null].filter(Boolean).join(' ')}
    >
      <Link href="/" className={styles.brand}>
        <span className={styles.brandMark}>
          <LogoMark />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>Perfila</span>
          <span className={styles.brandRole}>Portal do Analista</span>
        </span>
      </Link>

      <nav className={styles.nav} aria-label="Navegação principal">
        {NAV_GROUPS.map((group) => (
          <div className={styles.group} key={group.label}>
            <div className={styles.groupLabel}>{group.label}</div>
            {group.items.map((item) => {
              const active = isNavItemActive(item.href, pathname)
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
        <button
          type="button"
          title="Sair"
          className={styles.logout}
          onClick={() => toast('Sessão encerrada (protótipo)')}
        >
          <span className={styles.itemIcon}>
            <Icon name="logout" size={16} />
          </span>
          <span className={styles.label}>Sair</span>
        </button>
      </div>
    </aside>
  )
}
