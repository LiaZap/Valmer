import Link from 'next/link'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'dark'
  | 'warning'
  | 'ghost'
  | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Ícone à esquerda do rótulo. */
  icon?: ReactNode
  /** Ícone à direita do rótulo (setas, link externo). */
  iconRight?: ReactNode
  /** Ocupa 100% da largura disponível. */
  block?: boolean
  className?: string
  children?: ReactNode
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    /** Quando informado, o botão vira um link de navegação. */
    href?: string
    /** Com `href`, baixa o arquivo em vez de navegar até ele. */
    download?: boolean
  }

/**
 * Button
 * ------
 * Único componente de ação do sistema. Com `href` ele navega
 * (renderiza um <Link>), sem `href` ele executa (<button>).
 *
 * Com `download` ele sai como <a> puro, e não como <Link>: o prefetch do Link
 * chamaria a rota assim que o botão aparecesse na tela, e a rota de exportação
 * geraria o CSV — consulta ao banco inclusa — sem ninguém ter clicado.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  block,
  className,
  children,
  href,
  download,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    variant === 'link' ? null : styles[size],
    block ? styles.block : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {icon}
      {children}
      {iconRight}
    </>
  )

  if (href) {
    if (download) {
      return (
        <a href={href} download className={classes}>
          {content}
        </a>
      )
    }

    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} className={classes} {...rest}>
      {content}
    </button>
  )
}
