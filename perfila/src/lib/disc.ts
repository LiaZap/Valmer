/**
 * Cálculo do perfil DISC
 * ----------------------
 * Cada questão vale +1 para o fator da opção escolhida. No fim, os
 * quatro contadores viram percentual sobre o total de questões:
 *
 *   percentual_X = (contador_X / 28) × 100
 *
 * O perfil primário é o fator de maior percentual e o secundário é o
 * segundo maior. O nome combinado junta os dois, na ordem.
 *
 * Nota sobre a especificação: em um trecho ela diz que os quatro
 * números somam 200. Não somam. Como cada resposta dá +1 a um único
 * fator, os contadores somam 28 e os percentuais somam 100. O
 * pseudocódigo da própria especificação confirma essa conta, então é
 * ela que está implementada aqui.
 */

import { ORDEM_FATORES, questoes } from '@/data/assessment'
import type { FatorDisc } from '@/data/dna'

/** Resposta escolhida por questão: código da questão → fator. */
export type Respostas = Record<string, FatorDisc>

export type ResultadoDisc = {
  contadores: Record<FatorDisc, number>
  percentuais: Record<FatorDisc, number>
  primario: FatorDisc
  secundario: FatorDisc
  /** Ex.: "DI" — primário seguido do secundário. */
  combinado: string
  respondidas: number
  total: number
}

/**
 * Percentuais inteiros que somam exatamente o total esperado.
 *
 * Arredondar cada fator isoladamente produz somas como 100,1 — e o
 * relatório afirma ao leitor que os quatro somam 100%. Quem confere
 * na mão encontra o erro. O método do maior resto arredonda para
 * baixo e distribui as unidades que sobraram para os fatores de maior
 * parte fracionária, garantindo que a soma feche.
 */
function percentuaisInteiros(
  contadores: Record<FatorDisc, number>,
  total: number,
  somaContadores: number,
): Record<FatorDisc, number> {
  const exatos = ORDEM_FATORES.map((fator) => ({
    fator,
    valor: (contadores[fator] / total) * 100,
  }))

  const percentuais = { D: 0, I: 0, S: 0, C: 0 } as Record<FatorDisc, number>
  for (const { fator, valor } of exatos) percentuais[fator] = Math.floor(valor)

  const alvo = Math.round((somaContadores / total) * 100)
  let faltam = alvo - ORDEM_FATORES.reduce((soma, f) => soma + percentuais[f], 0)

  const porResto = [...exatos].sort((a, b) => {
    const restoA = a.valor - Math.floor(a.valor)
    const restoB = b.valor - Math.floor(b.valor)
    if (restoB !== restoA) return restoB - restoA
    // Empate no resto: a ordem canônica mantém o resultado estável.
    return ORDEM_FATORES.indexOf(a.fator) - ORDEM_FATORES.indexOf(b.fator)
  })

  for (let i = 0; faltam > 0 && i < porResto.length; i += 1, faltam -= 1) {
    percentuais[porResto[i]!.fator] += 1
  }

  return percentuais
}

export function calcularPerfil(respostas: Respostas): ResultadoDisc {
  const contadores: Record<FatorDisc, number> = { D: 0, I: 0, S: 0, C: 0 }

  for (const questao of questoes) {
    const escolha = respostas[questao.codigo]
    if (escolha) contadores[escolha] += 1
  }

  return resultadoDeContadores(contadores, Object.keys(respostas).length)
}

/**
 * Mesma conta, a partir dos contadores já somados.
 *
 * Serve para quem lê um resultado guardado no banco em vez de
 * recalcular as respostas — e garante que os dois caminhos produzam
 * exatamente o mesmo perfil.
 */
export function resultadoDeContadores(
  contadores: Record<FatorDisc, number>,
  respondidas?: number,
): ResultadoDisc {
  const total = questoes.length
  const somaContadores = ORDEM_FATORES.reduce((soma, f) => soma + contadores[f], 0)
  const percentuais = percentuaisInteiros(contadores, total, somaContadores)

  // Empate é resolvido pela ordem canônica D → I → S → C, para que o
  // mesmo conjunto de respostas produza sempre o mesmo perfil.
  const ranking = [...ORDEM_FATORES].sort((a, b) => {
    const diferenca = percentuais[b] - percentuais[a]
    if (diferenca !== 0) return diferenca
    return ORDEM_FATORES.indexOf(a) - ORDEM_FATORES.indexOf(b)
  })

  const primario = ranking[0]!
  const secundario = ranking[1]!

  return {
    contadores,
    percentuais,
    primario,
    secundario,
    combinado: `${primario}${secundario}`,
    respondidas: respondidas ?? ORDEM_FATORES.reduce((soma, f) => soma + contadores[f], 0),
    total,
  }
}
