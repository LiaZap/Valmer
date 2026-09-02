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
import { creditos, degustacao, indicadores } from '@/data/creditos'
import { opcoes } from '@/data/opcoes'
import { usuario } from '@/data/usuario'
import { dataPorExtenso, saudacao } from '@/lib/data-extenso'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

export default function DashboardPage() {
  const agora = new Date()

  return (
    <>
      <PageHeader
        title={`${saudacao(agora)}, ${usuario.nome.split(' ')[0]}`}
        subtitle={`Resumo da sua operação nesta ${dataPorExtenso(agora)}.`}
        actions={
          <>
            <Button href="/envio-rapido" icon={<Icon name="zap" />}>
              Envio rápido
            </Button>
            <Button href="/campanhas/nova" variant="primary" icon={<Icon name="plus" />}>
              Nova campanha
            </Button>
          </>
        }
      />

      {/* Indicadores da operação */}
      <AutoGrid min={200}>
        {indicadores.map((indicador) => (
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
            <span className={ui.metricXl}>{creditos.saldo}</span>
            <span className={styles.saldoUnidade}>créditos</span>
          </div>
          <Stack gap={8}>
            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>Vitalícios</span>
              <span className={ui.dataRowValue}>{creditos.vitalicios}</span>
            </div>
            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>A expirar</span>
              <span className={ui.dataRowValue}>
                {creditos.aExpirar} <span className={ui.dataRowExtra}>· {creditos.expiraEm}</span>
              </span>
            </div>
          </Stack>
          <Button
            href="/creditos"
            variant="link"
            className={styles.saldoAcao}
            iconRight={<Icon name="chevR" />}
          >
            Comprar créditos
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
            href="/degustacao"
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
            <Link href="/beneficios" className={styles.programaLink}>
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
              <Link href="/degustacao">Configure a degustação</Link> para começar a converter
              clientes.
            </p>
          </div>
        </Card>

        <Card className={styles.cursos}>
          <div className={ui.sectionHead}>
            <div className={ui.cardTitle}>Nossos cursos</div>
            <Button href="/cursos" variant="link">
              Ver todos
            </Button>
          </div>
          <Stack gap={10}>
            {cursosDestaque.map((curso) => (
              <Link href="/cursos" key={curso.title} className={styles.cursoItem}>
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
