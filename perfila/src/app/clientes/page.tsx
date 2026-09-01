'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar, RowActions, Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { clientes, totalClientes } from '@/data/clientes'
import ui from '@/styles/common.module.css'

export default function ClientesPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle={`${totalClientes} clientes cadastrados`}
        actions={
          <>
            <Button
              icon={<Icon name="upload" />}
              onClick={() => toast('Selecione um arquivo .csv ou .xlsx')}
            >
              Importar
            </Button>
            <Button icon={<Icon name="download" />} onClick={() => toast('Exportação iniciada')}>
              Exportar
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="plus" />}
              onClick={() => toast('Adicionado')}
            >
              Adicionar cliente
            </Button>
          </>
        }
      />

      <Card padding="none" scrollX>
        <FilterBar>
          <Field label="Nome" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} placeholder="Nome" />}
          </Field>
          <Field label="E-mail" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} type="email" placeholder="E-mail" />}
          </Field>
          <Field label="Data inicial" className={tableStyles.filterDate}>
            {(id) => <Input id={id} placeholder="dd/mm/aaaa" inputMode="numeric" />}
          </Field>
          <Field label="Data final" className={tableStyles.filterDate}>
            {(id) => <Input id={id} placeholder="dd/mm/aaaa" inputMode="numeric" />}
          </Field>
          <Field label="Último login" className={tableStyles.filterDate}>
            {(id) => <Input id={id} placeholder="dd/mm/aaaa" inputMode="numeric" />}
          </Field>
          <Button variant="dark" size="lg" onClick={() => toast('Filtro aplicado')}>
            Pesquisar
          </Button>
        </FilterBar>

        <Table>
          <thead>
            <tr>
              <Th>Cliente</Th>
              <Th>Celular</Th>
              <Th>Último login</Th>
              <Th align="right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <Tr key={cliente.email}>
                <Td dense>
                  <div className={ui.pessoa}>
                    <Avatar>{cliente.iniciais}</Avatar>
                    <div>
                      <div className={ui.pessoaNome}>{cliente.name}</div>
                      <div className={ui.pessoaEmail}>{cliente.email}</div>
                    </div>
                  </div>
                </Td>
                <Td dense muted>
                  {cliente.celular}
                </Td>
                <Td dense muted>
                  {cliente.ultimoLogin}
                </Td>
                <Td dense align="right">
                  <RowActions>
                    <IconButton
                      icon="eye"
                      label="Detalhes"
                      onClick={() => toast('Abrindo visualização')}
                    />
                    <IconButton
                      icon="mail"
                      label="Enviar e-mail"
                      onClick={() => toast('E-mail enviado')}
                    />
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
      </Card>
    </>
  )
}
