/**
 * Porta de entrada das telas com login.
 *
 * O middleware so confere que o cookie EXISTE — ele roda no Edge Runtime e nao
 * alcanca o banco. Quem decide se a sessao vale e este modulo, chamado pelos
 * layouts de /admin e /facilitador: um cookie inventado a mao passa pelo
 * middleware e para aqui.
 *
 * Devolve tambem a linha do usuario porque toda tela precisa dela no cabecalho
 * (empresa e saldo), e buscar de novo em cada uma seria uma consulta por tela.
 */
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { getSession, type Sessao } from "./sessao";

export type ContaDaSessao = {
  empresa: string | null;
  /**
   * CHAVE do objeto da foto no bucket, nunca a URL — ver `lib/storage.ts`.
   * Quem desenha a tela troca por uma URL assinada de prazo curto.
   */
  imagem: string | null;
  telefone: string | null;
  creditos: number;
  email: string;
  /**
   * Sempre `true` por construcao — `getSession` ja devolve null para conta
   * desativada. Vem junto assim mesmo porque a tela de perfil MOSTRA a
   * situacao, e mostrar um valor deduzido em vez do gravado e como a tela
   * comeca a divergir do banco.
   */
  ativo: boolean;
};

export async function exigirSessaoNaTela(
  origem: string,
): Promise<{ sessao: Sessao; conta: ContaDaSessao }> {
  const sessao = await getSession();
  // `proximo` traz a pessoa de volta para a tela que ela pediu, em vez de
  // largar todo mundo na raiz do ambiente depois de entrar.
  if (!sessao) redirect(`/?proximo=${encodeURIComponent(origem)}`);

  const [conta] = await db
    .select({
      empresa: usuarios.empresa,
      imagem: usuarios.image,
      telefone: usuarios.telefone,
      creditos: usuarios.creditos,
      email: usuarios.email,
      ativo: usuarios.ativo,
    })
    .from(usuarios)
    .where(and(eq(usuarios.id, sessao.userId), eq(usuarios.is_deleted, false)))
    .limit(1);

  // A sessao existe mas o usuario sumiu: estado impossivel pelo caminho normal,
  // e melhor mandar para o login do que renderizar a tela sem dono.
  if (!conta) redirect("/");

  return { sessao, conta };
}
