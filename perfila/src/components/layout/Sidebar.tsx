'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { logout } from '@/lib/actions/auth'
import { isNavItemActive, type NavGroup } from '@/lib/routes'
import { MarcaImpacto } from './MarcaImpacto'
import styles from './Sidebar.module.css'

type SidebarProps = {
  collapsed: boolean
  /** Recolhe e expande. Mora aqui, e nao na topbar: o controle fica junto do
      que ele controla, e no rodape ele nao disputa espaco com o caminho da
      tela. */
  onToggle: () => void
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
export function Sidebar({ collapsed, onToggle, grupos, base, subtitulo }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function sair() {
    await logout()
    router.replace('/')
    router.refresh()
  }

  return (
    <aside
      className={[styles.sidebar, collapsed ? styles.collapsed : null].filter(Boolean).join(' ')}
    >
      <Link href={base} className={styles.brand}>
        <span className={styles.brandMark}>
          {/* O escudo é dimensionado pela ALTURA da caixa menos o respiro,
              que é a regra registrada no CONTINUIDADE.md. A caixa aberta tem
              40 e a recolhida 32; 26 e 20 mantêm a mesma proporção de 0,625
              que já tinha sido medida para o quadrado de 32. */}
          <MarcaImpacto size={collapsed ? 20 : 26} cor="var(--color-marca-sobre-escuro)" />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>Impacto Academy</span>
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
        {/* Era um <Link href="/"> com um toast dizendo "Sessão encerrada".
            Ele não encerrava nada: o cookie continuava vivo, e como a tela de
            login manda quem tem sessão de volta para o painel, o clique dava
            a volta e caía no lugar de onde saiu — com a mensagem afirmando o
            contrário. Em máquina compartilhada isso é a próxima pessoa
            entrando na conta da anterior.

            Agora chama a mesma action do botão da topbar, com o
            `router.refresh()` que descarta o cache de rotas do Next: sem ele
            as telas já visitadas voltam do cache mesmo sem sessão. */}
        <button type="button" title="Sair" className={styles.logout} onClick={sair}>
          <span className={styles.itemIcon}>
            <Icon name="logout" size={16} />
          </span>
          <span className={styles.label}>Sair</span>
        </button>

        {/* A seta que recolhe. Ela era um hamburguer na topbar, longe do que
            controlava e ao lado do caminho da tela, onde parecia menu de
            navegacao. Aqui ela aponta para o lado em que a barra vai se
            mover, que e a unica dica que dispensa rotulo. */}
        <button
          type="button"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-expanded={!collapsed}
          className={styles.recolher}
          onClick={onToggle}
        >
          <span className={styles.itemIcon}>
            <Icon name={collapsed ? 'chevR' : 'chevL'} size={16} />
          </span>
          <span className={styles.label}>Recolher</span>
        </button>
      </div>
    </aside>
  )
}
