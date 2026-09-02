import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";

export type Papel = "admin" | "facilitador";

export type Sessao = {
  userId: string;
  papel: Papel;
  nome: string;
};

/**
 * Sessao do usuario autenticado.
 *
 * AINDA NAO EXISTE LOGIN neste projeto (ver CONTINUIDADE.md). Ate existir,
 * esta funcao aceita o id de um usuario em SESSAO_DEV_USUARIO_ID e SO fora
 * de producao — em producao devolve null e toda action falha com
 * "Nao autenticado". E o suficiente para desenvolver e testar as actions
 * sem fingir seguranca no ar.
 *
 * Ao implementar o login (docs/oauth.md), trocar o corpo pela leitura do
 * cookie de sessao assinado. Nenhuma action precisa mudar.
 */
export async function getSession(): Promise<Sessao | null> {
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
