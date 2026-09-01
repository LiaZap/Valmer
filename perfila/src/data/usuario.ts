/** Analista autenticado (dados de exemplo do protótipo). */

export const usuario = {
  nome: 'Valmer Albuquerque',
  nomeCompleto: 'Valmer Albuquerque dos Santos',
  iniciais: 'VA',
  papel: 'Analista',
  categoria: 'Membro',
  creditos: 2,
  degustacoes: 180,
} as const

/** Linha secundária do chip de usuário no topo. */
export const usuarioResumo = `${usuario.papel} · ${usuario.categoria} · ${usuario.creditos} créditos`
