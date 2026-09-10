import { EmptyState } from '@/components/ui/EmptyState'
import { BackLink, PageHeader } from '@/components/ui/PageHeader'
import { listarPacotes } from '@/lib/precos'
import { FormNovoFacilitador } from './FormNovoFacilitador'

/**
 * Cadastro do parceiro.
 *
 * A casca é servidor só para ler os pacotes vigentes de `precos_pacotes` — o
 * formulário em si é cliente, em `FormNovoFacilitador`. Antes a tela inteira
 * era cliente porque os pacotes eram fixos em `src/data/planos.ts`; agora eles
 * são dado que o admin edita em /admin/precos, e a tela precisa lê-los.
 *
 * Sem nenhum pacote cadastrado o formulário não abre: não haveria o que
 * escolher, e a action recusaria a criação de qualquer forma.
 */
export default async function NovoFacilitadorPage() {
  const pacotes = await listarPacotes()

  if (pacotes.length === 0) {
    return (
      <>
        <BackLink href="/admin/facilitadores">Voltar para facilitadores</BackLink>
        <PageHeader
          title="Novo facilitador"
          subtitle="A conta é criada já com o pacote de créditos contratado."
        />
        <EmptyState>
          Nenhum pacote de crédito cadastrado. Crie um em <strong>Preços</strong> antes de cadastrar
          um parceiro.
        </EmptyState>
      </>
    )
  }

  return <FormNovoFacilitador pacotes={pacotes} />
}
