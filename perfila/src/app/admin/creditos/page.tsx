import { BotaoAviso } from '@/components/ui/BotaoAviso'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import type { TipoTransacao } from '@/data/facilitadores'
import { custoPorCredito, moeda, pacotesCreditos } from '@/data/planos'
import { metricasPlataforma } from '@/lib/metricas'
import { assessmentsVisiveis, listarFacilitadores, listarTransacoes } from '@/lib/painel'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

const ROTULO_TIPO: Record<TipoTransacao, string> = {
  compra: 'Compra',
  uso: 'Uso',
  estorno: 'Estorno',
  bonus: 'Bônus',
}

const TOM_TIPO: Record<TipoTransacao, 'success' | 'neutral' | 'warning'> = {
  compra: 'success',
  uso: 'neutral',
  estorno: 'warning',
  bonus: 'success',
}

/**
 * Créditos vendidos e o extrato de todos os parceiros.
 *
 * Server Component: nada aqui tem estado, então a tela inteira é renderizada
 * no servidor. Os nomes dos parceiros vêm da mesma lista que alimenta as
 * métricas — procurar cada nome numa consulta separada seria uma ida ao banco
 * por linha do extrato.
 *
 * O extrato já chega do mais novo para o mais antigo, como o de uma conta:
 * a ordem é do `ORDER BY`, e não de um `reverse()` sobre o que voltou.
 */
export default async function CreditosAdminPage() {
  const [facilitadores, assessments, transacoes] = await Promise.all([
    listarFacilitadores(),
    assessmentsVisiveis(),
    listarTransacoes(),
  ])

  const m = metricasPlataforma({ facilitadores, assessments, transacoes })
  const nomes = new Map(facilitadores.map((facilitador) => [facilitador.id, facilitador.nome]))

  return (
    <>
      <PageHeader
        title="Créditos e pacotes"
        subtitle={`${m.creditosVendidos} créditos vendidos · ${m.creditosEmCarteira} em carteira`}
        actions={
          <BotaoAviso
            variant="primary"
            icon={<Icon name="plus" />}
            aviso="Abrindo venda de créditos"
          >
            Vender créditos
          </BotaoAviso>
        }
      />

      <AutoGrid min={200}>
        {pacotesCreditos.map((pacote) => (
          <Card key={pacote.nome} className={styles.pacote}>
            <div className={ui.eyebrow}>{pacote.nome}</div>
            <div className={styles.creditos}>{pacote.creditos}</div>
            <div className={styles.preco}>{moeda(pacote.preco)}</div>
            <div className={ui.note}>{moeda(custoPorCredito(pacote))} por crédito</div>
            <BotaoAviso className={styles.acao} aviso={`Vendendo pacote ${pacote.nome}`}>
              Vender
            </BotaoAviso>
          </Card>
        ))}
      </AutoGrid>

      <Card padding="none" clip scrollX>
        <div className={ui.sectionHead} style={{ padding: 'var(--space-16) var(--space-20)' }}>
          <div className={ui.cardTitle}>Extrato de créditos</div>
          <BotaoAviso variant="link" aviso="Exportação iniciada">
            Exportar
          </BotaoAviso>
        </div>
        {/* Extrato sem linha nenhuma é um cabeçalho solto: não diz se ainda
            não houve movimento ou se a leitura falhou. */}
        {transacoes.length === 0 ? (
          <EmptyState>
            Nenhum movimento de crédito ainda. As compras e os usos dos parceiros aparecem aqui.
          </EmptyState>
        ) : (
        <Table>
          <thead>
            <tr>
              <Th>Data</Th>
              <Th>Facilitador</Th>
              <Th>Movimento</Th>
              <Th>Descrição</Th>
              <Th align="right">Créditos</Th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((transacao) => (
              <Tr key={transacao.id}>
                <Td muted>{transacao.data}</Td>
                <Td>
                  <span className={tableStyles.primary}>
                    {nomes.get(transacao.facilitadorId) ?? transacao.facilitadorId}
                  </span>
                </Td>
                <Td>
                  <Pill tone={TOM_TIPO[transacao.tipo]}>{ROTULO_TIPO[transacao.tipo]}</Pill>
                </Td>
                <Td muted>{transacao.descricao}</Td>
                <Td align="right">
                  <span className={transacao.quantidade < 0 ? styles.saida : styles.entrada}>
                    {transacao.quantidade > 0 ? `+${transacao.quantidade}` : transacao.quantidade}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        )}
      </Card>
    </>
  )
}
