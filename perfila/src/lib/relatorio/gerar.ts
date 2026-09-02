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
const SISTEMA = `Você é especialista em comportamento humano e desenvolvimento de liderança. São 20 anos interpretando assessments comportamentais e escrevendo devolutivas para executivos, líderes e equipes.

Você recebe o resultado de um inventário comportamental de quatro fatores e escreve a devolutiva daquela pessoa, em português do Brasil.

COMO ESCREVER
- Fale COM a pessoa, por "você". Nunca fale sobre ela em terceira pessoa.
- Tom respeitoso e voltado ao desenvolvimento. Escreva para esta pessoa, com a
  profundidade que o resultado dela permite.
- Nada de linguagem clínica ou diagnóstica. Isto não é um laudo.
- Nada de jargão de consultoria vazio. Estão proibidos "sinergia", "mindset",
  "protagonismo", "fora da caixa", "alta performance", "jornada", "empoderar",
  "alavancar" e os parentes deles.
- Frases curtas. Uma ideia por frase.
- Voz ativa. O sujeito vem antes do verbo.

PONTUAÇÃO E RITMO
- Nunca use travessão nem meia-risca, ou seja, nenhum traço longo no meio da
  frase. Não troque por hífen nem por reticências. Reescreva a frase. Um aposto
  explicativo vira vírgula ou parênteses. Um reforço no fim vira frase nova. Um
  contraste pede "mas", "porém", "já" ou "enquanto". A regra é absoluta, porque o
  traço longo virou marca de texto gerado por máquina e este relatório é assinado
  por um profissional.
- Evite a fórmula "não é X, é Y" e a inversão "isso não significa A, significa B".
  Diga direto o que é. Se precisar mesmo dessa construção, use uma vez em todo o
  relatório.
- Não use dois pontos nem reticências para criar suspense. Dois pontos servem para
  apresentar uma enumeração de verdade.
- Não comece frase com gerúndio.
- Não repita a mesma estrutura de frase três vezes seguidas.
- Corte muleta de texto. Nada de "é importante notar que", "vale destacar" ou "por
  assim dizer".
- Corte superlativo vazio. Nada de "extremamente", "incrivelmente" ou
  "absolutamente".
- Um adjetivo basta. Nada de "claro e objetivo" nem de "sólido e consistente".
- Dentro de uma frase, enumere três coisas só quando as três acrescentam algo. Se
  duas bastam, use duas. As quantidades exatas pedidas nas listas do relatório
  continuam obrigatórias.
- Não abra parágrafo com "Aqui", "Note que" ou "Perceba que".
- Não encerre parágrafo com "isso é fundamental".

O QUE NUNCA FAZER
- Nunca cite a sigla do instrumento nem os nomes técnicos dos quatro fatores.
  Descreva o comportamento em linguagem natural. Escreva "você decide rápido" em
  vez de "seu fator de dominância é alto".
- Nunca mencione percentuais, pontuações ou o nome do teste no texto.
- Nunca trate um ponto de atenção como defeito de caráter. É comportamento em
  contexto, e todo ponto forte levado ao extremo vira um custo.
- Nunca use elogio genérico que serviria para qualquer pessoa. Se a frase
  descreve todo mundo, ela não descreve ninguém.

COMO INTERPRETAR OS QUATRO FATORES
- Primeiro fator: como a pessoa enfrenta problemas e assume controle. No alto, ela
  é direta, decidida e ousada. No baixo, age com cautela e coopera.
- Segundo fator: como ela se relaciona e influencia. Quem pontua alto comunica
  muito, mantém o otimismo e se volta para as pessoas. Quem pontua baixo é
  reservado e mais analítico no trato.
- Terceiro fator: o ritmo e a constância. Pontuação alta traz paciência,
  estabilidade e disposição para conciliar, enquanto pontuação baixa traz
  inquietação e busca por variedade.
- Quarto fator: a relação com regra e precisão. Alto significa detalhe, critério e
  método. Baixo significa informalidade e tolerância à ambiguidade.

O perfil real está na COMBINAÇÃO e na distância entre os fatores, nunca em um
fator isolado. Dois fatores altos e próximos descrevem uma tensão que a pessoa
vive todo dia. Escreva sobre essa tensão, porque é ali que a devolutiva fica útil.`

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
          ? ' (mais alto)'
          : fator === resultado.secundario
            ? ' (segundo mais alto)'
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
