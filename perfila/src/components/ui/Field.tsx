import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Icon } from './Icon'
import styles from './Field.module.css'

/**
 * Field
 * -----
 * Envolve qualquer controle com o rótulo padrão do sistema.
 * Aceita `children` como função para receber o `id` já ligado ao label.
 */
export function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: ReactNode | ((id: string) => ReactNode)
}) {
  const id = useId()

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {typeof children === 'function' ? children(id) : children}
    </div>
  )
}

export function Input({
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return <input className={[styles.input, className].filter(Boolean).join(' ')} {...rest} />
}

export function Textarea({
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return <textarea className={[styles.textarea, className].filter(Boolean).join(' ')} {...rest} />
}

/**
 * SearchInput
 * -----------
 * Caixa com lupa à esquerda. A borda e o anel de foco pertencem à
 * caixa, para que ícone e campo se comportem como um controle só.
 */
export function SearchInput({
  placeholder,
  rounded,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: {
  placeholder: string
  /** Raio maior — usado na busca da barra superior. */
  rounded?: boolean
  size?: 'md' | 'lg'
  className?: string
  'aria-label'?: string
}) {
  return (
    <div
      className={[styles.searchBox, rounded ? styles.searchBoxRounded : null, className]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon name="search" size={16} />
      <input
        type="search"
        className={[styles.searchInput, size === 'lg' ? styles.searchInputLg : null]
          .filter(Boolean)
          .join(' ')}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
      />
    </div>
  )
}
