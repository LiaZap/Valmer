import { BotaoAviso } from '@/components/ui/BotaoAviso'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { assessmentsVisiveis, listarFacilitadores } from '@/lib/painel'
import { ListaFacilitadores } from './ListaFacilitadores'

/**
 * Parceiros da plataforma.
 *
 * Server Component: as duas leituras acontecem aqui. A contagem por parceiro
 * sai de uma passada sobre a lista que já veio — uma consulta de contagem por
 * linha da tabela seria uma ida ao banco por parceiro exibido.
 */
export default async function FacilitadoresPage() {
  const [facilitadores, assessments] = await Promise.all([
    listarFacilitadores(),
    assessmentsVisiveis(),
  ])

  const assessmentsPorFacilitador: Record<string, number> = {}
  for (const assessment of assessments) {
    assessmentsPorFacilitador[assessment.facilitadorId] =
      (assessmentsPorFacilitador[assessment.facilitadorId] ?? 0) + 1
  }

  return (
    <>
      <PageHeader
        title="Facilitadores"
        subtitle="Parceiros e empresas que compram créditos e aplicam assessments."
        actions={
          <>
            <BotaoAviso icon={<Icon name="download" />} aviso="Exportação iniciada">
              Exportar
            </BotaoAviso>
            <Button href="/admin/facilitadores/novo" variant="primary" icon={<Icon name="plus" />}>
              Novo facilitador
            </Button>
          </>
        }
      />

      <ListaFacilitadores
        itens={facilitadores}
        assessmentsPorFacilitador={assessmentsPorFacilitador}
      />
    </>
  )
}
