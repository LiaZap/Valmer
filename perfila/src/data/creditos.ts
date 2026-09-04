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

/**
 * Indicadores do topo do Dashboard que ainda nao tem tabela no banco.
 *
 * Clientes, devolutivas e faturamento sao telas ainda nao construidas — os
 * numeros aqui sao de protótipo. O indicador de creditos saiu desta lista: ele
 * tem tabela (`creditos_transacoes`) e a pagina o monta a partir dela, porque
 * numero de credito inventado ao lado do saldo real e o que fez o parceiro
 * parar de acreditar nos dois.
 */
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
] as const
