'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
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
import { assessmentsDe, facilitadores } from '@/data/facilitadores'
import ui from '@/styles/common.module.css'

export default function FacilitadoresPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Facilitadores"
        subtitle="Parceiros e empresas que compram créditos e aplicam assessments."
        actions={
          <>
            <Button icon={<Icon name="download" />} onClick={() => toast('Exportação iniciada')}>
              Exportar
            </Button>
            <Button href="/admin/facilitadores/novo" variant="primary" icon={<Icon name="plus" />}>
              Novo facilitador
            </Button>
          </>
        }
      />

      <Card padding="none" scrollX>
        <FilterBar>
          <Field label="Nome ou empresa" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} placeholder="Buscar" />}
          </Field>
          <Field label="E-mail" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} type="email" placeholder="E-mail" />}
          </Field>
          <Button variant="dark" size="lg" onClick={() => toast('Filtro aplicado')}>
            Pesquisar
          </Button>
        </FilterBar>

        <Table>
          <thead>
            <tr>
              <Th>Parceiro</Th>
              <Th>Empresa</Th>
              <Th align="right">Saldo</Th>
              <Th align="right">Assessments</Th>
              <Th>Criado em</Th>
              <Th>Situação</Th>
              <Th align="right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {facilitadores.map((facilitador) => (
              <Tr key={facilitador.id}>
                <Td dense>
                  <div className={ui.pessoa}>
                    <Avatar>{facilitador.iniciais}</Avatar>
                    <div>
                      <div className={ui.pessoaNome}>{facilitador.nome}</div>
                      <div className={ui.pessoaEmail}>{facilitador.email}</div>
                    </div>
                  </div>
                </Td>
                <Td dense muted>
                  {facilitador.empresa}
                </Td>
                <Td dense align="right">
                  {facilitador.creditos}
                </Td>
                <Td dense align="right" muted>
                  {assessmentsDe(facilitador.id).length}
                </Td>
                <Td dense muted>
                  {facilitador.criadoEm}
                </Td>
                <Td dense>
                  <Pill tone={facilitador.ativo ? 'success' : 'neutral'} dot>
                    {facilitador.ativo ? 'Ativo' : 'Inativo'}
                  </Pill>
                </Td>
                <Td dense align="right">
                  <RowActions>
                    <IconButton
                      icon="card"
                      label={`Vender créditos para ${facilitador.nome}`}
                      onClick={() => toast('Abrindo venda de créditos')}
                    />
                    <IconButton
                      icon="mail"
                      label={`Reenviar acesso para ${facilitador.nome}`}
                      onClick={() => toast('Acesso reenviado por e-mail')}
                    />
                    <IconButton
                      icon="edit"
                      label={`Editar ${facilitador.nome}`}
                      onClick={() => toast('Abrindo edição')}
                    />
                    <IconButton
                      icon={facilitador.ativo ? 'trash' : 'check'}
                      label={
                        facilitador.ativo
                          ? `Desativar ${facilitador.nome}`
                          : `Ativar ${facilitador.nome}`
                      }
                      tone={facilitador.ativo ? 'danger' : 'default'}
                      onClick={() =>
                        toast(facilitador.ativo ? 'Facilitador desativado' : 'Facilitador ativado')
                      }
                    />
                  </RowActions>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>

        <TableFooter>Total: {facilitadores.length}</TableFooter>
      </Card>
    </>
  )
}
