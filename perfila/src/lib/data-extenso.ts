/**
 * Saudação e data por extenso, em pt-BR.
 * Calculado no fuso de Brasília para não depender do relógio do
 * servidor onde a aplicação estiver rodando.
 */

const FUSO = 'America/Sao_Paulo'

function horaEmBrasilia(date: Date): number {
  const hora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    hour: 'numeric',
    hour12: false,
  }).format(date)
  return Number(hora)
}

/** "Bom dia" / "Boa tarde" / "Boa noite" conforme o horário. */
export function saudacao(date: Date = new Date()): string {
  const hora = horaEmBrasilia(date)
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

/**
 * "terça, 1 de setembro"
 * O pt-BR devolve "terça-feira"; cortamos o sufixo para uma linha
 * de contexto mais curta no cabeçalho do Dashboard.
 */
export function dataPorExtenso(date: Date = new Date()): string {
  const diaSemana = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, weekday: 'long' })
    .format(date)
    .replace('-feira', '')

  const diaMes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO,
    day: 'numeric',
    month: 'long',
  }).format(date)

  return `${diaSemana}, ${diaMes}`
}
