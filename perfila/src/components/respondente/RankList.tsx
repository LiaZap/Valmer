'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import styles from './RankList.module.css'

export type ItemOrdenavel = {
  id: string
  texto: string
  descricao: string
}

type RankListProps = {
  itens: ItemOrdenavel[]
  /** Devolve a ordem sempre que ela muda. */
  onChange?: (ordem: ItemOrdenavel[]) => void
}

/**
 * RankList
 * --------
 * Ordena um grupo do que MAIS ao que MENOS identifica a pessoa.
 *
 * Três formas de reordenar, de propósito: as setas (funcionam no
 * teclado e no celular), o arraste (mais rápido no mouse) e a
 * própria ordem visual. As setas são o caminho principal — arrastar
 * costuma falhar em tela sensível ao toque e é invisível para quem
 * navega por teclado.
 */
export function RankList({ itens, onChange }: RankListProps) {
  const [ordem, setOrdem] = useState(itens)
  const [aberto, setAberto] = useState<string | null>(null)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [alvo, setAlvo] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const primeiraRenderizacao = useRef(true)

  // Ao trocar de grupo, recomeça com a lista nova.
  useEffect(() => {
    setOrdem(itens)
    setAberto(null)
  }, [itens])

  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    onChange?.(ordem)
  }, [ordem, onChange])

  function reordenar(de: number, para: number) {
    if (para < 0 || para >= ordem.length) return
    const copia = [...ordem]
    const [movido] = copia.splice(de, 1)
    if (!movido) return
    copia.splice(para, 0, movido)
    setOrdem(copia)
    setAviso(`${movido.texto} movido para a posição ${para + 1} de ${copia.length}.`)
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.extremo}>
        <Icon name="chevU" size={14} />
        Mais me identifico
      </p>

      <ul className={styles.lista}>
        {ordem.map((item, indice) => (
          <li key={item.id}>
            <div
              className={[
                styles.item,
                arrastando === item.id ? styles.arrastando : null,
                alvo === item.id && arrastando !== item.id ? styles.alvo : null,
              ]
                .filter(Boolean)
                .join(' ')}
              draggable
              onDragStart={() => setArrastando(item.id)}
              onDragEnd={() => {
                setArrastando(null)
                setAlvo(null)
              }}
              onDragOver={(evento) => {
                evento.preventDefault()
                setAlvo(item.id)
              }}
              onDrop={(evento) => {
                evento.preventDefault()
                const origem = ordem.findIndex((linha) => linha.id === arrastando)
                if (origem >= 0) reordenar(origem, indice)
                setArrastando(null)
                setAlvo(null)
              }}
            >
              <span className={styles.posicao} aria-hidden>
                {indice + 1}
              </span>
              <span className={styles.texto}>{item.texto}</span>
              <span className={styles.controles}>
                <IconButton
                  icon="chevU"
                  label={`Mover ${item.texto} para cima`}
                  disabled={indice === 0}
                  onClick={() => reordenar(indice, indice - 1)}
                  iconSize={16}
                />
                <IconButton
                  icon="chevD"
                  label={`Mover ${item.texto} para baixo`}
                  disabled={indice === ordem.length - 1}
                  onClick={() => reordenar(indice, indice + 1)}
                  iconSize={16}
                />
                <IconButton
                  icon="info"
                  label={`O que significa ${item.texto}`}
                  aria-expanded={aberto === item.id}
                  onClick={() => setAberto((atual) => (atual === item.id ? null : item.id))}
                  iconSize={16}
                />
              </span>
            </div>
            {aberto === item.id ? <p className={styles.ajuda}>{item.descricao}</p> : null}
          </li>
        ))}
      </ul>

      <p className={styles.extremo}>
        <Icon name="chevD" size={14} />
        Menos me identifico
      </p>

      <p className={styles.aviso} role="status" aria-live="polite">
        {aviso}
      </p>
    </div>
  )
}
