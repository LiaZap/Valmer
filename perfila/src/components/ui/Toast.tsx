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

/**
 * Tempo que uma CONFIRMACAO permanece na tela.
 *
 * Recusa nao usa este numero: ela nao sai sozinha. Ver `toast` abaixo.
 */
const DURACAO_MS = 2400

/**
 * Tom da mensagem.
 *
 * Existe porque o toast era um selo de sucesso para tudo: recusa de regra,
 * saldo insuficiente, colisão de edição e "ainda não disponível" saíam com o
 * mesmo check de quem gravou, e a tela mentia sobre o que aconteceu.
 */
export type TomToast = 'ok' | 'aviso'

type ToastContextValue = {
  /** Exibe uma mensagem curta na base da tela. Use `aviso` para recusa e erro. */
  toast: (message: string, tom?: TomToast) => void
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
  const [message, setMessage] = useState<{ texto: string; tom: TomToast } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Confirmação sai sozinha; RECUSA ESPERA SER FECHADA.
   *
   * "Cliente cadastrado." é redundante com a linha que apareceu na lista, e
   * dois segundos e meio bastam. Uma recusa é o contrário: é a única cópia da
   * informação, costuma ser uma frase de instrução ("copie o link e envie por
   * fora, o envio automático depende do provedor de e-mail") e some antes de
   * ser lida — 2400ms não dão nem para terminar de ler vinte palavras.
   *
   * A regra é uma só, e não uma duração calculada por tamanho de texto: contar
   * caracteres seria adivinhar a velocidade de leitura de quem está do outro
   * lado, e errar para os dois lados. Quem fecha é quem leu.
   */
  const toast = useCallback((next: string, tom: TomToast = 'ok') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage({ texto: next, tom })
    timerRef.current =
      tom === 'aviso' ? null : setTimeout(() => setMessage(null), DURACAO_MS)
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/*
        DUAS regiões vivas, e não uma com `aria-live` trocado no ar: leitor de
        tela lê o atributo quando a região é criada, e mudar o valor de uma
        região já montada não é anunciado de forma confiável. Assim a recusa
        interrompe (`assertive`) e a confirmação espera a vez (`polite`) — a
        mesma diferença que a cor faz para quem enxerga.
      */}
      <div className={styles.viewport} role="status" aria-live="polite">
        {message && message.tom === 'ok' ? <Mensagem texto={message.texto} tom="ok" /> : null}
      </div>
      <div className={styles.viewport} role="alert" aria-live="assertive">
        {message && message.tom === 'aviso' ? (
          <Mensagem texto={message.texto} tom="aviso" onFechar={() => setMessage(null)} />
        ) : null}
      </div>
    </ToastContext.Provider>
  )
}

function Mensagem({
  texto,
  tom,
  onFechar,
}: {
  texto: string
  tom: TomToast
  onFechar?: () => void
}) {
  return (
    <div className={tom === 'aviso' ? `${styles.toast} ${styles.aviso}` : styles.toast}>
      <span className={styles.icon}>
        <Icon name={tom === 'aviso' ? 'alert' : 'check'} size={16} />
      </span>
      {texto}
      {onFechar ? (
        <button type="button" className={styles.fechar} onClick={onFechar} aria-label="Fechar aviso">
          <Icon name="fechar" size={14} />
        </button>
      ) : null}
    </div>
  )
}
