import { NOMES_FATORES, ORDEM_FATORES } from '@/data/assessment'
import { getTipoRelatorio } from '@/data/planos'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { Meter, MeterGroup } from '@/components/respondente/Meter'
import type { DadosRelatorio, PerfilEstatico } from '@/lib/relatorio/tipos'
import { initials } from '@/lib/text'
import common from '@/styles/common.module.css'
import styles from './CapaResumo.module.css'

type CapaResumoProps = {
  dados: DadosRelatorio
  /** Conteúdo fixo do fator mais alto — vem da tabela por perfil. */
  perfilPrimario: PerfilEstatico
  /** Conteúdo fixo do segundo fator mais alto. */
  perfilSecundario: PerfilEstatico
}

/**
 * CapaResumo
 * ----------
 * As duas primeiras seções do relatório: a capa e o resumo do perfil.
 *
 * Regras de design que governam este bloco:
 *
 * - É documento, não painel. A capa preenche a primeira folha A4 por
 *   distribuição do conteúdo (`space-between` sobre uma altura mínima
 *   em milímetros, só na impressão), nunca por altura de viewport —
 *   `vh` não existe em papel.
 * - A cor nunca é o único portador do dado. Cada barra traz a letra do
 *   fator e o percentual ao lado do rótulo, e o papel de cada fator
 *   (predominante / apoio) é dito por escrito, não só por realce.
 * - Nada depende de hover: o relatório é lido impresso tanto quanto na
 *   tela.
 * - O verde entra uma vez por seção — na sigla sobre o card escuro da
 *   capa e no rótulo do fator predominante. O resto é neutro quente.
 * - A ordem das barras é a canônica (D, I, S, C) mesmo quando o perfil
 *   primário não é o D: quem compara relatórios diferentes precisa
 *   sempre da mesma sequência. O destaque marca quem lidera.
 */
