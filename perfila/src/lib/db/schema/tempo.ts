/**
 * Opcoes padrao das colunas de tempo.
 *
 * `precision: 3` (milissegundos) nao e detalhe de gosto. O Postgres guarda
 * timestamp com microssegundos; o Date do JavaScript so tem milissegundos.
 * Sem a precisao alinhada, o valor lido pela tela nunca volta igual ao que
 * esta gravado — e o optimistic locking, que compara `updated_at` no WHERE,
 * recusa TODA gravacao com "registro alterado por outro usuario".
 *
 * Com fuso porque o servidor roda em UTC e o usuario esta no Brasil.
 */
export const TEMPO = { withTimezone: true, precision: 3 } as const;
