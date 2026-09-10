import { z } from "zod";

/**
 * O programa do curso: modulo, aula e o envio do video.
 *
 * Os limites de texto sao de TELA, e nao do banco — mesmo criterio de
 * `validators/curso.ts`: titulo que nao cabe na linha da trilha e cortado no
 * meio de uma palavra na aba do parceiro.
 *
 * O FORMATO E O TETO DO VIDEO NAO SAO CONFERIDOS AQUI. Quem sabe quais tipos o
 * bucket aceita e quanto cabe e `lib/storage.ts`, que ja recusa os dois casos
 * com `RecusaDeRegra` legivel. Repetir a lista neste arquivo criaria a segunda
 * fonte de verdade — a que ninguem lembra de atualizar junto — e arrastaria o
 * cliente do MinIO para dentro do modulo de validacao.
 */
export const moduloSchema = z.object({
  curso_id: z.string().uuid("Curso invalido"),
  titulo: z
    .string()
    .trim()
    .min(3, "Titulo do modulo muito curto")
    .max(120, "Titulo do modulo muito longo"),
});

export const aulaSchema = z.object({
  modulo_id: z.string().uuid("Modulo invalido"),
  titulo: z
    .string()
    .trim()
    .min(3, "Titulo da aula muito curto")
    .max(160, "Titulo da aula muito longo"),
});

/** O pedido de assinatura do envio, antes de o navegador mandar os bytes. */
export const assinarVideoSchema = z.object({
  aula_id: z.string().uuid("Aula invalida"),
  tipo: z.string().trim().min(1, "Formato do arquivo nao informado"),
  tamanho: z.number().int().positive("Arquivo vazio."),
});

/**
 * A confirmacao, depois de o navegador ter enviado direto para o bucket.
 *
 * `duracao_segundos` e opcional porque quem le a duracao e o navegador, no
 * proprio arquivo: quando ele nao consegue (codec que nao expoe metadado), o
 * campo vem ausente e a tela deixa de mostrar duracao — melhor que mostrar um
 * numero digitado a mao, que e o defeito que esta tela tinha.
 *
 * O teto de 24 horas nao e regra de negocio: e a faixa em que um `duration` do
 * navegador ainda e um numero de video, e nao o `Infinity` que alguns codecs
 * devolvem em stream sem indice.
 */
export const confirmarVideoSchema = z.object({
  aula_id: z.string().uuid("Aula invalida"),
  chave: z.string().trim().min(1, "Envio sem chave de objeto"),
  duracao_segundos: z.number().int().positive().max(86_400).optional(),
});

/**
 * Renomear so muda o TITULO.
 *
 * `curso_id`/`modulo_id` ficam de fora de proposito: aceita-los aqui deixaria a
 * tela mudar de pai um modulo ou uma aula pela porta de renomear, e mover
 * conteudo de curso e outra operacao, com outras consequencias de ordem.
 * O titulo reusa as mesmas regras dos schemas de criacao, e nao uma copia.
 */
export const renomearModuloSchema = moduloSchema.pick({ titulo: true });
export const renomearAulaSchema = aulaSchema.pick({ titulo: true });

export type CriarModulo = z.infer<typeof moduloSchema>;
export type CriarAula = z.infer<typeof aulaSchema>;