export function CapaResumo({ dados, perfilPrimario, perfilSecundario }: CapaResumoProps) {
  const { avaliado, facilitador, emitidoEm, tipoRelatorio, resultado } = dados
  const tipo = getTipoRelatorio(tipoRelatorio)

  const nomePrimario = NOMES_FATORES[resultado.primario]
  const nomeSecundario = NOMES_FATORES[resultado.secundario]

  return (
    <>
      <section id="capa" className={styles.capa} aria-labelledby="capa-titulo">
        <header className={styles.marca}>
          <span className={styles.marcaNome}>
            <i className={styles.marcaPonto} aria-hidden />
            Perfila
          </span>
          <Pill size="sm">
            {tipo.codigo} · {tipo.nome}
          </Pill>
        </header>

        <div className={styles.capaMiolo}>
          <p className={common.eyebrow}>Inventário comportamental</p>
          <h2 id="capa-titulo" className={styles.capaTitulo}>
            Relatório de perfil comportamental
          </h2>

          <div className={styles.avaliado}>
            <Avatar>{initials(avaliado.nome)}</Avatar>
            <div>
              <p className={styles.avaliadoNome}>{avaliado.nome}</p>
              <p className={common.cardSub}>{avaliado.email}</p>
            </div>
          </div>

          <Card tone="ink" padding="lg" className={styles.selo}>
            <p className={[common.eyebrow, common.eyebrowOnInk].join(' ')}>Perfil identificado</p>
            <p className={styles.sigla}>{resultado.combinado}</p>
            <p className={styles.seloNome}>
              {nomePrimario} com {nomeSecundario}
            </p>
            <p className={styles.seloApoio}>
              {perfilPrimario.nome} · {perfilSecundario.nome}
            </p>
          </Card>
        </div>

        <div className={styles.capaFecho}>
          <p className={[common.prose, styles.capaNota].join(' ')}>
            Este documento descreve tendências de comportamento a partir da sua própria
            percepção no momento em que respondeu ao inventário. Ele fala de preferências: não
            mede capacidade, inteligência nem desempenho.
          </p>

          <div className={styles.capaDados}>
            <div className={common.dataRow}>
              <span className={common.dataRowLabel}>Emitido em</span>
              <span className={common.dataRowValue}>{emitidoEm}</span>
            </div>
            <div className={common.dataRow}>
              <span className={common.dataRowLabel}>Facilitador</span>
              <span className={common.dataRowValue}>
                {facilitador.nome}{' '}
                <span className={common.dataRowExtra}>{facilitador.empresa}</span>
              </span>
            </div>
            <div className={common.dataRow}>
              <span className={common.dataRowLabel}>Contato</span>
              <span className={common.dataRowValue}>{facilitador.telefone}</span>
            </div>
          </div>
        </div>
      </section>

      <section id="resumo" className={styles.secao} aria-labelledby="resumo-titulo">
        <h2 id="resumo-titulo" className={styles.tituloSecao}>
          Resumo do perfil
        </h2>

        <p className={[common.prose, styles.comoLer].join(' ')}>
          Cada uma das {resultado.total} respostas conta para um único fator, por isso os quatro
          percentuais somam 100%. Quanto mais alta a barra, mais aquele comportamento aparece
          primeiro em você. Base desta leitura: {resultado.respondidas} de {resultado.total}{' '}
          respostas.
        </p>

        <Card padding="lg" className={styles.quadro}>
          <p className={common.eyebrow}>Distribuição dos quatro fatores</p>

          <MeterGroup>
            {ORDEM_FATORES.map((fator) => {
              const ehPrimario = fator === resultado.primario
              const ehSecundario = fator === resultado.secundario
              const papel = ehPrimario
                ? 'Fator predominante'
                : ehSecundario
                  ? 'Fator de apoio'
                  : null

              return (
                <div
                  key={fator}
                  className={[styles.fator, papel ? styles.fatorDestaque : null]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {papel ? (
                    <span
                      className={[
                        common.eyebrow,
                        styles.marcador,
                        ehPrimario ? styles.marcadorPrimario : null,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {papel}
                    </span>
                  ) : null}
                  <Meter
                    rotulo={`${fator} · ${NOMES_FATORES[fator]}`}
                    valor={resultado.percentuais[fator]}
                    fator={fator}
                  />
                </div>
              )
            })}
          </MeterGroup>
        </Card>

        <Card padding="lg" className={styles.combinacao}>
          <div className={styles.combinacaoTopo}>
            <span className={styles.siglaResumo}>{resultado.combinado}</span>
            <div className={styles.combinacaoTexto}>
              <h3 className={common.cardTitle}>
                {nomePrimario} com {nomeSecundario}
              </h3>
              <p className={common.prose}>
                A sigla junta seus dois fatores mais altos, na ordem em que aparecem:{' '}
                {resultado.primario} à frente, com {resultado.percentuais[resultado.primario]}%,
                e {resultado.secundario} logo atrás, com{' '}
                {resultado.percentuais[resultado.secundario]}%.
              </p>
            </div>
          </div>

          <dl className={styles.papeis}>
            <div className={styles.papelItem}>
              <dt className={styles.papelTermo}>
                <span>
                  {perfilPrimario.fator} · {perfilPrimario.nome}
                </span>
                <span className={styles.papelSelo}>Predominante</span>
              </dt>
              <dd className={[common.prose, styles.papelTexto].join(' ')}>
                {perfilPrimario.resumo}
              </dd>
            </div>
            <div className={styles.papelItem}>
              <dt className={styles.papelTermo}>
                <span>
                  {perfilSecundario.fator} · {perfilSecundario.nome}
                </span>
                <span className={styles.papelSelo}>Apoio</span>
              </dt>
              <dd className={[common.prose, styles.papelTexto].join(' ')}>
                {perfilSecundario.resumo}
              </dd>
            </div>
          </dl>
        </Card>
      </section>
    </>
  )
}
