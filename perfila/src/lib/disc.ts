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

export function calcularPerfil(respostas: Respostas): ResultadoDisc {
  const total = questoes.length
  const contadores: Record<FatorDisc, number> = { D: 0, I: 0, S: 0, C: 0 }

  for (const questao of questoes) {
    const escolha = respostas[questao.codigo]
    if (escolha) contadores[escolha] += 1
  }

  const percentuais: Record<FatorDisc, number> = { D: 0, I: 0, S: 0, C: 0 }
  for (const fator of ORDEM_FATORES) {
    percentuais[fator] = Math.round((contadores[fator] / total) * 1000) / 10
  }

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
    respondidas: Object.keys(respostas).length,
    total,
  }
}
