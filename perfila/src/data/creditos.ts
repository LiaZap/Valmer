/** Saldos de créditos e de degustação. */

export const creditos = {
  saldo: 2,
  vitalicios: 2,
  aExpirar: 0,
  /** Data de expiração dos créditos com prazo ("N/D" quando não há). */
  expiraEm: 'N/D',
  utilizadosNoCiclo: 71,
  metaDoCiclo: 80,
  cicloIniciadoEm: '06/01/2026',
}

export const degustacao = {
  saldo: 180,
  vitalicios: 180,
  aExpirar: 0,
  expiraEm: 'N/D',
  utilizadas: 3,
}

/** Indicadores do topo do Dashboard. */
export const indicadores = [
  {
    label: 'Total de clientes',
    icon: 'users',
    valor: '227',
    nota: '5 novos nos últimos 30 dias',
  },
  {
    label: 'Devolutivas',
    icon: 'chat',
    valor: '42h26',
    nota: '15 realizadas',
  },
  {
    label: 'Total faturado',
    icon: 'dollar',
    valor: 'R$ 0,00',
    nota: 'Nenhuma venda no período',
  },
  {
    label: 'Créditos utilizados',
    icon: 'card',
    valor: '2',
    nota: '3 de degustação · 0 da plataforma',
  },
] as const
