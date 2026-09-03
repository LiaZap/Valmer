/**
 * Entrar e sair da plataforma.
 *
 * O respondente nao passa por aqui: o assessment dele e sem cadastro, com o
 * token do link como credencial. Isto vale para admin e facilitador.
 */
"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessoes, usuarios } from "@/lib/db/schema";
import { registrarAuditoria } from "@/lib/audit/logger";
import { COOKIE_SESSAO, DURACAO_SESSAO_MS } from "@/lib/auth/cookie";
import { getSession } from "@/lib/auth/sessao";
import { conferirSenha, gerarHashSenha, hashDoToken, novoTokenSessao } from "@/lib/auth/senha";
import { loginSchema } from "@/lib/validators/auth";

/**
 * Uma mensagem so para credencial errada, e-mail inexistente e conta inativa.
 *
 * Distinguir os casos transforma o formulario em consulta: quem tenta um
 * e-mail e recebe "usuario nao encontrado" acabou de descobrir quem NAO e
 * cliente; recebendo "senha incorreta", descobriu quem e.
 */
const CREDENCIAL_INVALIDA = "E-mail ou senha incorretos.";

/**
 * Hash descartavel para o caminho do e-mail inexistente.
 *
 * Sem ele, o e-mail que existe demora ~100ms (o scrypt roda) e o que nao
 * existe responde na hora — o relogio entrega a lista de clientes mesmo com a
 * mensagem sendo a mesma.
 */
const HASH_ISCA =
  "scrypt$00000000000000000000000000000000$" + "0".repeat(128);

/**
 * ponytail: contador em memoria, por processo. Segura o ataque de forca bruta
 * de uma origem so; nao sobrevive a restart nem enxerga as outras instancias.
 * Trocar por Redis (ou uma tabela de tentativas) quando houver mais de um
 * processo servindo login.
 */
const TENTATIVAS_MAX = 5;
const JANELA_MS = 15 * 60 * 1000;
const tentativas = new Map<string, { contador: number; ate: number }>();

function registrarTentativa(chave: string): boolean {
  const agora = Date.now();
  const atual = tentativas.get(chave);

  if (!atual || agora > atual.ate) {
    tentativas.set(chave, { contador: 1, ate: agora + JANELA_MS });
    return true;
  }

  atual.contador += 1;
  return atual.contador <= TENTATIVAS_MAX;
}

export type ResultadoLogin = { ok: true; destino: string } | { ok: false; erro: string };

export async function login(email: string, senha: string): Promise<ResultadoLogin> {
  const validado = loginSchema.safeParse({ email, senha });
  if (!validado.success) return { ok: false, erro: CREDENCIAL_INVALIDA };

  if (!registrarTentativa(validado.data.email)) {
    return { ok: false, erro: "Muitas tentativas. Espere alguns minutos e tente de novo." };
  }

  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.email, validado.data.email), eq(usuarios.is_deleted, false)))
    .limit(1);

  const confere = await conferirSenha(validado.data.senha, usuario?.senha_hash ?? HASH_ISCA);
  if (!usuario || !usuario.ativo || !confere) return { ok: false, erro: CREDENCIAL_INVALIDA };

  const { token, hash } = novoTokenSessao();
  const expiraEm = new Date(Date.now() + DURACAO_SESSAO_MS);

  await db.insert(sessoes).values({
    usuario_id: usuario.id,
    token_hash: hash,
    expira_em: expiraEm,
    modified_by: usuario.id,
  });

  const store = await cookies();
  store.set(COOKIE_SESSAO, token, {
    // httpOnly tira o cookie do alcance de qualquer script na pagina, entao um
    // XSS nao vira sessao roubada.
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEm,
  });

  await registrarAuditoria({
    userId: usuario.id,
    acao: "criar",
    tabela: "sessoes",
    registroId: usuario.id,
    detalhes: `Entrou na plataforma como ${usuario.papel}`,
  });

  return { ok: true, destino: usuario.papel === "admin" ? "/admin" : "/facilitador" };
}

/**
 * Encerra a sessao desta requisicao.
 *
 * Marca a linha como apagada em vez de remover: a trilha precisa poder dizer
 * quando aquele acesso comecou e quando terminou.
 */
export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_SESSAO)?.value;
  const sessao = await getSession();

  if (token) {
    await db
      .update(sessoes)
      .set({
        is_deleted: true,
        deleted_at: new Date(),
        updated_at: new Date(),
        modified_by: sessao?.userId ?? "00000000-0000-0000-0000-000000000000",
      })
      .where(and(eq(sessoes.token_hash, hashDoToken(token)), eq(sessoes.is_deleted, false)));
  }

  store.delete(COOKIE_SESSAO);

  if (sessao) {
    await registrarAuditoria({
      userId: sessao.userId,
      acao: "atualizar",
      tabela: "sessoes",
      registroId: sessao.userId,
      detalhes: "Saiu da plataforma",
    });
  }
}

/**
 * Define a senha de um usuario. Exportada para o seed e para o admin.
 *
 * Nao valida sessao de proposito: quem chama e o seed (que roda com acesso
 * direto ao banco) e, no futuro, a tela do admin, que valida antes de chamar.
 */
export async function definirSenha(usuarioId: string, senha: string): Promise<void> {
  await db
    .update(usuarios)
    .set({
      senha_hash: await gerarHashSenha(senha),
      updated_at: new Date(),
      modified_by: usuarioId,
    })
    .where(eq(usuarios.id, usuarioId));
}
