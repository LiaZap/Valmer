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

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
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
