import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { assessmentsVisiveis, contaAtual } from '@/lib/painel'
import { ListaAssessments } from './ListaAssessments'

/**
 * Assessments do facilitador, agora vindos do banco.
 *
 * Server Component: a consulta acontece aqui e a interatividade (filtros,
 * ações da linha) fica no componente cliente abaixo. Assim a lista não
 * precisa de rota de API nem de estado de carregamento.
 */
export default async function AssessmentsFacilitadorPage() {
  const [meus, conta] = await Promise.all([assessmentsVisiveis(), contaAtual()])
  const aguardando = meus.filter((item) => item.situacao !== 'concluido').length

  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle={`${meus.length} enviados · ${aguardando} aguardando resposta · ${conta.creditos} créditos disponíveis`}
        actions={
          <Button
            href="/facilitador/assessments/novo"
            variant="primary"
            icon={<Icon name="plus" />}
          >
            Novo assessment
          </Button>
        }
      />

      <ListaAssessments itens={meus} />
    </>
  )
}
