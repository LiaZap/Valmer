/**
 * Entrar e sair da plataforma.
 *
 * A mecanica de credencial, cookie e sessao e do Better Auth (lib/auth/config).
 * O que mora aqui e o que e do produto: a mensagem que nao entrega quem e
 * cliente, o limite de tentativas e o destino por papel.
 *
 * O respondente nao passa por aqui: o assessment dele e sem cadastro, com o
 * token do link como credencial.
 */
"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { registrarAuditoria } from "@/lib/audit/logger";
import { auth } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/sessao";
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
 * ponytail: contador em memoria, por processo. Segura o ataque de forca bruta
 * de uma origem so; nao sobrevive a restart nem enxerga as outras instancias.
 * Trocar por Redis (ou pelo secondaryStorage do Better Auth) quando houver
 * mais de um processo servindo login.
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

  try {
    // O plugin nextCookies grava o cookie da resposta; sem ele a sessao nasce
    // no banco e o navegador nunca fica sabendo.
    const resposta = await auth.api.signInEmail({
      body: { email: validado.data.email, password: validado.data.senha },
      headers: await headers(),
    });

    const usuario = resposta.user as { id: string; papel?: string; ativo?: boolean };

    // Conta desativada nao entra. A checagem e aqui porque `ativo` e coluna
    // nossa: o Better Auth autentica a credencial, nao a regra de negocio.
    if (usuario.ativo === false) {
      await auth.api.signOut({ headers: await headers() });
      return { ok: false, erro: CREDENCIAL_INVALIDA };
    }

    await registrarAuditoria({
      userId: usuario.id,
      acao: "criar",
      tabela: "sessoes",
      registroId: usuario.id,
      detalhes: `Entrou na plataforma como ${usuario.papel ?? "facilitador"}`,
    });

    return { ok: true, destino: usuario.papel === "admin" ? "/admin" : "/facilitador" };
  } catch (erro) {
    // A biblioteca distingue "usuario nao existe" de "senha errada"; o produto
    // nao pode. Toda falha de credencial sai com a mesma frase.
    if (erro instanceof APIError) return { ok: false, erro: CREDENCIAL_INVALIDA };
    throw erro;
  }
}

/** Encerra a sessao desta requisicao. */
export async function logout(): Promise<void> {
  const sessao = await getSession();

  await auth.api.signOut({ headers: await headers() });

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
 * Cria a credencial de um usuario que ja existe na tabela.
 *
 * O caminho normal do Better Auth (`signUpEmail`) cria o usuario junto, e aqui
 * ele ja veio do admin ou do seed, com papel, empresa e saldo definidos. Isto
 * so acrescenta a senha, no mesmo formato que a biblioteca confere no login.
 *
 * Nao valida sessao: quem chama e o seed, com acesso direto ao banco, e a tela
 * do admin, que valida antes.
 */
export async function definirSenha(usuarioId: string, senha: string): Promise<void> {
  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.id, usuarioId), eq(usuarios.is_deleted, false)))
    .limit(1);
  if (!usuario) throw new Error("Usuario nao encontrado");

  const contexto = await auth.$context;
  const hash = await contexto.password.hash(senha);

  const existente = await contexto.internalAdapter.findAccounts(usuarioId);
  const credencial = existente.find((conta) => conta.providerId === "credential");

  if (credencial) {
    await contexto.internalAdapter.updateAccount(credencial.id, { password: hash });
    return;
  }

  await contexto.internalAdapter.createAccount({
    userId: usuarioId,
    providerId: "credential",
    // O emissor vem da funcao da biblioteca, e nao da string "credential": o
    // login compara com `createLocalAccountIssuer("credential")`, que hoje
    // resolve para "local:credential". Escrever o valor a mao fazia a conta
    // existir no banco e o login recusar assim mesmo.
    issuer: createLocalAccountIssuer("credential"),
    accountId: usuarioId,
    password: hash,
  });
}
