import Link from 'next/link'
import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './IconButton.module.css'

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
  icon: IconName
  /** Descreve a ação: vira tooltip e nome acessível. Obrigatório. */
  label: string
  variant?: 'plain' | 'outline' | 'topbar' | 'pager'
  /** `danger` pinta o hover de vermelho (remover, excluir). */
  tone?: 'default' | 'danger'
  iconSize?: number
  /** Quando informado, navega em vez de executar. */
  href?: string
  className?: string
}

/**
 * IconButton
 * ----------
 * Ação representada só por ícone — usada nas linhas de tabela e em
 * cabeçalhos de card. O `label` é obrigatório justamente porque, sem
 * texto visível, ele é a única pista de significado para leitores de
 * tela e o texto do tooltip.
 */
export function IconButton({
  icon,
  label,
  variant = 'plain',
  tone = 'default',
  iconSize = 16,
  href,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const classes = [
    styles.iconButton,
    styles[variant],
    tone === 'danger' ? styles.danger : null,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (href) {
    return (
      <Link href={href} className={classes} title={label} aria-label={label}>
        <Icon name={icon} size={iconSize} />
      </Link>
    )
  }

  return (
    <button type={type} className={classes} title={label} aria-label={label} {...rest}>
      <Icon name={icon} size={iconSize} />
    </button>
  )
}
