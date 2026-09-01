'use client'

import styles from './Toggle.module.css'

type ToggleProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Nome acessível do interruptor (não é exibido). */
  label: string
}

/**
 * Toggle
 * ------
 * Interruptor do sistema (40×22). Usa `role="switch"` para que
 * leitores de tela anunciem "ligado/desligado", e não "botão".
 */
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={styles.toggle}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.knob} />
    </button>
  )
}

/**
 * Versão apenas visual do interruptor, para quando a linha inteira já
 * é o controle (evita botão dentro de botão).
 */
export function ToggleVisual({ checked }: { checked: boolean }) {
  return (
    <span
      className={[styles.toggle, checked ? styles.on : null].filter(Boolean).join(' ')}
      aria-hidden
    >
      <span className={styles.knob} />
    </span>
  )
}
