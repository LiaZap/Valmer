import type { ReactNode } from 'react'
import type { FatorDisc } from '@/data/dna'
import styles from './Meter.module.css'

const CLASSE_FATOR: Record<FatorDisc, string> = {
  D: styles.fatorD!,
  I: styles.fatorI!,
  S: styles.fatorS!,
  C: styles.fatorC!,
}

type MeterProps = {
  rotulo: string
  /** Valor de 0 a `maximo`. */
  valor: number
  maximo?: number
  /** Pinta a barra com a cor do fator DISC; sem isso usa o acento. */
  fator?: FatorDisc
}

/**
 * Meter
 * -----
 * Barra horizontal de uma medida só. O rótulo nomeia a medida e o
 * número fica ao lado do rótulo, fora da barra — assim continua
 * legível mesmo quando o valor é zero.
 */
export function Meter({ rotulo, valor, maximo = 100, fator }: MeterProps) {
  const proporcao = Math.max(0, Math.min(1, valor / maximo))

  return (
    <div className={styles.meter}>
      <div className={styles.topo}>
        <span className={styles.rotulo}>{rotulo}</span>
        <span className={styles.valor}>{valor}</span>
      </div>
      <div
        className={styles.trilho}
        role="meter"
        aria-label={rotulo}
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={maximo}
      >
        <div
          className={[
            styles.preenchimento,
            fator ? CLASSE_FATOR[fator] : null,
            valor === 0 ? styles.zero : null,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{ width: `${proporcao * 100}%` }}
        />
      </div>
    </div>
  )
}

/** Empilha medidas com o respiro padrão. */
export function MeterGroup({ children }: { children: ReactNode }) {
  return <div className={styles.grupo}>{children}</div>
}
