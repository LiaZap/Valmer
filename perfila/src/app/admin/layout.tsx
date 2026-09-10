import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { initials } from '@/lib/text'
import { exigirSessaoNaTela } from '@/lib/auth/tela'
import { BASE_ADMIN, NAV_ADMIN } from '@/lib/routes'
import { urlAssinadaOuNula } from '@/lib/storage'

export const metadata: Metadata = {
  title: 'Impacto Academy · Administração',
}

/**
 * Ambiente do administrador — único, do dono da plataforma.
 * Aqui se criam facilitadores, vendem-se créditos e se edita o banco
 * de questões.
 *
 * A validação da sessão é aqui, e não no middleware: lá só se confere que o
 * cookie existe, porque o Edge Runtime não alcança o banco. Um facilitador
 * autenticado não pode entrar por digitar /admin na barra.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { sessao, conta } = await exigirSessaoNaTela(BASE_ADMIN)

  if (sessao.papel !== 'admin') redirect('/facilitador')

  // O banco guarda a CHAVE do objeto; a URL assinada nasce aqui, depois da
  // checagem de sessão acima, e expira em minutos. Ver `lib/storage.ts`.
  const foto = await urlAssinadaOuNula(conta.imagem)

  return (
    <AppShell
      grupos={NAV_ADMIN}
      base={BASE_ADMIN}
      subtitulo="Administração"
      raiz="Admin"
      buscaPlaceholder="Buscar facilitador, avaliado…"
      perfilHref="/admin/perfil"
      usuario={{
        nome: sessao.nome.split(' ').slice(0, 2).join(' '),
        iniciais: initials(sessao.nome),
        resumo: 'Administrador da plataforma',
        foto,
      }}
    >
      {children}
    </AppShell>
  )
}
