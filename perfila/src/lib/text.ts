/** Pequenos utilitários de texto usados na apresentação dos dados. */

/**
 * Iniciais para avatar: primeira letra do primeiro e do último nome.
 * "Elias da Silva Maia" → "EM"
 */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 0) return ''
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/** Percentual inteiro formatado para largura de barra de progresso. */
export function percent(value: number, total: number): string {
  if (!total) return '0%'
  return `${Math.round((value / total) * 100)}%`
}
