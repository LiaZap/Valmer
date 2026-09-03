import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { auth } from "./config";

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
 * O formato de retorno e o mesmo de antes do Better Auth entrar, de proposito:
 * as actions de assessment ja dependiam dele, e trocar a biblioteca de
 * autenticacao nao e motivo para mexer em regra de negocio.
 *
 * Fora de producao aceita `SESSAO_DEV_USUARIO_ID` como atalho, para os testes
 * de integracao e scripts nao precisarem simular login. Em producao a variavel
 * e ignorada: o unico caminho e o cookie.
 */
export async function getSession(): Promise<Sessao | null> {
  const atalho = await sessaoDeDesenvolvimento();
  if (atalho) return atalho;

  const sessao = await sessaoDoBetterAuth();
  if (!sessao) return null;

  // O usuario vem junto na resposta, mas com os campos que a biblioteca
  // conhece: `ativo` e `papel` sao nossos, entao a checagem vem daqui.
  const usuario = sessao.user as { id: string; nome?: string; name?: string; papel?: string; ativo?: boolean };
  if (usuario.ativo === false) return null;

  return {
    userId: usuario.id,
    papel: (usuario.papel as Papel) ?? "facilitador",
    nome: usuario.nome ?? usuario.name ?? "",
  };
}

/**
 * Fora de uma requisicao do Next — um script de manutencao, um teste — nao ha
 * cabecalho a ler e a biblioteca lanca. Sem requisicao nao ha sessao, que e
 * exatamente o que `null` diz.
 *
 * `unstable_rethrow` esta aqui porque ler cabecalho tambem e como o Next
 * descobre que a pagina depende da requisicao: durante o build ele interrompe
 * a renderizacao com um erro proprio, para marcar a rota como dinamica. Um
 * `catch` que engole esse sinal faz o build acreditar que a tela e estatica e
 * renderiza-la sem sessao — foi assim que `/admin` quebrou no `next build`.
 * Redirect e notFound viajam pelo mesmo caminho.
 */
async function sessaoDoBetterAuth() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (erro) {
    unstable_rethrow(erro);
    return null;
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
