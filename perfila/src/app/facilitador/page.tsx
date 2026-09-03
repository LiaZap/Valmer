import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon, type IconName } from '@/components/ui/Icon'
import { AutoGrid, Row, Stack } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Progress } from '@/components/ui/Progress'
import { Select } from '@/components/ui/Select'
import { cursosDestaque } from '@/data/aprendizado'
import { faltamParaGold, situacaoPrograma } from '@/data/beneficios'
import { degustacao, indicadores } from '@/data/creditos'
import { opcoes } from '@/data/opcoes'
import { dataPorExtenso, saudacao } from '@/lib/data-extenso'
import { contaAtual, transacoesDaConta } from '@/lib/painel'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

/**
 * Dashboard do parceiro.
 *
 * O saldo e o consumo vêm do banco, da mesma leitura que alimenta a barra
 * lateral e a tela de créditos. Antes o chip do topo lia do banco e o corpo
 * lia de um arquivo fixo: dois números de crédito na mesma tela, discordando,
 * e nenhum jeito de a pessoa saber qual valia.
 */
export default async function DashboardPage() {
  const agora = new Date()
  const [conta, extrato] = await Promise.all([contaAtual(), transacoesDaConta()])

  const recebidos = extrato
    .filter((movimento) => movimento.quantidade > 0)
    .reduce((soma, movimento) => soma + movimento.quantidade, 0)

  const consumidos = extrato
    .filter((movimento) => movimento.quantidade < 0)
    .reduce((soma, movimento) => soma + Math.abs(movimento.quantidade), 0)

  // O indicador de créditos entra por último, como estava, mas vindo do
  // extrato. Os outros três continuam do arquivo: cliente, devolutiva e
  // faturamento ainda não têm tabela para consultar.
  const indicadoresDaTela = [
    ...indicadores,
    {
      label: 'Créditos utilizados',
      icon: 'card' as const,
      valor: String(consumidos),
      nota: `${conta.creditos} disponíveis agora`,
    },
  ]

  // Vinha de @/data/usuario, fixo em "Valmer": o portal cumprimentava todo
  // parceiro com o nome do dono da plataforma. Sai da mesma leitura que
  // alimenta o chip da barra lateral, então os dois não têm como divergir.
  const primeiroNome = conta.nome.split(' ')[0]

  return (
    <>
      <PageHeader
        title={`${saudacao(agora)}, ${primeiroNome}`}
        subtitle={`Resumo da sua operação nesta ${dataPorExtenso(agora)}.`}
        actions={
          <>
            <Button href="/facilitador/envio-rapido" icon={<Icon name="zap" />}>
              Envio rápido
            </Button>
            <Button href="/facilitador/campanhas/nova" variant="primary" icon={<Icon name="plus" />}>
              Nova campanha
            </Button>
          </>
        }
      />

      {/* Indicadores da operação */}
      <AutoGrid min={200}>
        {indicadoresDaTela.map((indicador) => (
          <Card key={indicador.label}>
            <div className={styles.kpiHead}>
              {indicador.label}
              <Icon name={indicador.icon as IconName} />
            </div>
            <div className={`${ui.metricLg} ${styles.kpiValue}`}>{indicador.valor}</div>
            <div className={ui.note}>{indicador.nota}</div>
          </Card>
        ))}
      </AutoGrid>

      {/* Saldos e programa de benefícios */}
      <AutoGrid min={260}>
        <Card className={styles.saldo}>
          <Row gap={10}>
            <span className={`${ui.blockIcon} ${ui.blockIconAccent}`}>
              <Icon name="card" />
            </span>
            <div>
              <div className={ui.cardTitle}>Créditos</div>
              <div className={ui.cardSub}>Saldo da plataforma</div>
            </div>
          </Row>
          <div className={styles.saldoValor}>
            <span className={ui.metricXl}>{conta.creditos}</span>
            <span className={styles.saldoUnidade}>créditos</span>
          </div>
          {/* As duas linhas explicam o número acima: recebidos menos
              consumidos dá o saldo. Antes diziam "vitalícios" e "a expirar",
              uma distinção que o banco não guarda — crédito aqui não tem
              prazo, e mostrar "0 a expirar · N/D" anunciava uma regra
              inexistente. */}
          <Stack gap={8}>
            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>Recebidos</span>
              <span className={ui.dataRowValue}>{recebidos}</span>
            </div>
            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>Consumidos</span>
              <span className={ui.dataRowValue}>{consumidos}</span>
            </div>
          </Stack>
          <Button
            href="/facilitador/creditos"
            variant="link"
            className={styles.saldoAcao}
            iconRight={<Icon name="chevR" />}
          >
            Ver extrato
          </Button>
        </Card>

        <Card className={styles.saldo}>
          <Row gap={10}>
            <span className={`${ui.blockIcon} ${ui.blockIconWarning}`}>
              <Icon name="gift" />
            </span>
            <div>
              <div className={ui.cardTitle}>Degustações</div>
              <div className={ui.cardSub}>Saldo de testes gratuitos</div>
            </div>
          </Row>
          <div className={styles.saldoValor}>
            <span className={ui.metricXl}>{degustacao.saldo}</span>
            <span className={styles.saldoUnidade}>créditos</span>
          </div>
          <Stack gap={8}>
            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>Vitalícios</span>
              <span className={ui.dataRowValue}>{degustacao.vitalicios}</span>
            </div>
            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>A expirar</span>
              <span className={ui.dataRowValue}>
                {degustacao.aExpirar}{' '}
                <span className={ui.dataRowExtra}>· {degustacao.expiraEm}</span>
              </span>
            </div>
          </Stack>
          <Button
            href="/facilitador/degustacao"
            variant="link"
            className={styles.saldoAcao}
            iconRight={<Icon name="chevR" />}
          >
            Configurar degustação
          </Button>
        </Card>

        <Card tone="ink" className={styles.programa}>
          <div className={styles.programaGlow} aria-hidden />

          <div className={styles.programaTopo}>
            <div>
              <div className={`${ui.eyebrow} ${ui.eyebrowOnInk}`}>Programa de benefícios</div>
              <div className={styles.programaCategoria}>{situacaoPrograma.categoria}</div>
            </div>
            <Pill tone="onInk">Expira {situacaoPrograma.expiraEm}</Pill>
          </div>

          <div className={styles.programaBarras}>
            <div>
              <div className={styles.barraLabel}>
                <span>Créditos utilizados</span>
                <span className={styles.barraValor}>
                  {situacaoPrograma.utilizados.atual} de {situacaoPrograma.utilizados.meta}
                </span>
              </div>
              <Progress
                tone="onInk"
                label="Créditos utilizados no ciclo"
                value={
                  (situacaoPrograma.utilizados.atual / situacaoPrograma.utilizados.meta) * 100
                }
              />
            </div>
            <div>
              <div className={styles.barraLabel}>
                <span>Créditos comprados</span>
                <span className={styles.barraValor}>
                  {situacaoPrograma.comprados.atual} de {situacaoPrograma.comprados.meta}
                </span>
              </div>
              <Progress
                tone="onInk"
                label="Créditos comprados no ciclo"
                value={(situacaoPrograma.comprados.atual / situacaoPrograma.comprados.meta) * 100}
              />
            </div>
          </div>

          <div className={styles.programaNota}>
            Faltam {faltamParaGold.utilizados} créditos para a categoria{' '}
            <b>{situacaoPrograma.proximaCategoria}</b>.{' '}
            <Link href="/facilitador/beneficios" className={styles.programaLink}>
              Ver benefícios
            </Link>
          </div>
        </Card>
      </AutoGrid>

      {/* Vendas e cursos */}
      <AutoGrid min={320}>
        <Card className={styles.painel}>
          <div className={ui.sectionHead}>
            <div className={ui.cardTitle}>Vendas por período</div>
            <div className={styles.legenda}>
              <span className={styles.legendaItem}>
                <i className={`${styles.legendaPonto} ${styles.legendaPago}`} />
                Pago
              </span>
              <span className={styles.legendaItem}>
                <i className={`${styles.legendaPonto} ${styles.legendaFaturado}`} />
                Faturado
              </span>
              <div className={styles.legendaSelect}>
                <Select options={opcoes.periodo} size="sm" label="Período do gráfico" />
              </div>
            </div>
          </div>
          <div className={styles.grafico}>
            <p className={styles.graficoAviso}>
              Ainda não há vendas suficientes para exibir o gráfico.{' '}
              <Link href="/facilitador/degustacao">Configure a degustação</Link> para começar a converter
              clientes.
            </p>
          </div>
        </Card>

        <Card className={styles.cursos}>
          <div className={ui.sectionHead}>
            <div className={ui.cardTitle}>Nossos cursos</div>
            <Button href="/facilitador/cursos" variant="link">
              Ver todos
            </Button>
          </div>
          <Stack gap={10}>
            {cursosDestaque.map((curso) => (
              <Link href="/facilitador/cursos" key={curso.title} className={styles.cursoItem}>
                <span className={styles.cursoCapa} style={{ background: curso.capa }}>
                  {curso.abbr}
                </span>
                <span className={styles.cursoTexto}>
                  <span className={styles.cursoTitulo}>{curso.title}</span>
                  <span className={styles.cursoDesc}>{curso.desc}</span>
                </span>
              </Link>
            ))}
          </Stack>
        </Card>
      </AutoGrid>
    </>
  )
}
