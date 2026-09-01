'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { IconButton } from '@/components/ui/IconButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Select } from '@/components/ui/Select'
import { FilterBar, RowActions, Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { TIPO_RELATORIO, devolutivas } from '@/data/devolutivas'
import { opcoes } from '@/data/opcoes'
import styles from './page.module.css'

export default function DevolutivaPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Devolutiva"
        subtitle="Sessões de feedback com os respondentes dos seus passaportes."
      />

      <Card padding="none" scrollX>
        <FilterBar>
          <Field label="Nome" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} placeholder="Nome" />}
          </Field>
          <Field label="E-mail" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} type="email" placeholder="E-mail" />}
          </Field>
          <Field label="Status" className={tableStyles.filterMd}>
            {(id) => <Select id={id} options={opcoes.status} label="Status" />}
          </Field>
          <Field label="Data inicial" className={tableStyles.filterDate}>
            {(id) => <Input id={id} placeholder="dd/mm/aaaa" inputMode="numeric" />}
          </Field>
          <Field label="Data final" className={tableStyles.filterDate}>
            {(id) => <Input id={id} placeholder="dd/mm/aaaa" inputMode="numeric" />}
          </Field>
          <Button variant="dark" size="lg" onClick={() => toast('Filtro aplicado')}>
            Pesquisar
          </Button>
        </FilterBar>

        <Table>
          <thead>
            <tr>
              <Th>Respondente</Th>
              <Th>Passaporte</Th>
              <Th>Status</Th>
              <Th>Criado em</Th>
              <Th align="right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {devolutivas.map((devolutiva) => {
              const finalizada = devolutiva.status === 'Finalizada'
              return (
                <Tr key={devolutiva.id}>
                  <Td>
                    <div className={tableStyles.primary}>{devolutiva.name}</div>
                    <div className={tableStyles.secondary}>{devolutiva.email}</div>
                  </Td>
                  <Td>
                    <div className={styles.passaporte}>{devolutiva.campanha}</div>
                    <div className={tableStyles.secondary}>{TIPO_RELATORIO}</div>
                  </Td>
                  <Td>
                    <Pill tone={finalizada ? 'success' : 'warning'} dot>
                      {devolutiva.status}
                    </Pill>
                    {devolutiva.tempo ? (
                      <div className={styles.tempo}>Tempo: {devolutiva.tempo}</div>
                    ) : null}
                  </Td>
                  <Td muted>{devolutiva.date}</Td>
                  <Td align="right">
                    <RowActions>
                      <IconButton
                        icon="eye"
                        label="Visualizar"
                        onClick={() => toast('Abrindo visualização')}
                      />
                      {finalizada ? (
                        <>
                          <IconButton
                            icon="download"
                            label="Baixar PDF"
                            onClick={() => toast('Download do PDF iniciado')}
                          />
                          <IconButton
                            icon="mail"
                            label="Enviar por e-mail"
                            onClick={() => toast('E-mail enviado')}
                          />
                        </>
                      ) : null}
                    </RowActions>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      </Card>
    </>
  )
}
