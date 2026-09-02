import Link from 'next/link'

/**
 * 404 global — vale para URLs que não pertencem a nenhuma das duas
 * áreas, então não carrega a moldura de nenhuma delas.
 */
export default function NaoEncontrado() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 28,
        textAlign: 'center',
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: 'var(--radius-2xl)',
          background: 'var(--color-accent)',
          color: 'var(--color-on-ink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
          <path d="M4 18V10M10 18V6M16 18v-4M22 18V8" />
        </svg>
      </span>
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--fs-24)',
          fontWeight: 600,
          letterSpacing: 'var(--tracking-tight)',
        }}
      >
        Página não encontrada
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--fs-14)' }}>
        O endereço acessado não existe ou o registro foi removido.
      </p>
      <Link
        href="/"
        style={{
          height: 'var(--control-md)',
          padding: '0 var(--space-16)',
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-accent)',
          color: 'var(--color-on-ink)',
          fontSize: 'var(--fs-135)',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Ir para o início
      </Link>
    </main>
  )
}
