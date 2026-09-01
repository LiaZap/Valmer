/**
 * Marca Perfila
 * -------------
 * Quatro barras de altura desigual dentro de um quadrado verde:
 * lê como "perfil" (as barras de um gráfico DISC) e funciona bem
 * reduzida, no favicon e na sidebar recolhida.
 */
export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 18V10M10 18V6M16 18v-4M22 18V8" />
    </svg>
  )
}
