'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { facilitadores, transacoes, type TipoTransacao } from '@/data/facilitadores'
import { custoPorCredito, moeda, pacotesCreditos } from '@/data/planos'
import { metricasPlataforma } from '@/lib/metricas'
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

function nomeFacilitador(id: string) {
  return facilitadores.find((facilitador) => facilitador.id === id)?.nome ?? id
}

export default function CreditosAdminPage() {
  const { toast } = useToast()
  const m = metricasPlataforma()

  // Mais recentes primeiro, como o extrato de uma conta.
  const extrato = [...transacoes].reverse()

  return (
    <>
      <PageHeader
        title="Créditos e pacotes"
        subtitle={`${m.creditosVendidos} créditos vendidos · ${m.creditosEmCarteira} em carteira`}
        actions={
          <Button
            variant="primary"
            icon={<Icon name="plus" />}
            onClick={() => toast('Abrindo venda de créditos')}
          >
            Vender créditos
          </Button>
        }
      />

      <AutoGrid min={200}>
        {pacotesCreditos.map((pacote) => (
          <Card key={pacote.nome} className={styles.pacote}>
            <div className={ui.eyebrow}>{pacote.nome}</div>
            <div className={styles.creditos}>{pacote.creditos}</div>
            <div className={styles.preco}>{moeda(pacote.preco)}</div>
            <div className={ui.note}>{moeda(custoPorCredito(pacote))} por crédito</div>
            <Button
              className={styles.acao}
              onClick={() => toast(`Vendendo pacote ${pacote.nome}`)}
            >
              Vender
            </Button>
          </Card>
        ))}
      </AutoGrid>

      <Card padding="none" clip scrollX>
        <div className={ui.sectionHead} style={{ padding: 'var(--space-16) var(--space-20)' }}>
          <div className={ui.cardTitle}>Extrato de créditos</div>
          <Button variant="link" onClick={() => toast('Exportação iniciada')}>
            Exportar
          </Button>
        </div>
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
            {extrato.map((transacao) => (
              <Tr key={transacao.id}>
                <Td muted>{transacao.data}</Td>
                <Td>
                  <span className={tableStyles.primary}>
                    {nomeFacilitador(transacao.facilitadorId)}
                  </span>
                </Td>
                <Td>
                  <Pill tone={TOM_TIPO[transacao.tipo]}>{ROTULO_TIPO[transacao.tipo]}</Pill>
                </Td>
                <Td muted>{transacao.descricao}</Td>
                <Td align="right">
                  <span
                    className={
                      transacao.quantidade < 0 ? styles.saida : styles.entrada
                    }
                  >
                    {transacao.quantidade > 0 ? `+${transacao.quantidade}` : transacao.quantidade}
                  </span>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  )
}
