import { notFound } from 'next/navigation'
import { obter } from '@/lib/actions/facilitadores'
import { FormFacilitador } from './FormFacilitador'

/**
 * Editar parceiro.
 *
 * Server Component: a leitura acontece aqui, e a linha inteira chega ao
 * formulário — inclusive `updated_at`, que volta na gravação como trava
 * otimista. Sem ele, duas abas abertas no mesmo parceiro sobrescreveriam uma à
 * outra em silêncio.
 *
 * `obter` devolve nulo para id que não é uuid, para parceiro excluído e para
 * quem não é facilitador: os três casos são 404, e não erro de banco na tela.
 */
export default async function EditarFacilitadorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const parceiro = await obter(id)

  if (!parceiro) notFound()

  return (
    <FormFacilitador
      id={parceiro.id}
      nome={parceiro.nome}
      email={parceiro.email}
      empresa={parceiro.empresa ?? ''}
      telefone={parceiro.telefone ?? ''}
      ativo={parceiro.ativo}
      creditos={parceiro.creditos}
      atualizadoEm={parceiro.updated_at}
    />
  )
}
