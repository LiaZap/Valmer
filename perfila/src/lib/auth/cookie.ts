/**
 * Nome e validade do cookie de sessao, isolados de proposito.
 *
 * O middleware roda no Edge Runtime, que nao tem `node:crypto`. Importar isto
 * de `sessao.ts` arrastava `senha.ts` e o crypto junto, e toda rota protegida
 * respondia 500. Um modulo sem dependencia nenhuma resolve, e as duas pontas
 * continuam lendo o mesmo nome.
 */
export const COOKIE_SESSAO = "perfila_sessao";

/** Quanto tempo um login vale. O docs/oauth.md pede 24h. */
export const DURACAO_SESSAO_MS = 24 * 60 * 60 * 1000;
