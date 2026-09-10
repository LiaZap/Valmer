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
  /** Só com `href`. `_blank` já sai com `rel="noopener"`. */
  target?: '_blank'
  /** Com `href`, baixa o arquivo em vez de navegar até ele. */
  download?: boolean
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
  target,
  download,
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
    // Mesmo motivo do `download` do Button: com <Link>, o prefetch chama a
    // rota assim que o botão aparece na tela, e a rota de exportação geraria o
    // CSV — consulta ao banco inclusa — sem ninguém ter clicado. Numa TABELA
    // isso acontece uma vez por linha visível.
    if (download) {
      return (
        <a href={href} download className={classes} title={label} aria-label={label}>
          <Icon name={icon} size={iconSize} />
        </a>
      )
    }

    return (
      <Link
        href={href}
        // `noopener` sempre que abrir em aba nova: sem ele a página de
        // destino recebe `window.opener` e pode navegar a aba de origem
        // para onde quiser. Aqui o destino é nosso, mas a regra vale para
        // o próximo uso, que pode não ser.
        target={target}
        rel={target === '_blank' ? 'noopener' : undefined}
        className={classes}
        title={label}
        aria-label={label}
      >
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
