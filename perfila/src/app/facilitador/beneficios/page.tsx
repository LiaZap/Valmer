import type { CSSProperties } from 'react'
import { BotaoAviso } from '@/components/ui/BotaoAviso'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { tableStyles } from '@/components/ui/Table'
import { beneficios, categorias } from '@/data/beneficios'
import { progressoDoPrograma } from '@/lib/painel'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

/** Percentual arredondado para baixo: só mostra a meta batida. */
function progresso(atual: number, meta: number) {
  return Math.min(100, Math.floor((atual / meta) * 100))
}

/**
 * Programa de benefícios do parceiro.
 *
 * Server Component: a situação vem de `progressoDoPrograma()`, a mesma leitura
 * que alimenta o cartão do dashboard. Antes as duas telas liam um objeto fixo
 * que dizia "71 de 80 utilizados" para todo mundo; agora, se discordarem, é
 * porque discordam do banco — não uma da outra.
 *
 * A régua (faixas, limites, matriz de vantagens) continua vindo do arquivo:
 * aquilo é o contrato do programa, igual para todos os parceiros.
 */
export default async function BeneficiosPage() {
  const programa = await progressoDoPrograma()

  const pctUtilizados = progresso(programa.utilizados.atual, programa.utilizados.meta)
  const pctComprados = progresso(programa.comprados.atual, programa.comprados.meta)

  return (
    <>
      <PageHeader
        title="Programa de Benefícios"
        subtitle="Quanto mais créditos você compra ou utiliza, mais vantagens desbloqueia."
        actions={
          <BotaoAviso icon={<Icon name="chat" />} aviso="Abrindo WhatsApp">
            Falar com o consultor
          </BotaoAviso>
        }
      />

      <AutoGrid min={240}>
        <Card tone="ink" className={styles.categoria}>
          <div className={`${ui.eyebrow} ${ui.eyebrowOnInk}`}>Categoria atual</div>
          <div className={styles.categoriaNome}>{programa.categoria}</div>
          <div className={styles.categoriaNota}>
            Expira em {programa.expiraEm} · valores considerados a partir de{' '}
            {programa.cicloIniciadoEm}
          </div>
        </Card>

        <Card className={styles.meta}>
          <div
            className={styles.anel}
            style={{ '--valor': `${pctUtilizados}%` } as CSSProperties}
            aria-hidden
          >
            <div className={styles.anelCentro}>{pctUtilizados}%</div>
          </div>
          <div>
            <div className={ui.cardTitle}>Créditos utilizados</div>
            <div className={styles.metaTexto}>
              {programa.utilizados.atual} de {programa.utilizados.meta}
              {programa.proximaCategoria ? (
                <>
                  {' '}
                  · faltam {programa.faltam.utilizados} para <b>{programa.proximaCategoria}</b>
                </>
              ) : (
                <> · categoria máxima atingida</>
              )}
            </div>
          </div>
        </Card>

        <Card className={styles.meta}>
          <div
            className={styles.anel}
            style={{ '--valor': `${pctComprados}%` } as CSSProperties}
            aria-hidden
          >
            <div className={styles.anelCentro}>{pctComprados}%</div>
          </div>
          <div>
            <div className={ui.cardTitle}>Créditos comprados</div>
            <div className={styles.metaTexto}>
              {programa.comprados.atual} de {programa.comprados.meta}
              {programa.proximaCategoria ? (
                <>
                  {' '}
                  · faltam {programa.faltam.comprados} para <b>{programa.proximaCategoria}</b>
                </>
              ) : (
                <> · categoria máxima atingida</>
              )}
            </div>
          </div>
        </Card>
      </AutoGrid>

      {/* Matriz: uma linha por benefício, uma coluna por categoria. */}
      <Card padding="none" clip scrollX>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.matrizCabecalho}>
                Nossos benefícios
              </th>
              {categorias.map((categoria) => (
                <th
                  key={categoria.name}
                  scope="col"
                  className={styles.matrizCategoria}
                  style={{ background: categoria.bg }}
                >
                  <div className={styles.matrizCategoriaNome} style={{ color: categoria.fg }}>
                    {categoria.name}
                  </div>
                  <div className={styles.matrizCategoriaRegra} style={{ color: categoria.sub }}>
                    {categoria.rule}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {beneficios.map((beneficio) => (
              <tr key={beneficio.name} className={tableStyles.row}>
                <th scope="row" className={styles.matrizNome}>
                  {beneficio.name}
                </th>
                {beneficio.cells.map((valor, indice) => (
                  <td key={categorias[indice]?.name ?? indice} className={styles.matrizValor}>
                    {valor === 'yes' ? (
                      <span className={styles.incluso} title="Incluído">
                        <Icon name="check" />
                      </span>
                    ) : valor === 'no' ? (
                      <span className={styles.ausente} title="Não incluído">
                        —
                      </span>
                    ) : (
                      valor
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
