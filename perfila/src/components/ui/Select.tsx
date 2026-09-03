'use client'

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Icon } from './Icon'
import styles from './Select.module.css'

type SelectProps = {
  options: readonly string[]
  /** Valor inicial. Sem ele, assume a primeira opção. */
  defaultValue?: string
  /**
   * Valor controlado. Com ele, quem renderiza manda no que aparece — é o que
   * permite um botão "Limpar" devolver o campo para "Todas". Sem ele, o
   * componente guarda a escolha sozinho, como as telas antigas esperam.
   */
  value?: string
  onChange?: (value: string) => void
  size?: 'md' | 'sm'
  /** Nome acessível — normalmente o mesmo texto do <Field>. */
  label: string
  id?: string
}

/**
 * Select
 * ------
 * Dropdown próprio do sistema, em vez do <select> nativo: painel
 * flutuante com sombra, item ativo destacado com check e animação de
 * abertura. Fecha ao clicar fora ou com Esc, e navega por teclado
 * (setas, Home/End, Enter) seguindo o padrão de combobox.
 */
export function Select({
  options,
  defaultValue,
  value: valorControlado,
  onChange,
  size = 'md',
  label,
  id,
}: SelectProps) {
  const fallbackId = useId()
  const triggerId = id ?? fallbackId
  const listId = `${triggerId}-list`

  const [open, setOpen] = useState(false)
  const [valorInterno, setValorInterno] = useState(() => defaultValue ?? options[0] ?? '')
  const value = valorControlado ?? valorInterno

  const indiceDoValor = Math.max(0, options.indexOf(value))
  const [activeIndex, setActiveIndex] = useState(indiceDoValor)

  // Com o painel fechado, a navegação recomeça de onde o valor está. É isso
  // que faz um "Limpar" de fora reposicionar o cursor junto com o rótulo, em
  // vez de reabrir a lista no item escolhido antes.
  useEffect(() => {
    if (!open) setActiveIndex(indiceDoValor)
  }, [open, indiceDoValor])

  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLLIElement | null)[]>([])

  // Fecha ao clicar fora do componente.
  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  // Mantém a opção navegada visível dentro do painel rolável.
  useEffect(() => {
    if (!open) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  function select(option: string) {
    setValorInterno(option)
    setActiveIndex(options.indexOf(option))
    setOpen(false)
    onChange?.(option)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (!open) setOpen(true)
        else setActiveIndex((index) => Math.min(index + 1, last))
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!open) setOpen(true)
        else setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case 'Home':
        if (open) {
          event.preventDefault()
          setActiveIndex(0)
        }
        break
      case 'End':
        if (open) {
          event.preventDefault()
          setActiveIndex(last)
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (open) {
          const option = options[activeIndex]
          if (option !== undefined) select(option)
        } else {
          setOpen(true)
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          setOpen(false)
        }
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        break
    }
  }

  // "Selecione" funciona como placeholder, não como valor escolhido.
  const isPlaceholder = /^selecione/i.test(value)

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        id={triggerId}
        className={[styles.trigger, size === 'sm' ? styles.sm : null, open ? styles.triggerOpen : null]
          .filter(Boolean)
          .join(' ')}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        aria-label={label}
      >
        <span className={[styles.value, isPlaceholder ? styles.placeholder : null].filter(Boolean).join(' ')}>
          {value}
        </span>
        <Icon
          name="chevD"
          size={16}
          className={[styles.chevron, open ? styles.chevronOpen : null].filter(Boolean).join(' ')}
        />
      </button>

      {open ? (
        <ul className={styles.panel} id={listId} role="listbox" aria-label={label}>
          {options.map((option, index) => {
            const selected = option === value
            return (
              <li
                key={option}
                id={`${listId}-${index}`}
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                role="option"
                aria-selected={selected}
                className={[
                  styles.option,
                  index === activeIndex ? styles.optionActive : null,
                  selected ? styles.optionSelected : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => select(option)}
                onMouseEnter={() => setActiveIndex(index)}
              >
                <span className={styles.optionLabel}>{option}</span>
                {selected ? (
                  <Icon name="check" size={14} strokeWidth={2.2} className={styles.check} />
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
