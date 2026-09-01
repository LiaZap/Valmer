'use client'

import type { CSSProperties } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { beneficios, categorias, faltamParaGold, situacaoPrograma } from '@/data/beneficios'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

/** Percentual arredondado para baixo: só mostra a meta batida. */
function progresso(atual: number, meta: number) {
  return Math.floor((atual / meta) * 100)
}

export default function BeneficiosPage() {
  const { toast } = useToast()

  const pctUtilizados = progresso(
    situacaoPrograma.utilizados.atual,
    situacaoPrograma.utilizados.meta,
  )
  const pctComprados = progresso(
    situacaoPrograma.comprados.atual,
    situacaoPrograma.comprados.meta,
  )

  return (
    <>
      <PageHeader
        title="Programa de Benefícios"
        subtitle="Quanto mais créditos você compra ou utiliza, mais vantagens desbloqueia."
        actions={
          <Button icon={<Icon name="chat" />} onClick={() => toast('Abrindo WhatsApp')}>
            Falar com o consultor
          </Button>
        }
      />

      <AutoGrid min={240}>
        <Card tone="ink" className={styles.categoria}>
          <div className={`${ui.eyebrow} ${ui.eyebrowOnInk}`}>Categoria atual</div>
          <div className={styles.categoriaNome}>{situacaoPrograma.categoria}</div>
          <div className={styles.categoriaNota}>
            Expira em {situacaoPrograma.expiraEm} · valores considerados a partir de{' '}
            {situacaoPrograma.cicloIniciadoEm}
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
              {situacaoPrograma.utilizados.atual} de {situacaoPrograma.utilizados.meta} · faltam{' '}
              {faltamParaGold.utilizados} para <b>{situacaoPrograma.proximaCategoria}</b>
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
              {situacaoPrograma.comprados.atual} de {situacaoPrograma.comprados.meta} · faltam{' '}
              {faltamParaGold.comprados} para <b>{situacaoPrograma.proximaCategoria}</b>
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
