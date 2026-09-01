import styles from './Avatar.module.css'

type AvatarProps = {
  /** Iniciais já calculadas (ver `initials` em lib/text). */
  children: string
  size?: 'md' | 'lg'
  tone?: 'muted' | 'ink'
}

/** Círculo com as iniciais da pessoa — substitui a foto. */
export function Avatar({ children, size = 'lg', tone = 'muted' }: AvatarProps) {
  return (
    <span className={[styles.avatar, styles[size], styles[tone]].join(' ')} aria-hidden>
      {children}
    </span>
  )
}
