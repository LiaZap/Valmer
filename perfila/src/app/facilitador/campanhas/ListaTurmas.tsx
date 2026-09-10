'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
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
import { opcoes } from '@/data/opcoes'
import { getTipoRelatorio, type CodigoRelatorio } from '@/data/planos'
import styles from './page.module.css'

export type ItemTurma = {
  id: string
  nome: string
  tipo: CodigoRelatorio
  area: 'global' | 'pessoal' | 'profissional'
  criadaEm: string
  por: string
  total: number
  respondidos: number
  permiteDownload: boolean
}

/** Os três valores do enum, com a inicial maiúscula que a tela usa. */
const ROTULO_AREA: Record<ItemTurma['area'], string> = {
  global: 'Global',
  pessoal: 'Pessoal',
  profissional: 'Profissional',
}

/**
 * A lista em si. As linhas já vieram do servidor com o recorte por dono
 * aplicado — aqui só há a interatividade, que é o que exige o cliente.
 *
 * Os filtros continuam avisando que ainda não filtram: eles pedem busca por
 * data e por degustação, e nenhuma das duas existe no banco. Aviso honesto
 * vale mais que um filtro que esconde linha por engano.
 */
export function ListaTurmas({ itens }: { itens: ItemTurma[] }) {
  const { toast } = useToast()

  const passaportes = itens.reduce((soma, turma) => soma + turma.total, 0)

  return (
    <>
      <PageHeader
        title="Turmas"
        subtitle={`${itens.length} turmas · ${passaportes} passaportes enviados`}
        actions={
          <>
            <Button href="/api/exportar/turmas" download icon={<Icon name="download" />}>
              Exportar
            </Button>
            <Button
              icon={<Icon name="link" />}
              onClick={() => toast('Meus links ainda não disponíveis')}
            >
              Meus links
            </Button>
            <Button
              variant="danger"
              icon={<Icon name="trash" />}
              onClick={() => toast('Remover pendentes ainda não disponível')}
            >
              Remover pendentes
            </Button>
            <Button href="/facilitador/campanhas/nova" variant="primary" icon={<Icon name="plus" />}>
              Nova turma
            </Button>
          </>
        }
      />

      <Card padding="none" scrollX>
        <FilterBar>
          <Field label="Nome" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} placeholder="Buscar por nome" />}
          </Field>
          <Field label="Demonstração" className={tableStyles.filterLg}>
            {(id) => <Select id={id} options={opcoes.degustacao} label="Demonstração" />}
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
          <Button
            variant="dark"
            size="lg"
            onClick={() => toast('Busca de turmas ainda não disponível')}
          >
            Pesquisar
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => toast('Limpar filtros ainda não disponível')}
          >
            Limpar
          </Button>
        </FilterBar>

        {itens.length === 0 ? (
          <EmptyState>
            <p>
              Você ainda não tem turmas. Uma turma agrupa os passaportes enviados e define o tipo
              de relatório gerado.
            </p>
            <Button href="/facilitador/campanhas/nova" variant="primary" icon={<Icon name="plus" />}>
              Nova turma
            </Button>
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th style={{ minWidth: 240 }}>Turma</Th>
                <Th>Finalidade</Th>
                <Th>Criada em</Th>
                <Th style={{ width: 260 }}>Respostas</Th>
                <Th align="center">Download</Th>
                <Th align="right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {itens.map((turma) => {
                const pendentes = turma.total - turma.respondidos
                const completa = turma.total > 0 && pendentes === 0
                return (
                  <Tr key={turma.id}>
                    <Td>
                      <div className={tableStyles.primary}>{turma.nome}</div>
                      <div className={tableStyles.secondary}>
                        {turma.tipo} · {getTipoRelatorio(turma.tipo).nome}
                      </div>
                    </Td>
                    <Td>
                      <Pill>{ROTULO_AREA[turma.area]}</Pill>
                    </Td>
                    <Td muted>
                      <div>{turma.criadaEm}</div>
                      <div className={tableStyles.secondary}>por {turma.por}</div>
                    </Td>
                    <Td>
                      <div className={styles.respostasLabel}>
                        <span className={styles.respostasTotal}>
                          {turma.respondidos} de {turma.total} respondidos
                        </span>
                        <span className={completa ? styles.completa : styles.pendentes}>
                          {completa ? 'Completa' : `${pendentes} pendentes`}
                        </span>
                      </div>
                      {/* Turma sem passaporte tem barra vazia, e não uma
                          divisão por zero: 0 de 0 é o estado normal de uma
                          turma recém-criada, e o envio ainda não existe. */}
                      <Progress
                        value={turma.total === 0 ? 0 : (turma.respondidos / turma.total) * 100}
                        label={`Respostas de ${turma.nome}`}
                      />
                    </Td>
                    <Td align="center">
                      {turma.permiteDownload ? (
                        <span className={styles.download} title="Download liberado ao respondente">
                          <Icon name="check" />
                        </span>
                      ) : (
                        <span className={tableStyles.secondary}>—</span>
                      )}
                    </Td>
                    <Td align="right">
                      <RowActions>
                        <IconButton
                          icon="eye"
                          label="Visualizar"
                          onClick={() => toast('Visualização da turma ainda não disponível')}
                        />
                        <IconButton
                          icon="link"
                          label="Gerar link"
                          onClick={() => toast('Link da turma ainda não disponível')}
                        />
                        {/* Rotulo diferente do "Exportar" do cabecalho DE
                            PROPOSITO. Aquele baixa a lista de turmas e funciona;
                            este baixaria as respostas DESTA turma, que ainda nao
                            existem porque nada liga mapa a turma. Dois botoes com
                            o mesmo icone e o mesmo nome, um funcionando e o outro
                            nao, fazem a pessoa concluir que a exportacao e
                            intermitente. */}
                        <IconButton
                          icon="download"
                          label="Baixar respostas da turma"
                          onClick={() =>
                            toast('Respostas da turma ainda nao disponiveis: nenhum mapa e ligado a turma')
                          }
                        />
                      </RowActions>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        )}

        <TableFooter
          actions={
            <>
              <IconButton icon="chevL" label="Página anterior" variant="pager" disabled />
              <IconButton icon="chevR" label="Próxima página" variant="pager" disabled />
            </>
          }
        >
          Mostrando {itens.length} de {itens.length}
        </TableFooter>
      </Card>
    </>
  )
}
