'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Progress } from '@/components/ui/Progress'
import { Select } from '@/components/ui/Select'
import {
  FilterBar,
  RowActions,
  Table,
  TableFooter,
  Td,
  Th,
  Tr,
  tableStyles,
} from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { campanhas, campanhasResumo } from '@/data/campanhas'
import { opcoes } from '@/data/opcoes'
import styles from './page.module.css'

export default function CampanhasPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Campanhas"
        subtitle={`${campanhasResumo.quantidade} campanhas · ${campanhasResumo.passaportes} passaportes enviados`}
        actions={
          <>
            <Button icon={<Icon name="download" />} onClick={() => toast('Exportação iniciada')}>
              Exportar
            </Button>
            <Button icon={<Icon name="link" />} onClick={() => toast('Abrindo meus links')}>
              Meus links
            </Button>
            <Button
              variant="danger"
              icon={<Icon name="trash" />}
              onClick={() => toast('Passaportes pendentes removidos')}
            >
              Remover pendentes
            </Button>
            <Button href="/facilitador/campanhas/nova" variant="primary" icon={<Icon name="plus" />}>
              Nova campanha
            </Button>
          </>
        }
      />

      <Card padding="none" scrollX>
        <FilterBar>
          <Field label="Nome" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} placeholder="Buscar por nome" />}
          </Field>
          <Field label="Degustação" className={tableStyles.filterLg}>
            {(id) => <Select id={id} options={opcoes.degustacao} label="Degustação" />}
          </Field>
          <Field label="Tipo de relatório" className={tableStyles.filterXl}>
            {(id) => (
              <Select id={id} options={opcoes.relatorioFiltro} label="Tipo de relatório" />
            )}
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
          <Button variant="ghost" size="lg" onClick={() => toast('Filtros limpos')}>
            Limpar
          </Button>
        </FilterBar>

        <Table>
          <thead>
            <tr>
              <Th style={{ minWidth: 240 }}>Campanha</Th>
              <Th>Finalidade</Th>
              <Th>Criada em</Th>
              <Th style={{ width: 260 }}>Respostas</Th>
              <Th align="center">Download</Th>
              <Th align="right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {campanhas.map((campanha) => {
              const completa = campanha.pendentes === 0
              return (
                <Tr key={campanha.id}>
                  <Td>
                    <div className={tableStyles.primary}>{campanha.name}</div>
                    <div className={tableStyles.secondary}>{campanha.type}</div>
                  </Td>
                  <Td>
                    <Pill>{campanha.scope}</Pill>
                  </Td>
                  <Td muted>
                    <div>{campanha.date}</div>
                    <div className={tableStyles.secondary}>por {campanha.by}</div>
                  </Td>
                  <Td>
                    <div className={styles.respostasLabel}>
                      <span className={styles.respostasTotal}>
                        {campanha.respondidos} de {campanha.total} respondidos
                      </span>
                      <span className={completa ? styles.completa : styles.pendentes}>
                        {completa ? 'Completa' : `${campanha.pendentes} pendentes`}
                      </span>
                    </div>
                    <Progress
                      value={(campanha.respondidos / campanha.total) * 100}
                      label={`Respostas de ${campanha.name}`}
                    />
                  </Td>
                  <Td align="center">
                    <span className={styles.download} title="Relatório disponível">
                      <Icon name="check" />
                    </span>
                  </Td>
                  <Td align="right">
                    <RowActions>
                      <IconButton
                        icon="eye"
                        label="Visualizar"
                        onClick={() => toast('Abrindo visualização')}
                      />
                      <IconButton
                        icon="link"
                        label="Gerar link"
                        onClick={() => toast('Link copiado')}
                      />
                      <IconButton
                        icon="download"
                        label="Exportar"
                        onClick={() => toast('Exportação iniciada')}
                      />
                    </RowActions>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>

        <TableFooter
          actions={
            <>
              <IconButton icon="chevL" label="Página anterior" variant="pager" disabled />
              <IconButton icon="chevR" label="Próxima página" variant="pager" disabled />
            </>
          }
        >
          Mostrando {campanhas.length} de {campanhas.length}
        </TableFooter>
      </Card>
    </>
  )
}
