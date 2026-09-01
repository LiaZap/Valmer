/** Opções dos campos de seleção usados nas telas. */

export const opcoes = {
  periodo: ['Mensal', 'Semanal', 'Diário'],
  idioma: ['Português', 'English', 'Español'],
  degustacao: ['Todas', 'Com degustação', 'Sem degustação'],
  /** Filtro de tipo de relatório (inclui a opção "Todos"). */
  relatorioFiltro: ['Todos', 'DISC', 'DISC + Tipos Psicológicos + Valores'],
  /** Campo obrigatório: começa em "Selecione", exibido como placeholder. */
  area: ['Selecione', 'Global', 'Pessoal', 'Profissional'],
  relatorio: ['DISC + Tipos Psicológicos + Valores', 'DISC'],
  status: ['Todos', 'Finalizada', 'Pausado'],
  relatorioDegustacao: ['DISC (resumo)', 'DISC completo'],
} as const
