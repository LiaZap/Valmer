/**
 * Contrato do relatório
 * ---------------------
 * O relatório tem três origens de conteúdo, e a distinção importa:
 *
 * 1. CALCULADO  — os percentuais DISC, vindos das 28 respostas.
 * 2. ESTÁTICO   — tabelas por perfil (cargos, como liderar), iguais
 *                 para todo mundo com o mesmo perfil primário.
 * 3. GERADO     — a narrativa, escrita pela API da Anthropic para
 *                 aquela pessoa específica.
 *
 * Só a terceira origem custa dinheiro e pode variar entre execuções.
 * Manter as três separadas deixa o relatório renderizável mesmo sem
 * chave de API — útil para desenvolver, revisar layout e testar.
 */

import { z } from 'zod'
import type { CodigoRelatorio } from '@/data/planos'
import type { FatorDisc } from '@/data/dna'
import type { ResultadoDisc } from '@/lib/disc'

/** Os nove campos que a IA escreve. Nomes iguais aos da especificação. */
export type NarrativaRelatorio = {
  /** A essência do perfil, em 3 a 4 frases. */
  resumoPerfil: string
  /** Exatamente 5. */
  pontosFortes: string[]
  /** Exatamente 4. */
  desafios: string[]
  motivadores: string
  ambienteIdeal: string
  estiloComunicacao: string
  liderancaNatural: string
  /** Exatamente 3 ações práticas. */
  planoDesenvolvimento: string[]
  /** Frase de fecho, no formato "Você é alguém que…". */
  fraseDoPerfil: string
}

/**
 * O mesmo contrato em tempo de execução, para as duas fronteiras por onde
 * uma narrativa entra: a resposta da API, em `gerar.ts`, e o JSON lido do
 * banco, que pode ter sido gravado por uma versão anterior deste formato.
 *
 * Mora aqui, e não em `gerar.ts`, para quem lê do banco não precisar
 * arrastar junto o SDK da Anthropic. As contagens exatas são o que impede
 * o layout de quebrar com 6 pontos fortes onde cabem 5.
 */
export const esquemaNarrativa: z.ZodType<NarrativaRelatorio> = z.object({
  resumoPerfil: z.string().describe('3 a 4 frases sobre a essência desta pessoa'),
  pontosFortes: z.array(z.string()).length(5),
  desafios: z.array(z.string()).length(4),
  motivadores: z.string().describe('2 a 3 frases'),
  ambienteIdeal: z.string().describe('2 a 3 frases'),
  estiloComunicacao: z.string().describe('2 a 3 frases'),
  liderancaNatural: z.string().describe('2 a 3 frases'),
  planoDesenvolvimento: z.array(z.string()).length(3),
  fraseDoPerfil: z.string().describe('uma frase, começando com "Você é alguém que"'),
})

/** Tudo que a página do relatório precisa para renderizar. */
export type DadosRelatorio = {
  avaliado: { nome: string; email: string }
  facilitador: { nome: string; empresa: string; telefone: string }
  /** Data de emissão já formatada (dd/mm/aaaa). */
  emitidoEm: string
  tipoRelatorio: CodigoRelatorio
  resultado: ResultadoDisc
  narrativa: NarrativaRelatorio
}

/**
 * As seções do relatório, na ordem da especificação.
 * `desde` diz a partir de qual nível a seção aparece — é isso que
 * diferencia S1 de S4.
 */
export type SecaoRelatorio = {
  id: string
  titulo: string
  desde: CodigoRelatorio
}

export const SECOES: SecaoRelatorio[] = [
  { id: 'capa', titulo: 'Capa', desde: 'S1' },
  { id: 'resumo', titulo: 'Resumo do perfil', desde: 'S1' },
  { id: 'quem-voce-e', titulo: 'Quem você é', desde: 'S1' },
  { id: 'pontos-fortes', titulo: 'Seus pontos fortes', desde: 'S1' },
  { id: 'pontos-atencao', titulo: 'Pontos de atenção', desde: 'S1' },
  { id: 'o-que-te-move', titulo: 'O que te move', desde: 'S1' },
  { id: 'ambiente-ideal', titulo: 'Seu ambiente ideal', desde: 'S1' },
  { id: 'comunicacao', titulo: 'Como você se comunica', desde: 'S1' },
  { id: 'encaixe', titulo: 'Onde você se encaixa', desde: 'S1' },
  { id: 'lideranca', titulo: 'Seu estilo de liderança', desde: 'S2' },
  { id: 'como-liderar', titulo: 'Como liderar este perfil', desde: 'S2' },
  { id: 'plano', titulo: 'Plano de desenvolvimento', desde: 'S3' },
  { id: 'frase', titulo: 'Frase do perfil', desde: 'S1' },
]

const ORDEM_NIVEIS: CodigoRelatorio[] = ['S1', 'S2', 'S3', 'S4']

/** A seção entra neste nível de relatório? */
export function secaoVisivel(secao: SecaoRelatorio, nivel: CodigoRelatorio): boolean {
  return ORDEM_NIVEIS.indexOf(nivel) >= ORDEM_NIVEIS.indexOf(secao.desde)
}

export function secoesDoNivel(nivel: CodigoRelatorio): SecaoRelatorio[] {
  return SECOES.filter((secao) => secaoVisivel(secao, nivel))
}

/** Conteúdo fixo por fator — igual para todos que têm aquele perfil. */
export type PerfilEstatico = {
  fator: FatorDisc
  nome: string
  /** Uma linha que resume o fator. */
  resumo: string
  /** Traços observáveis de quem pontua alto neste fator. */
  caracteristicas: string[]
  /** Cargos e funções de alto encaixe. */
  cargos: string[]
  /** Orientações ao gestor sobre como conduzir este perfil. */
  comoLiderar: string[]
  /**
   * O que o gestor NUNCA deve fazer com este perfil.
   *
   * Campo próprio, e não mais um item de `comoLiderar`, por dois motivos.
   * O primeiro é que as cinco cláusulas do cliente cabem inteiras aqui: ao
   * serem espremidas numa linha só, três das cinco eram descartadas em cada
   * perfil, e a especificação chama esta seção de "o diferencial mais
   * solicitado por gestores e empresas". O segundo é o ícone: uma orientação
   * que começa por "Nunca" atrás de um sinal de confirmação diz uma coisa e
   * mostra a contrária.
   */
  oQueEvitar: string[]
}
