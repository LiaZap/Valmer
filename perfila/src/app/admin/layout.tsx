import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { BASE_ADMIN, NAV_ADMIN } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Perfila · Administração',
}

/**
 * Ambiente do administrador — único, do dono da plataforma.
 * Aqui se criam facilitadores, vendem-se créditos e se edita o banco
 * de questões.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      grupos={NAV_ADMIN}
      base={BASE_ADMIN}
      subtitulo="Administração"
      raiz="Admin"
      buscaPlaceholder="Buscar facilitador, avaliado…"
      usuario={{
        nome: 'Valmer Albuquerque',
        iniciais: 'VA',
        resumo: 'Administrador da plataforma',
      }}
    >
      {children}
    </AppShell>
  )
}
