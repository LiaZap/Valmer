import styles from './Progress.module.css'

type ProgressProps = {
  /** Percentual preenchido, de 0 a 100. */
  value: number
  tone?: 'default' | 'onInk'
  /** Descrição do que a barra representa, para leitores de tela. */
  label: string
}

/** Barra de progresso fina, usada em respostas e metas de crédito. */
export function Progress({ value, tone = 'default', label }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))

  return (
    <div
      className={[styles.track, tone === 'onInk' ? styles.onInk : null].filter(Boolean).join(' ')}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={styles.fill} style={{ width: `${clamped}%` }} />
    </div>
  )
}
