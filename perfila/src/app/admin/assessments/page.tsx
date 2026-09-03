import { BotaoAviso } from '@/components/ui/BotaoAviso'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { assessmentsVisiveis, empresasPorId } from '@/lib/painel'
import { ListaAssessments } from './ListaAssessments'

/**
 * Assessments de todos os parceiros.
 *
 * Server Component: a consulta acontece aqui e os filtros ficam no componente
 * cliente ao lado. O admin vê tudo porque `assessmentsVisiveis()` já decide o
 * recorte pelo papel da sessão — esta tela não repete a regra, senão existiriam
 * dois lugares para errá-la.
 *
 * Os nomes dos parceiros vêm numa consulta só, pelos ids que apareceram na
 * lista: buscar um por linha renderia uma consulta por assessment exibido.
 */
export default async function AssessmentsAdminPage() {
  const itens = await assessmentsVisiveis()
  const empresas = await empresasPorId([...new Set(itens.map((item) => item.facilitadorId))])

  const concluidos = itens.filter((item) => item.situacao === 'concluido').length

  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle={`${itens.length} enviados · ${concluidos} concluídos`}
        actions={
          <BotaoAviso icon={<Icon name="download" />} aviso="Exportação iniciada">
            Exportar
          </BotaoAviso>
        }
      />

      <ListaAssessments itens={itens} empresas={empresas} />
    </>
  )
}
