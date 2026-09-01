import type { Metadata, Viewport } from 'next'
import { Figtree, Sora } from 'next/font/google'
import { AppShell } from '@/components/layout/AppShell'
import './globals.css'

/**
 * Tipografia do sistema.
 * Sora dá personalidade aos títulos; Figtree mantém o texto legível
 * em tamanhos pequenos (tabelas, labels). As variáveis CSS geradas
 * aqui são consumidas pelos tokens em `styles/tokens.css`.
 */
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-figtree',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Perfila · Portal do Analista',
  description:
    'Plataforma de análise comportamental: campanhas, DNA organizacional, devolutivas e clientes.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f5f3ef',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${figtree.variable} ${sora.variable}`}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
