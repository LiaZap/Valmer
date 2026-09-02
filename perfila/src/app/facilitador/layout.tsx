import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { facilitadorAtual } from '@/data/facilitadores'
import { BASE_FACILITADOR, NAV_FACILITADOR } from '@/lib/routes'

export const metadata: Metadata = {
  title: 'Perfila · Portal do Parceiro',
}

/** Ambiente do facilitador: quem compra créditos e avalia pessoas. */
export default function FacilitadorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      grupos={NAV_FACILITADOR}
      base={BASE_FACILITADOR}
      subtitulo="Portal do Parceiro"
      raiz="Parceiro"
      buscaPlaceholder="Buscar avaliado, campanha…"
      usuario={{
        nome: facilitadorAtual.nome.split(' ').slice(0, 2).join(' '),
        iniciais: facilitadorAtual.iniciais,
        resumo: `${facilitadorAtual.empresa} · ${facilitadorAtual.creditos} créditos`,
      }}
    >
      {children}
    </AppShell>
  )
}
