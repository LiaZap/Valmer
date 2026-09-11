'use client'

import { useMemo, useState } from 'react'
import { Select } from '@/components/ui/Select'
import type { Transacao } from '@/data/facilitadores'
import { opcoes } from '@/data/opcoes'
import { agruparCreditos, tetoDoGrafico, type Periodo } from '@/lib/grafico-creditos'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

/**
 * Movimento de crédito do parceiro, por período.
 *
 * Substituiu um parágrafo fixo que dizia "ainda não há vendas suficientes"
 * mesmo com o extrato cheio, ao lado de um seletor de período que não filtrava
 * nada. O gráfico prometido nunca existiu.
 *
 * NÃO É "vendas": a plataforma não sabe por quanto o parceiro revende ao
 * cliente final dele. O que ela sabe é o crédito que entrou e o que foi gasto,
 * e é isso que o cartão mostra agora — com o nome certo.
 *
 * Barras em CSS, e não biblioteca de gráfico: são duas séries e no máximo
 * catorze colunas. Uma dependência de gráfico aqui custaria mais no pacote do
 * que o cartão inteiro entrega.
 *
 * Os dados chegam prontos do servidor, do MESMO extrato que o resto da página
 * já carregou. Uma consulta própria abriria a porta para o gráfico e o extrato
 * discordarem.
 */
export function GraficoCreditos({ movimentos }: { movimentos: Transacao[] }) {
  const [periodo, setPeriodo] = useState<Periodo>(opcoes.periodo[0])

  const colunas = useMemo(() => agruparCreditos(movimentos, periodo), [movimentos, periodo])
  const teto = tetoDoGrafico(colunas)

  return (
    <>
      <div className={`${ui.sectionHead} ${styles.graficoHead}`}>
        <div className={ui.cardTitle}>Créditos por período</div>
        <div className={styles.legenda}>
          <span className={styles.legendaItem}>
            <i className={`${styles.legendaPonto} ${styles.legendaPago}`} />
            Comprados
          </span>
          <span className={styles.legendaItem}>
            <i className={`${styles.legendaPonto} ${styles.legendaFaturado}`} />
            Utilizados
          </span>
          <div className={styles.legendaSelect}>
            <Select
              options={opcoes.periodo}
              value={periodo}
              onChange={(valor) => setPeriodo(valor as Periodo)}
              size="sm"
              label="Período do gráfico"
            />
          </div>
        </div>
      </div>

      <div className={styles.grafico}>
        {colunas.length === 0 ? (
          <p className={styles.graficoAviso}>
            Nenhum movimento de crédito ainda. Assim que você receber ou usar créditos, eles
            aparecem aqui.
          </p>
        ) : (
          <div className={styles.barras}>
            {colunas.map((coluna) => (
              <div className={styles.barraGrupo} key={coluna.rotulo}>
                <div className={styles.barraPar}>
                  {/* O título é a única forma de ler o número exato: a altura
                      sozinha responde "qual é maior", nunca "quanto". */}
                  <i
                    className={`${styles.barra} ${styles.barraComprados}`}
                    style={{ height: `${(coluna.comprados / teto) * 100}%` }}
                    title={`${coluna.comprados} comprado(s)`}
                  />
                  <i
                    className={`${styles.barra} ${styles.barraUtilizados}`}
                    style={{ height: `${(coluna.utilizados / teto) * 100}%` }}
                    title={`${coluna.utilizados} utilizado(s)`}
                  />
                </div>
                <span className={styles.barraRotulo}>{coluna.rotulo}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
