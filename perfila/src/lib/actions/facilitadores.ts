/**
 * Cadastro do parceiro e venda de credito, em um lugar so.
 *
 * As duas telas do admin — /admin/facilitadores/novo e /admin/creditos —
 * chamam daqui, porque as duas fazem a mesma coisa por baixo: somam credito no
 * saldo de alguem. E saldo neste sistema nao e um numero solto: a partir da
 * migration 0005 o banco confere no COMMIT se `usuarios.creditos` bate com a
 * soma de `creditos_transacoes` daquele usuario. Quem move o saldo grava o
 * extrato na MESMA transacao — igual a `actions/assessments.ts:criar`, que
 * gasta o credito pelo mesmo contrato.
 */
"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { db } from "@/lib/db";
import { creditosTransacoes, usuarios } from "@/lib/db/schema";
import { getSession, temPermissao, type Acao, type Sessao } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit/logger";
import { definirSenha } from "@/lib/auth/senha";
import { getPacote } from "@/data/planos";
import { criarFacilitadorSchema, venderCreditosSchema } from "@/lib/validators/facilitador";
import { RecusaDeRegra } from "./recusa";

const TABELA = "usuarios";

/**
 * Nao ha permissao propria de credito no rbac, e nem precisa haver: vender
 * credito e escrever em `usuarios.creditos`. Quem pode atualizar o parceiro
 * pode creditar, e hoje isso e so o admin. Um recurso "creditos" separado
 * seria uma segunda chave para a mesma porta.
 */
async function exigirSessao(acao: Acao): Promise<Sessao> {
  const sessao = await getSession();
  if (!sessao) throw new Error("Nao autenticado");
  if (!temPermissao(sessao.papel, TABELA, acao)) {
    throw new Error(`Sem permissao para ${acao} usuarios`);
  }
  return sessao;
}

/**
 * Cria o parceiro com o pacote ja creditado.
 *
 * Usuario, saldo, extrato e trilha entram na mesma transacao. A senha e a
 * unica coisa de fora, e por um motivo do Better Auth: `definirSenha` fala com
 * o banco pelo `auth.$context`, que tem conexao propria e nao enxerga esta
 * transacao — chamada aqui dentro, ela gravaria a credencial de um usuario que
 * o COMMIT ainda pode desfazer.
 */
export async function criar(dados: unknown) {
  const sessao = await exigirSessao("criar");
  const validado = criarFacilitadorSchema.parse(dados);
  const pacote = getPacote(validado.pacote);

  const criado = await db.transaction(async (tx) => {
    // O indice unico de e-mail ja recusaria, mas com erro de banco: a tela
    // mostraria "duplicate key value violates unique constraint" para o que e
    // uma decisao de negocio banal. A consulta antes existe para a recusa ter
    // nome; o indice continua sendo a garantia.
    const [existente] = await tx
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(eq(usuarios.email, validado.email))
      .limit(1);

    if (existente) {
      throw new RecusaDeRegra(`Ja existe um usuario com o e-mail ${validado.email}.`);
    }

    const [novo] = await tx
      .insert(usuarios)
      .values({
        nome: validado.nome,
        email: validado.email,
        papel: "facilitador",
        empresa: validado.empresa,
        creditos: pacote.creditos,
        modified_by: sessao.userId,
      })
      .returning();

    await tx.insert(creditosTransacoes).values({
      usuario_id: novo.id,
      tipo: "compra",
      quantidade: pacote.creditos,
      descricao: `Pacote ${pacote.nome} na abertura da conta`,
      modified_by: sessao.userId,
    });

    await registrarAuditoria(
      {
        userId: sessao.userId,
        acao: "criar",
        tabela: TABELA,
        registroId: novo.id,
        detalhes: `Criou o parceiro ${novo.email} com o pacote ${pacote.nome} (${pacote.creditos} creditos) e senha inicial`,
        dadosNovos: novo,
      },
      tx,
    );

    return novo;
  });

  // ponytail: a senha e escolhida pelo admin e repassada por WhatsApp — o teto
  // e que ela trafega por fora do sistema e nasce conhecida por duas pessoas.
  // Quando houver provedor de e-mail, isto vira link de uso unico e o campo
  // some do formulario.
  //
  // Falhar aqui deixa o parceiro criado, com credito, e sem credencial. O
  // admin repete o cadastro, recebe a recusa de e-mail duplicado e descobre
  // que a conta existe — mas NAO ha tela para dar senha a um usuario que ja
  // existe, entao o conserto hoje e rodar `definirSenha` por script, com
  // acesso ao banco. Nao dourar isto: e o caminho de volta que falta, e ele
  // fecha quando existir a tela de editar parceiro.
  await definirSenha(criado.id, validado.senha);

  return criado;
}

/**
 * Venda de um pacote a um parceiro que ja existe.
 *
 * A linha do parceiro entra travada (`for update`) pelo mesmo motivo do gasto
 * em assessments: duas vendas simultaneas leem o mesmo saldo e a segunda
 * sobrescreve a primeira — o extrato somaria dois pacotes e o saldo mostraria
 * um, que e exatamente o que a trigger da 0005 aborta.
 */
