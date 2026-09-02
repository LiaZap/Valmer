import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'

export const metadata: Metadata = {
  title: 'Perfila · Portal do Analista',
}

/** Moldura do portal do analista: sidebar, barra superior e rodapé. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
