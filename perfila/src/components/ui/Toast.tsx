'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Icon } from './Icon'
import styles from './Toast.module.css'

/** Tempo que a mensagem permanece na tela. */
const DURACAO_MS = 2400

type ToastContextValue = {
  /** Exibe uma confirmação curta na base da tela. */
  toast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return context
}

/**
 * ToastProvider
 * -------------
 * Uma mensagem por vez: um novo aviso substitui o anterior e reinicia
 * a contagem, evitando pilha de notificações sobre a interface.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toast = useCallback((next: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(next)
    timerRef.current = setTimeout(() => setMessage(''), DURACAO_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={styles.viewport} role="status" aria-live="polite">
        {message ? (
          <div className={styles.toast}>
            <span className={styles.icon}>
              <Icon name="check" size={16} />
            </span>
            {message}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  )
}
