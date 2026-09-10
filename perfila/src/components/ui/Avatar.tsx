import styles from './Avatar.module.css'

type AvatarProps = {
  /** Iniciais já calculadas (ver `initials` em lib/text). */
  children: string
  size?: 'md' | 'lg' | 'xl'
  tone?: 'muted' | 'ink'
  /**
   * URL **assinada** da foto, gerada no servidor depois da checagem de sessão
   * (ver `lib/storage.ts`). Ausente — ou expirada — cai nas iniciais, que é o
   * comportamento que a tela sempre teve.
   */
  src?: string | null
  /**
   * Texto alternativo da foto. Só faz sentido quando o avatar é a única
   * identificação na tela; ao lado do nome ele repetiria o que já está escrito,
   * e o padrão continua sendo decorativo.
   */
  alt?: string
}

/** Círculo com a foto da pessoa — ou com as iniciais, quando não há foto. */
export function Avatar({ children, size = 'lg', tone = 'muted', src, alt }: AvatarProps) {
  const classes = [styles.avatar, styles[size], styles[tone]].join(' ')

  if (src) {
    return (
      <span className={classes} aria-hidden={alt ? undefined : true}>
        {/* <img> puro, e não next/image: a URL é assinada e expira em minutos,
            então o otimizador do Next não teria o que cachear e ainda exigiria
            declarar o host do bucket em next.config — um domínio que muda de
            ambiente para ambiente. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.foto} src={src} alt={alt ?? ''} />
      </span>
    )
  }

  return (
    <span className={classes} aria-hidden>
      {children}
    </span>
  )
}
