/**
 * Geração da narrativa do relatório
 * ---------------------------------
 * Este módulo é a única parte do relatório que chama a API da Anthropic.
 * Roda SOMENTE no servidor: a chave de API nunca pode chegar ao navegador.
 * Não importe este arquivo de um componente marcado com 'use client'.
 *
 * O que sai daqui são os nove campos de texto do relatório. Os
 * percentuais e as tabelas por perfil não passam por aqui — são
 * calculados e fixos, e gastar tokens com eles seria pagar para a
 * IA repetir o que já sabemos.
 */

import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { NOMES_FATORES } from '@/data/assessment'
import type { FatorDisc } from '@/data/dna'
import type { ResultadoDisc } from '@/lib/disc'
import type { NarrativaRelatorio } from './tipos'

/**
 * O esquema é o contrato: a API é obrigada a devolver exatamente esta
 * forma, com as contagens exatas de itens. Sem isso, o layout do
 * relatório quebra quando vêm 6 pontos fortes em vez de 5.
 */
const EsquemaNarrativa = z.object({
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

/**
 * O prompt de sistema é idêntico em todos os relatórios, então vale
 * marcá-lo para cache: a partir do segundo relatório, ele é cobrado
 * como leitura de cache.
 *
 * Ressalva honesta: o cache só entra em vigor acima de um mínimo de
 * tokens no prefixo (varia por modelo, entre 512 e 4096). Se este
 * texto encolher, o cache silenciosamente para de valer — confira
 * `usage.cache_read_input_tokens` na resposta antes de assumir que
 * está funcionando.
 */
const SISTEMA = `Você é especialista em comportamento humano e desenvolvimento de liderança, com 20 anos de experiência interpretando assessments comportamentais e escrevendo devolutivas para executivos, líderes e equipes.

Você recebe o resultado de um inventário comportamental de quatro fatores e escreve a devolutiva daquela pessoa, em português do Brasil.

COMO ESCREVER
- Fale COM a pessoa, por "você". Nunca fale sobre ela em terceira pessoa.
- Tom profundo, personalizado, respeitoso e orientado ao desenvolvimento.
- Nada de linguagem clínica, fria ou diagnóstica. Isto não é um laudo.
- Nada de jargão de consultoria vazio: "sinergia", "mindset", "protagonismo",
  "fora da caixa", "alta performance" e parentes estão proibidos.
- Frases curtas. Uma ideia por frase.

O QUE NUNCA FAZER
- Nunca cite a sigla do instrumento nem os nomes técnicos dos quatro fatores.
  Descreva o comportamento em linguagem natural: "você decide rápido", não
  "seu fator de dominância é alto".
- Nunca mencione percentuais, pontuações ou o nome do teste no texto.
- Nunca trate um ponto de atenção como defeito de caráter. É comportamento em
  contexto, e todo ponto forte levado ao extremo vira um custo.
- Nunca use elogio genérico que serviria para qualquer pessoa. Se a frase
  descreve todo mundo, ela não descreve ninguém.

COMO INTERPRETAR OS QUATRO FATORES
- Primeiro fator: como a pessoa enfrenta problemas e assume controle. Alto, ela é
  direta, decidida e ousada; baixo, é cautelosa e cooperativa.
- Segundo fator: como se relaciona e influencia. Alto, é comunicativa, otimista e
  voltada para pessoas; baixo, é reservada e mais analítica no trato.
- Terceiro fator: o ritmo e a constância. Alto, é paciente, estável e conciliadora;
  baixo, é inquieta e busca variedade.
- Quarto fator: a relação com regra e precisão. Alto, é detalhista, criteriosa e
  metódica; baixo, é informal e tolerante à ambiguidade.

O perfil real está na COMBINAÇÃO e na distância entre os fatores, nunca em um
fator isolado. Dois fatores altos e próximos descrevem uma tensão que a pessoa
vive todo dia — escreva sobre essa tensão, é ali que a devolutiva fica útil.`

export type EntradaNarrativa = {
  nome: string
  resultado: ResultadoDisc
}

/** Erro de negócio: a API respondeu, mas não com o relatório. */
export class FalhaNaNarrativa extends Error {
  constructor(
    message: string,
    readonly causa: 'recusa' | 'formato' | 'configuracao',
  ) {
    super(message)
    this.name = 'FalhaNaNarrativa'
  }
}

function linhaDoFator(fator: FatorDisc, resultado: ResultadoDisc, posicao: string): string {
  return `- ${NOMES_FATORES[fator]} (${fator}): ${resultado.percentuais[fator]}%${posicao}`
}

export async function gerarNarrativa({
  nome,
  resultado,
}: EntradaNarrativa): Promise<NarrativaRelatorio> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new FalhaNaNarrativa(
      'ANTHROPIC_API_KEY não está definida no servidor.',
      'configuracao',
    )
  }

  const client = new Anthropic()

  const fatores = (['D', 'I', 'S', 'C'] as FatorDisc[])
    .map((fator) => {
      const posicao =
        fator === resultado.primario
          ? ' — mais alto'
          : fator === resultado.secundario
            ? ' — segundo mais alto'
            : ''
      return linhaDoFator(fator, resultado, posicao)
    })
    .join('\n')

  const resposta = await client.beta.messages.parse({
    model: 'claude-opus-5',
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    // Se o modelo recusar por política, o servidor tenta a substituição
    // padrão dele em vez de devolver o relatório vazio para o avaliado.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: `Escreva a devolutiva desta pessoa.

Nome: ${nome}

Resultado do inventário:
${fatores}

Combinação predominante: ${resultado.combinado}

Escreva todos os campos pedidos, respeitando as quantidades exatas de itens nas listas.`,
      },
    ],
    output_config: { format: betaZodOutputFormat(EsquemaNarrativa) },
  })

  // Em uma recusa a resposta chega com HTTP 200 e conteúdo vazio, então
  // é preciso olhar o motivo de parada antes de ler o conteúdo.
  if (resposta.stop_reason === 'refusal') {
    throw new FalhaNaNarrativa(
      `O modelo recusou gerar a narrativa (${resposta.stop_details?.category ?? 'sem categoria'}).`,
      'recusa',
    )
  }

  if (!resposta.parsed_output) {
    throw new FalhaNaNarrativa(
      'A resposta não veio no formato esperado do relatório.',
      'formato',
    )
  }

  return resposta.parsed_output
}
