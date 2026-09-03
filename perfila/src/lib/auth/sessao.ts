import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessoes, usuarios } from "@/lib/db/schema";
import { hashDoToken } from "./senha";
import { COOKIE_SESSAO } from "./cookie";

export type Papel = "admin" | "facilitador";

export type Sessao = {
  userId: string;
  papel: Papel;
  nome: string;
};

export { COOKIE_SESSAO, DURACAO_SESSAO_MS } from "./cookie";

/**
 * Quem esta logado nesta requisicao.
 *
 * Le o cookie, procura a sessao viva pelo hash do token e devolve o usuario.
 * Uma sessao expirada ou revogada nao casa no WHERE e cai em null, entao nao
 * existe caminho em que um cookie velho continue valendo.
 *
 * Fora de producao aceita `SESSAO_DEV_USUARIO_ID` como atalho, para os testes
 * de integracao e scripts nao precisarem simular login. Em producao a variavel
 * e ignorada: o unico caminho e o cookie.
 */
export async function getSession(): Promise<Sessao | null> {
  const atalho = await sessaoDeDesenvolvimento();
  if (atalho) return atalho;

  const token = await tokenDoCookie();
  if (!token) return null;

  const [linha] = await db
    .select({
      userId: usuarios.id,
      papel: usuarios.papel,
      nome: usuarios.nome,
      ativo: usuarios.ativo,
    })
    .from(sessoes)
    .innerJoin(usuarios, eq(usuarios.id, sessoes.usuario_id))
    .where(
      and(
        eq(sessoes.token_hash, hashDoToken(token)),
        eq(sessoes.is_deleted, false),
        gt(sessoes.expira_em, new Date()),
        eq(usuarios.is_deleted, false),
      ),
    )
    .limit(1);

  // Desativar alguem no painel derruba o acesso na requisicao seguinte, sem
  // depender de apagar as sessoes dele uma a uma.
  if (!linha || !linha.ativo) return null;

  return { userId: linha.userId, papel: linha.papel, nome: linha.nome };
}

/**
 * Fora de uma requisicao do Next — um script de manutencao, um teste — nao
 * existe cookie a ler, e `cookies()` lanca. Sem requisicao nao ha sessao, que
 * e exatamente o que `null` diz; deixar o erro subir transformaria "ninguem
 * logado" em falha do script.
 */
async function tokenDoCookie(): Promise<string | undefined> {
  try {
    return (await cookies()).get(COOKIE_SESSAO)?.value;
  } catch {
    return undefined;
  }
}

async function sessaoDeDesenvolvimento(): Promise<Sessao | null> {
  if (process.env.NODE_ENV === "production") return null;

  const id = process.env.SESSAO_DEV_USUARIO_ID;
  if (!id) return null;

  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.id, id), eq(usuarios.is_deleted, false)))
    .limit(1);

  if (!usuario || !usuario.ativo) return null;

  return { userId: usuario.id, papel: usuario.papel, nome: usuario.nome };
}
