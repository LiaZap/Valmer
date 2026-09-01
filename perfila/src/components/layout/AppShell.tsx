'use client'

import { useState, type ReactNode } from 'react'
import { ToastProvider } from '@/components/ui/Toast'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import styles from './AppShell.module.css'

/** Versão exibida no rodapé. */
const VERSAO = 'v1.4.5'

/**
 * AppShell
 * --------
 * Moldura de todas as telas: sidebar + barra superior + área de
 * conteúdo + rodapé. Também instala o provedor de toasts, para que
 * qualquer página possa confirmar uma ação com uma linha de código.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ToastProvider>
      <div className={styles.shell}>
        <Sidebar collapsed={collapsed} />

        <main className={styles.main}>
          <Topbar onToggleSidebar={() => setCollapsed((current) => !current)} />

          <div className={styles.content}>{children}</div>

          <footer className={styles.footer}>
            <span>© {new Date().getFullYear()} Perfila</span>
            <span>{VERSAO}</span>
          </footer>
        </main>
      </div>
    </ToastProvider>
  )
}
