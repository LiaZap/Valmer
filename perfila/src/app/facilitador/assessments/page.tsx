'use client'

import { TabelaAssessments } from '@/components/assessments/TabelaAssessments'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { FilterBar, TableFooter, tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { assessmentsDe, facilitadorAtual } from '@/data/facilitadores'

export default function AssessmentsFacilitadorPage() {
  const { toast } = useToast()
  const meus = assessmentsDe(facilitadorAtual.id)
  const aguardando = meus.filter((item) => item.situacao !== 'concluido').length

  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle={`${meus.length} enviados · ${aguardando} aguardando resposta · ${facilitadorAtual.creditos} créditos disponíveis`}
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

      <Card padding="none" scrollX>
        <FilterBar>
          <Field label="Avaliado" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} placeholder="Nome ou e-mail" />}
          </Field>
          <Field label="Situação" className={tableStyles.filterMd}>
            {(id) => (
              <Select
                id={id}
                label="Situação"
                options={['Todas', 'Aguardando resposta', 'Em andamento', 'Concluído', 'Expirado']}
              />
            )}
          </Field>
          <Button variant="dark" size="lg" onClick={() => toast('Filtro aplicado')}>
            Pesquisar
          </Button>
        </FilterBar>

        <TabelaAssessments itens={meus} />

        <TableFooter>Total: {meus.length}</TableFooter>
      </Card>
    </>
  )
}
