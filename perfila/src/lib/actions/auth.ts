/**
 * Entrar e sair da plataforma.
 *
 * A mecanica de credencial, cookie e sessao e do Better Auth (lib/auth/config),
 * e as REGRAS do login tambem: limite de tentativas por conta e recusa de conta
 * desativada sao hooks da biblioteca, porque a rota /api/auth/* e uma segunda
 * porta que nao passa por aqui. O que sobrou nesta action e o que so a tela
 * precisa: a mensagem que nao entrega quem e cliente, e o destino por papel.
 *
 * O respondente nao passa por aqui: o assessment dele e sem cadastro, com o
 * token do link como credencial.
 */
"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { registrarAuditoria } from "@/lib/audit/logger";
import { auth, MUITAS_TENTATIVAS } from "@/lib/auth/config";
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

export type ResultadoLogin = { ok: true; destino: string } | { ok: false; erro: string };

export async function login(email: string, senha: string): Promise<ResultadoLogin> {
  const validado = loginSchema.safeParse({ email, senha });
  if (!validado.success) return { ok: false, erro: CREDENCIAL_INVALIDA };

  try {
    // O plugin nextCookies grava o cookie da resposta; sem ele a sessao nasce
    // no banco e o navegador nunca fica sabendo.
    const resposta = await auth.api.signInEmail({
      body: { email: validado.data.email, password: validado.data.senha },
      headers: await headers(),
    });

    const usuario = resposta.user as { id: string; papel?: string };

    await registrarAuditoria({
      userId: usuario.id,
      acao: "criar",
      tabela: "sessoes",
      registroId: usuario.id,
      detalhes: `Entrou na plataforma como ${usuario.papel ?? "facilitador"}`,
    });

    return { ok: true, destino: usuario.papel === "admin" ? "/admin" : "/facilitador" };
  } catch (erro) {
    if (erro instanceof APIError) {
      // Travado por tentativas e o UNICO caso que a tela precisa distinguir:
      // repetir "e-mail ou senha incorretos" a quem ja acertou faria a pessoa
      // trocar uma senha que estava certa.
      const codigo = (erro.body as { code?: string } | undefined)?.code;
      if (codigo === MUITAS_TENTATIVAS) return { ok: false, erro: erro.message };

      // No resto a biblioteca distingue "usuario nao existe" de "senha errada";
      // o produto nao pode. Toda falha de credencial sai com a mesma frase.
      return { ok: false, erro: CREDENCIAL_INVALIDA };
    }
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