export async function venderCreditos(dados: unknown) {
  const sessao = await exigirSessao("atualizar");
  const validado = venderCreditosSchema.parse(dados);
  const pacote = getPacote(validado.pacote);

  return db.transaction(async (tx) => {
    const [parceiro] = await tx
      .select()
      .from(usuarios)
      .where(and(eq(usuarios.id, validado.facilitador_id), eq(usuarios.is_deleted, false)))
      .limit(1)
      .for("update");

    if (!parceiro) throw new RecusaDeRegra("Parceiro nao encontrado");
    if (!parceiro.ativo) throw new RecusaDeRegra("Parceiro inativo");

    const saldo = parceiro.creditos + pacote.creditos;

    await tx
      .update(usuarios)
      .set({ creditos: saldo, updated_at: new Date(), modified_by: sessao.userId })
      .where(eq(usuarios.id, parceiro.id));

    await tx.insert(creditosTransacoes).values({
      usuario_id: parceiro.id,
      tipo: "compra",
      quantidade: pacote.creditos,
      descricao: `Pacote ${pacote.nome}`,
      modified_by: sessao.userId,
    });

    await registrarAuditoria(
      {
        userId: sessao.userId,
        acao: "atualizar",
        tabela: TABELA,
        registroId: parceiro.id,
        detalhes: `Vendeu o pacote ${pacote.nome} (${pacote.creditos} creditos) para ${parceiro.email}: saldo ${parceiro.creditos} -> ${saldo}`,
        dadosAnteriores: parceiro,
        dadosNovos: { ...parceiro, creditos: saldo },
      },
      tx,
    );

    return { nome: parceiro.nome, creditos: pacote.creditos, saldo };
  });
}

/**
 * O que o formulario de novo parceiro chama.
 *
 * Mesma traducao de `assessments.criarPelaTela`, pelo mesmo motivo: uma Server
 * Action que lanca chega ao navegador como digest opaco em producao, e a tela
 * mostraria a mesma coisa para "e-mail ja cadastrado" e para "banco fora do
 * ar". Recusa de regra volta como objeto; falha de verdade continua subindo.
 *
 * A invalidacao aponta para o layout de /admin porque a lista de parceiros, o
 * extrato e as metricas do painel mudam todos com esta gravacao, e cada um
 * mora numa rota diferente.
 */
export async function criarPelaTela(
  dados: unknown,
): Promise<{ ok: true; id: string; nome: string; creditos: number } | { ok: false; erro: string }> {
  try {
    const criado = await criar(dados);
    revalidatePath("/admin", "layout");
    return { ok: true, id: criado.id, nome: criado.nome, creditos: criado.creditos };
  } catch (erro) {
    const recusa = comoRecusa(erro);
    if (recusa) return { ok: false, erro: recusa };
    throw erro;
  }
}

/** Venda a partir da tela de creditos. Mesmo contrato de `criarPelaTela`. */
export async function venderPelaTela(
  dados: unknown,
): Promise<
  { ok: true; nome: string; creditos: number; saldo: number } | { ok: false; erro: string }
> {
  try {
    const venda = await venderCreditos(dados);
    revalidatePath("/admin", "layout");
    return { ok: true, ...venda };
  } catch (erro) {
    const recusa = comoRecusa(erro);
    if (recusa) return { ok: false, erro: recusa };
    throw erro;
  }
}

/**
 * Violacao de unicidade do Postgres, se houver, em qualquer nivel da cadeia.
 *
 * O erro do driver vem embrulhado pelo Drizzle, entao o codigo nao esta no
 * topo: e preciso descer pelo `cause` ate achar. Sem isso a checagem acerta em
 * teste, onde o erro chega cru, e erra em producao.
 */
function violacaoDeUnicidade(erro: unknown): string | null {
  let atual: unknown = erro;
  for (let salto = 0; atual && salto < 5; salto += 1) {
    const alvo = atual as { code?: unknown; constraint?: unknown; cause?: unknown };
    if (alvo.code === "23505") {
      return typeof alvo.constraint === "string" ? alvo.constraint : "";
    }
    atual = alvo.cause;
  }
  return null;
}

/** A mensagem legivel de uma recusa, ou null quando e falha de verdade. */
function comoRecusa(erro: unknown): string | null {
  if (erro instanceof RecusaDeRegra) return erro.message;
  // Zod ja explica o campo errado; a primeira mensagem basta, porque o usuario
  // corrige um campo por vez.
  if (erro instanceof ZodError) return erro.issues[0]?.message ?? "Dados invalidos";

  // A consulta antes do INSERT da nome a recusa no caminho normal, mas ela NAO
  // fecha a corrida: dois cadastros do mesmo e-mail no mesmo instante passam os
  // dois pelo SELECT e o indice recusa o segundo. Sem esta traducao, esse
  // segundo admin recebia "duplicate key value violates unique constraint" —
  // ou, em producao, um digest opaco — para a mesma decisao de negocio banal
  // que o outro caminho explica em portugues. Quem garante a unicidade e o
  // indice; isto so faz a recusa dele ter as mesmas palavras.
  const restricao = violacaoDeUnicidade(erro);
  if (restricao !== null) {
    return restricao === "uq_usuarios_email"
      ? "Ja existe um usuario com este e-mail."
      : "Este registro ja existe.";
  }

  return null;
}
