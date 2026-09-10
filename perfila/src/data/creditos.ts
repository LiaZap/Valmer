/**
 * O que sobrou do protótipo de créditos.
 *
 * Os saldos saíram daqui: crédito vem de `creditos_transacoes` e degustação de
 * `usuarios.creditos_degustacao`, os dois por `lib/painel.ts`. Os números fixos
 * que moravam neste arquivo apareciam ao lado dos reais na mesma tela,
 * discordando deles.
 */

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
