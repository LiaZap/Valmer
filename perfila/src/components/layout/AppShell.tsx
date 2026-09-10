'use client'

import { useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import type { NavGroup } from '@/lib/routes'
import { Sidebar } from './Sidebar'
import { Topbar, type UsuarioTopbar } from './Topbar'
import styles from './AppShell.module.css'

/** Versão exibida no rodapé. */
const VERSAO = 'v2.0.0'

type AppShellProps = {
  children: ReactNode
  grupos: NavGroup[]
  /** Raiz do ambiente: `/admin` ou `/facilitador`. */
  base: string
  /** Linha sob a marca na sidebar. */
  subtitulo: string
  /** Primeiro nível do breadcrumb. */
  raiz: string
  usuario: UsuarioTopbar
  buscaPlaceholder: string
  /** Destino do menu do nome na barra superior. */
  perfilHref?: string
}

/**
 * AppShell
 * --------
 * Moldura dos ambientes com login: sidebar, barra superior, área de
 * conteúdo e rodapé. Também instala o provedor de toasts, para que
 * qualquer página confirme uma ação com uma linha de código.
 *
 * Admin e facilitador usam a mesma moldura de propósito: quem
 * administra a plataforma também opera nela, e alternar entre os
 * dois não deveria exigir reaprender a interface.
 */
export function AppShell({
  children,
  grupos,
  base,
  subtitulo,
  raiz,
  usuario,
  buscaPlaceholder,
  perfilHref,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ToastProvider>
      <div className={styles.shell}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((current) => !current)}
          grupos={grupos}
          base={base}
          subtitulo={subtitulo}
        />

        <main className={styles.main}>
          <Topbar
            grupos={grupos}
            base={base}
            raiz={raiz}
            usuario={usuario}
            buscaPlaceholder={buscaPlaceholder}
            perfilHref={perfilHref}
          />

          <div className={styles.content}>{children}</div>

          <footer className={styles.footer}>
            <span>© {new Date().getFullYear()} Impacto Academy</span>
            <span>{VERSAO}</span>
          </footer>
        </main>
      </div>
    </ToastProvider>
  )
}
