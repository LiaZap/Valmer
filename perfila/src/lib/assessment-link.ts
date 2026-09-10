/**
 * O link do avaliado: o token que vai na URL e o prazo dele.
 *
 * Mora fora das actions porque `actions/assessments.ts` e `actions/envio-lote.ts`
 * criam o MESMO objeto — um mapa com link — e um modulo "use server" so pode
 * exportar funcao assincrona, entao nao ha como um importar a constante do
 * outro. Sem este arquivo, o prazo seria digitado duas vezes, e no dia em que
 * alguem mudasse para 14 dias num lugar so, o link criado pela tela de novo
 * mapa e o criado pelo envio rapido venceriam em dias diferentes — com o
 * facilitador sem nenhuma forma de descobrir qual dos dois vale.
 */
import { randomBytes } from "node:crypto";

/** Por quantos dias o link de avaliacao continua valendo. */
export const DIAS_VALIDADE = 7;

/** Token do link /avaliacao/<token>. 12 caracteres hexadecimais. */
export function novoToken(): string {
  return randomBytes(6).toString("hex");
}

/**
 * Quando o link para de valer, contado de agora.
 *
 * Recebe o instante em vez de chamar `Date.now()` por dentro: num lote os
 * mapas nascem no mesmo COMMIT, e calcular por mapa faria o primeiro e o
 * ultimo da mesma turma expirarem com milissegundos de diferenca — uma
 * diferenca que nao significa nada e que aparece na tela como dois prazos.
 */
export function validadeDoLink(agora: Date): Date {
  return new Date(agora.getTime() + DIAS_VALIDADE * 24 * 60 * 60 * 1000);
}
