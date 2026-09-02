'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { PageHeader } from '@/components/ui/PageHeader'
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
import { cargos } from '@/data/cargos'

export default function ArquiteturaPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Arquitetura de Cargos"
        subtitle="Defina o perfil comportamental ideal para cada cargo e compare com candidatos."
        actions={
          <Button variant="primary" icon={<Icon name="plus" />} onClick={() => toast('Adicionado')}>
            Adicionar cargo
          </Button>
        }
      />

      <Card padding="none" scrollX>
        <FilterBar>
          <Field label="Nome" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} placeholder="Buscar por cargo" />}
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
              <Th>Cargo</Th>
              <Th>Criado por</Th>
              <Th>Criado em</Th>
              <Th align="right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {cargos.map((cargo) => (
              <Tr key={cargo.id}>
                <Td>
                  <span className={tableStyles.primary}>{cargo.name}</span>
                </Td>
                <Td muted>{cargo.by}</Td>
                <Td muted>{cargo.date}</Td>
                <Td align="right">
                  <RowActions>
                    <IconButton
                      icon="download"
                      label="Baixar"
                      onClick={() => toast('Download do PDF iniciado')}
                    />
                    <IconButton
                      icon="edit"
                      label="Alterar"
                      onClick={() => toast('Abrindo edição')}
                    />
                    <IconButton icon="copy" label="Duplicar" onClick={() => toast('Duplicado')} />
                    <IconButton
                      icon="trash"
                      label="Remover"
                      tone="danger"
                      onClick={() => toast('Item removido')}
                    />
                  </RowActions>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        <TableFooter>Total: {cargos.length}</TableFooter>
      </Card>
    </>
  )
}
