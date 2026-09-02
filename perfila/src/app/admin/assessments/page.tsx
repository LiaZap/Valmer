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
import { assessments } from '@/data/facilitadores'
import { metricasPlataforma } from '@/lib/metricas'

export default function AssessmentsAdminPage() {
  const { toast } = useToast()
  const m = metricasPlataforma()

  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle={`${m.assessmentsTotal} enviados · ${m.assessmentsConcluidos} concluídos`}
        actions={
          <Button icon={<Icon name="download" />} onClick={() => toast('Exportação iniciada')}>
            Exportar
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
          <Field label="Relatório" className={tableStyles.filterMd}>
            {(id) => <Select id={id} label="Relatório" options={['Todos', 'S1', 'S2', 'S3', 'S4']} />}
          </Field>
          <Button variant="dark" size="lg" onClick={() => toast('Filtro aplicado')}>
            Pesquisar
          </Button>
        </FilterBar>

        <TabelaAssessments itens={assessments} mostrarFacilitador />

        <TableFooter>Total: {assessments.length}</TableFooter>
      </Card>
    </>
  )
}
