import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon, type IconName } from '@/components/ui/Icon'
import { AutoGrid, Row, Stack } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Progress } from '@/components/ui/Progress'
import { cursosDestaque } from '@/data/aprendizado'

import { dataPorExtenso, saudacao } from '@/lib/data-extenso'
import {
  contaAtual,
  degustacaoDaConta,
  progressoDoPrograma,
  resumoDaOperacao,
  transacoesDaConta,
} from '@/lib/painel'
import ui from '@/styles/common.module.css'
import { GraficoCreditos } from './GraficoCreditos'
import styles from './page.module.css'

/**
 * Dashboard do parceiro.
 *
 * O saldo e o consumo vêm do banco, da mesma leitura que alimenta a barra
 * lateral e a tela de créditos. Antes o chip do topo lia do banco e o corpo
 * lia de um arquivo fixo: dois números de crédito na mesma tela, discordando,
 * e nenhum jeito de a pessoa saber qual valia.
 *
 * A degustação entrou na mesma regra e pelo mesmo motivo: /facilitador/degustacao
 * passou a debitar `usuarios.creditos_degustacao` de verdade, e este cartão
 * continuava mostrando os 180 fixos do arquivo — a primeira amostra enviada já
 * fazia as duas telas do mesmo portal discordarem.
 */
export default async function DashboardPage() {
  const agora = new Date()
  const [conta, extrato, programa, amostras, resumo] = await Promise.all([
    contaAtual(),
    transacoesDaConta(),
    progressoDoPrograma(),
    degustacaoDaConta(),
    resumoDaOperacao(),
  ])

  const recebidos = extrato
    .filter((movimento) => movimento.quantidade > 0)
    .reduce((soma, movimento) => soma + movimento.quantidade, 0)

  const consumidos = extrato
    .filter((movimento) => movimento.quantidade < 0)
    .reduce((soma, movimento) => soma + Math.abs(movimento.quantidade), 0)

  // Os quatro saem do banco. Cliente e devolutiva ganharam tabela na migration
  // 0008 e continuavam mostrando os números de protótipo (227 clientes, 42h26)
  // ao lado do saldo real. O cartão de faturamento saiu: a plataforma não sabe
  // por quanto o parceiro revende — ver `resumoDaOperacao`.
  const indicadoresDaTela = [
    {
      label: 'Total de clientes',
      icon: 'users' as const,
      valor: String(resumo.clientes),
      nota: resumo.clientes === 0 ? 'Nenhum cliente cadastrado ainda' : 'Na sua carteira',
    },
    {
      label: 'Devolutivas',
      icon: 'chat' as const,
      valor: resumo.devolutivasTempo,
      nota: `${resumo.devolutivasFinalizadas} finalizada(s)`,
    },
    {
      label: 'Mapas concluídos',
      icon: 'check' as const,
      valor: String(resumo.mapasConcluidos),
      nota: 'Respondidos pelos avaliados',
    },
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
              Nova turma
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
            <span className={ui.metricXl}>{amostras.saldo}</span>
            <span className={styles.saldoUnidade}>amostras</span>
          </div>
          <Stack gap={8}>
            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>Concedidas</span>
              <span className={ui.dataRowValue}>{amostras.concedidas}</span>
            </div>
            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>Utilizadas</span>
              <span className={ui.dataRowValue}>{amostras.utilizadas}</span>
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

          <div className={styles.programaTopo}>
            <div>
              <div className={`${ui.eyebrow} ${ui.eyebrowOnInk}`}>Programa de benefícios</div>
              <div className={styles.programaCategoria}>{programa.categoria}</div>
            </div>
            <Pill tone="onInk">Expira {programa.expiraEm}</Pill>
          </div>

          <div className={styles.programaBarras}>
            <div>
              <div className={styles.barraLabel}>
                <span>Créditos utilizados</span>
                <span className={styles.barraValor}>
                  {programa.utilizados.atual} de {programa.utilizados.meta}
                </span>
              </div>
              <Progress
                tone="onInk"
                label="Créditos utilizados no ciclo"
                value={(programa.utilizados.atual / programa.utilizados.meta) * 100}
              />
            </div>
            <div>
              <div className={styles.barraLabel}>
                <span>Créditos comprados</span>
                <span className={styles.barraValor}>
                  {programa.comprados.atual} de {programa.comprados.meta}
                </span>
              </div>
              <Progress
                tone="onInk"
                label="Créditos comprados no ciclo"
                value={(programa.comprados.atual / programa.comprados.meta) * 100}
              />
            </div>
          </div>

          {/* No topo da régua não há próxima categoria, e a frase "faltam N
              para null" era o que apareceria. Quem chegou lá merece a frase
              que diz isso. */}
          <div className={styles.programaNota}>
            {programa.proximaCategoria ? (
              <>
                Faltam {programa.faltam.utilizados} créditos utilizados para a categoria{' '}
                <b>{programa.proximaCategoria}</b>.{' '}
              </>
            ) : (
              <>Você está na categoria mais alta do programa. </>
            )}
            <Link href="/facilitador/beneficios" className={styles.programaLink}>
              Ver benefícios
            </Link>
          </div>
        </Card>
      </AutoGrid>

      {/* Vendas e cursos */}
      <AutoGrid min={320}>
        <Card className={styles.painel}>
          <GraficoCreditos movimentos={extrato} />
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
