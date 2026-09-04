import { BotaoAviso } from '@/components/ui/BotaoAviso'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { TabelaExtrato } from '@/components/creditos/TabelaExtrato'
import { custoPorCredito, moeda, pacotesCreditos } from '@/data/planos'
import { metricasPlataforma } from '@/lib/metricas'
import {
  assessmentsVisiveis,
  empresasPorId,
  listarFacilitadores,
  listarTransacoes,
} from '@/lib/painel'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

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

  // Os nomes saem dos ids que aparecem NO EXTRATO, e não da lista de
  // parceiros: quem movimenta crédito nem sempre tem papel de facilitador — o
  // próprio dono da plataforma tem lançamentos —, e montar o mapa só com
  // parceiros fazia a coluna cair no id cru daquelas linhas.
  const nomes = await empresasPorId([...new Set(transacoes.map((t) => t.facilitadorId))])

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
          <TabelaExtrato itens={transacoes} nomes={nomes} />
        )}
      </Card>
    </>
  )
}
