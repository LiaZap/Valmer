/**
 * Nome e validade do cookie de sessao, isolados de proposito.
 *
 * O proxy roda no Edge Runtime e nao alcanca o banco nem o Node completo.
 * Importar isto de `sessao.ts` arrastaria o Better Auth e o driver do Postgres
 * junto, e toda rota protegida respondia 500. Um modulo sem dependencia
 * nenhuma resolve, e as duas pontas continuam lendo o mesmo nome.
 *
 * O nome e o que o Better Auth usa por padrao. Trocar exige `advanced.cookies`
 * na config e mudar aqui na mesma edicao.
 */
export const COOKIE_SESSAO = "better-auth.session_token";

/** Quanto tempo um login vale. O docs/oauth.md pede 24h. */
export const DURACAO_SESSAO_MS = 24 * 60 * 60 * 1000;
