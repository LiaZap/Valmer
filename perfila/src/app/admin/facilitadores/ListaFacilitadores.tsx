'use client'

import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
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
import type { Facilitador } from '@/data/facilitadores'
import ui from '@/styles/common.module.css'

/**
 * Tabela de parceiros, com busca no cliente.
 *
 * As linhas já vieram do servidor; os filtros só escondem o que está na tela.
 * A contagem de assessments chega pronta por parceiro — contar aqui exigiria
 * carregar todos os assessments da plataforma dentro do navegador só para
 * exibir um número por linha.
 */
export function ListaFacilitadores({
  itens,
  assessmentsPorFacilitador,
}: {
  itens: Facilitador[]
  assessmentsPorFacilitador: Record<string, number>
}) {
  const { toast } = useToast()
  const [busca, setBusca] = useState('')
  const [email, setEmail] = useState('')

  function limpar() {
    setBusca('')
    setEmail('')
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const termoEmail = email.trim().toLowerCase()

    return itens.filter((facilitador) => {
      const casaTermo =
        termo === '' ||
        facilitador.nome.toLowerCase().includes(termo) ||
        facilitador.empresa.toLowerCase().includes(termo)

      const casaEmail = termoEmail === '' || facilitador.email.toLowerCase().includes(termoEmail)

      return casaTermo && casaEmail
    })
  }, [itens, busca, email])

  return (
    <Card padding="none" scrollX>
      <FilterBar>
        <Field label="Nome ou empresa" className={tableStyles.filterGrow}>
          {(id) => (
            <Input
              id={id}
              placeholder="Buscar"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
            />
          )}
        </Field>
        <Field label="E-mail" className={tableStyles.filterGrow}>
          {(id) => (
            <Input
              id={id}
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
          )}
        </Field>
        <Button variant="dark" size="lg" onClick={limpar}>
          Limpar
        </Button>
      </FilterBar>

      {/* Tabela vazia é tela sem resposta. Não haver parceiro nenhum e buscar
          sem achar são situações diferentes, e a mensagem precisa dizer qual das
          duas é — senão quem olha acha que os cadastros sumiram. O cabeçalho sai
          junto com as linhas: sozinho ele só força rolagem lateral numa tela
          estreita, sem nada para rotular. */}
      {filtrados.length > 0 ? (
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
            {filtrados.map((facilitador) => (
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
                  {assessmentsPorFacilitador[facilitador.id] ?? 0}
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
      ) : itens.length === 0 ? (
        <EmptyState>
          <p>Nenhum parceiro cadastrado ainda.</p>
          <Button href="/admin/facilitadores/novo" variant="primary" icon={<Icon name="plus" />}>
            Novo facilitador
          </Button>
        </EmptyState>
      ) : (
        <EmptyState>
          <p>Nenhum parceiro corresponde à busca. Os {itens.length} cadastrados continuam aqui.</p>
          <Button variant="secondary" onClick={limpar}>
            Limpar filtros
          </Button>
        </EmptyState>
      )}

      <TableFooter>
        {filtrados.length === itens.length
          ? `Total: ${itens.length}`
          : `${filtrados.length} de ${itens.length}`}
      </TableFooter>
    </Card>
  )
}
