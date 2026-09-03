import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid, Stack } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Progress } from '@/components/ui/Progress'
import { Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import { Avatar } from '@/components/ui/Avatar'
import { assessmentsVisiveis, listarFacilitadores, listarTransacoes } from '@/lib/painel'
import { moeda } from '@/data/planos'
import { metricasPlataforma, taxaConclusao } from '@/lib/metricas'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

/**
 * Visão geral do dono da plataforma.
 *
 * Server Component: as três leituras acontecem aqui e alimentam as métricas.
 * São independentes entre si, então vão juntas — em sequência, a tela esperaria
 * três idas ao banco em fila para desenhar o mesmo cabeçalho.
 */
export default async function AdminPage() {
  const [facilitadores, assessments, transacoes] = await Promise.all([
    listarFacilitadores(),
    assessmentsVisiveis(),
    listarTransacoes(),
  ])

  const m = metricasPlataforma({ facilitadores, assessments, transacoes })
  const conclusao = taxaConclusao(assessments)

  const indicadores = [
    {
      label: 'Facilitadores ativos',
      icon: 'users' as const,
      valor: String(m.facilitadoresAtivos),
      nota: `${m.facilitadoresTotal} cadastrados no total`,
    },
    {
      label: 'Créditos vendidos',
      icon: 'card' as const,
      valor: String(m.creditosVendidos),
      nota: `${m.creditosEmCarteira} ainda em carteira`,
    },
    {
      label: 'Assessments',
      icon: 'file' as const,
      valor: String(m.assessmentsTotal),
      nota: `${m.assessmentsConcluidos} concluídos`,
    },
    {
      label: 'Receita de créditos',
      icon: 'dollar' as const,
      valor: moeda(m.receita),
      nota: 'Soma dos pacotes vendidos',
    },
  ]

  return (
    <>
      <PageHeader
        title="Visão geral"
        subtitle="Como a plataforma está sendo usada pelos parceiros."
        actions={
          <Button href="/admin/facilitadores/novo" variant="primary" icon={<Icon name="plus" />}>
            Novo facilitador
          </Button>
        }
      />

      <AutoGrid min={200}>
        {indicadores.map((indicador) => (
          <Card key={indicador.label}>
            <div className={styles.kpiHead}>
              {indicador.label}
              <Icon name={indicador.icon} />
            </div>
            <div className={`${ui.metricLg} ${styles.kpiValue}`}>{indicador.valor}</div>
            <div className={ui.note}>{indicador.nota}</div>
          </Card>
        ))}
      </AutoGrid>

      <AutoGrid min={320} alignStart>
        <Card className={styles.painel}>
          <div className={ui.cardTitle}>Uso dos créditos vendidos</div>
          <Stack gap={16}>
            <div>
              <div className={styles.usoLinha}>
                <span>Consumidos em assessments</span>
                <span className={styles.usoValor}>
                  {m.creditosUsados} de {m.creditosVendidos}
                </span>
              </div>
              <Progress
                value={(m.creditosUsados / Math.max(1, m.creditosVendidos)) * 100}
                label="Créditos consumidos sobre vendidos"
              />
            </div>
            <div>
              <div className={styles.usoLinha}>
                <span>Assessments respondidos</span>
                <span className={styles.usoValor}>{conclusao}%</span>
              </div>
              <Progress value={conclusao} label="Taxa de conclusão dos assessments" />
            </div>
          </Stack>
          <p className={ui.prose}>
            Crédito parado é receita já recebida sem entrega feita. Facilitador com saldo alto e
            pouco uso costuma precisar de ajuda para começar, não de mais crédito.
          </p>
        </Card>

        <Card padding="none">
          <div className={ui.sectionHead} style={{ padding: 'var(--space-16) var(--space-20)' }}>
            <div className={ui.cardTitle}>Facilitadores</div>
            <Button href="/admin/facilitadores" variant="link">
              Ver todos
            </Button>
          </div>
          {/* Sem parceiro nenhum o card mostraria só o cabeçalho da tabela,
              sem dizer o que fazer para preenchê-la. */}
          {facilitadores.length === 0 ? (
            <EmptyState>Nenhum parceiro cadastrado ainda.</EmptyState>
          ) : (
          <Table compact>
            <thead>
              <tr>
                <Th>Parceiro</Th>
                <Th align="right">Saldo</Th>
                <Th align="right">Situação</Th>
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
                        <div className={styles.empresa}>{facilitador.empresa}</div>
                      </div>
                    </div>
                  </Td>
                  <Td dense align="right">
                    <span
                      className={[styles.saldo, facilitador.creditos === 0 ? styles.semCreditos : null]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {facilitador.creditos}
                    </span>
                  </Td>
                  <Td dense align="right">
                    <Pill tone={facilitador.ativo ? 'success' : 'neutral'} dot>
                      {facilitador.ativo ? 'Ativo' : 'Inativo'}
                    </Pill>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          )}
        </Card>
      </AutoGrid>
    </>
  )
}
