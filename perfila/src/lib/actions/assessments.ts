/**
 * Regra de negocio dos assessments, em um lugar so.
 *
 * Toda tela — portal do facilitador, painel do admin, envio rapido — chama
 * estas funcoes. Nenhuma delas repete a regra de credito, de escopo ou de
 * auditoria: se a regra mudar aqui, muda em todas.
 */
"use server";

import { randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessments, creditosTransacoes, usuarios } from "@/lib/db/schema";
import { getSession, temPermissao, type Acao, type Sessao } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit/logger";
import {
  atualizarAssessmentSchema,
  criarAssessmentSchema,
} from "@/lib/validators/assessment";
import { getTipoRelatorio } from "@/data/planos";

const TABELA = "assessments";

/** Por quantos dias o link de avaliacao continua valendo. */
const DIAS_VALIDADE = 7;

async function exigirSessao(acao: Acao): Promise<Sessao> {
  const sessao = await getSession();
  if (!sessao) throw new Error("Nao autenticado");
  if (!temPermissao(sessao.papel, "assessments", acao)) {
    throw new Error(`Sem permissao para ${acao} assessments`);
  }
  return sessao;
}

/**
 * Recorte por dono: o facilitador so enxerga e mexe nos assessments dele.
 * O admin enxerga os de todos os parceiros, que e o que o painel dele mostra.
 */
function escopoDoDono(sessao: Sessao) {
  return sessao.papel === "admin" ? undefined : eq(assessments.facilitador_id, sessao.userId);
}

/** Token do link /avaliacao/<token>. 12 caracteres hexadecimais. */
function novoToken(): string {
  return randomBytes(6).toString("hex");
}

/** Lista os assessments visiveis para a sessao, do mais novo ao mais antigo. */
export async function listar() {
  const sessao = await exigirSessao("ler");

  return db
    .select()
    .from(assessments)
    .where(and(eq(assessments.is_deleted, false), escopoDoDono(sessao)))
    .orderBy(desc(assessments.created_at));
}

/** Um assessment pelo id, respeitando o escopo do dono. */
export async function obter(id: string) {
  const sessao = await exigirSessao("ler");

  const [registro] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.id, id), eq(assessments.is_deleted, false), escopoDoDono(sessao)))
    .limit(1);

  return registro ?? null;
}

/**
 * Cria o assessment e consome os creditos do facilitador.
 *
 * As tres escritas — assessment, saldo e extrato — acontecem na mesma
 * transacao, com a linha do facilitador travada. Sem a trava, duas criacoes
 * simultaneas leem o mesmo saldo e gastam o mesmo credito duas vezes.
 */
export async function criar(dados: unknown) {
  const sessao = await exigirSessao("criar");
  const validado = criarAssessmentSchema.parse(dados);

  const facilitadorId = validado.facilitador_id ?? sessao.userId;
  if (sessao.papel !== "admin" && facilitadorId !== sessao.userId) {
    throw new Error("Sem permissao para criar assessment em nome de outro facilitador");
  }

  const custo = getTipoRelatorio(validado.tipo_relatorio).creditos;
  const expiraEm = new Date(Date.now() + DIAS_VALIDADE * 24 * 60 * 60 * 1000);

  const criado = await db.transaction(async (tx) => {
    const [dono] = await tx
      .select()
      .from(usuarios)
      .where(and(eq(usuarios.id, facilitadorId), eq(usuarios.is_deleted, false)))
      .limit(1)
      .for("update");

    if (!dono) throw new Error("Facilitador nao encontrado");
    if (!dono.ativo) throw new Error("Facilitador inativo");
    if (dono.creditos < custo) {
      throw new Error(
        `Saldo insuficiente: ${validado.tipo_relatorio} custa ${custo} credito(s) e o saldo e ${dono.creditos}.`,
      );
    }

    const [novo] = await tx
      .insert(assessments)
      .values({
        token: novoToken(),
        facilitador_id: facilitadorId,
        avaliado_nome: validado.avaliado_nome,
        avaliado_email: validado.avaliado_email,
        tipo_relatorio: validado.tipo_relatorio,
        situacao: "pendente",
        creditos_usados: custo,
        expira_em: expiraEm,
        modified_by: sessao.userId,
      })
      .returning();

    await tx
      .update(usuarios)
      .set({
        creditos: dono.creditos - custo,
        updated_at: new Date(),
        modified_by: sessao.userId,
      })
      .where(eq(usuarios.id, facilitadorId));

    await tx.insert(creditosTransacoes).values({
      usuario_id: facilitadorId,
      tipo: "uso",
      quantidade: -custo,
      descricao: `Assessment ${validado.tipo_relatorio} de ${validado.avaliado_nome}`,
      assessment_id: novo.id,
      modified_by: sessao.userId,
    });

    return novo;
  });

  await registrarAuditoria({
    userId: sessao.userId,
    acao: "criar",
    tabela: TABELA,
    registroId: criado.id,
    detalhes: `Criou assessment ${criado.tipo_relatorio} para ${criado.avaliado_email} (${custo} credito(s))`,
    dadosNovos: criado,
  });

  return criado;
}

/**
 * Atualiza nome e e-mail do avaliado, com optimistic locking.
 *
 * O WHERE compara `updated_at` com o valor que a tela leu. Se outro usuario
 * gravou nesse meio tempo, nenhuma linha casa e a gravacao e recusada em vez
 * de sobrescrever o trabalho alheio.
 */
export async function atualizar(id: string, dados: unknown, updatedAtOriginal: Date) {
  const sessao = await exigirSessao("atualizar");
  const validado = atualizarAssessmentSchema.parse(dados);

  const anterior = await obter(id);
  if (!anterior) throw new Error("Assessment nao encontrado");

  const resultado = await db
    .update(assessments)
    .set({
      avaliado_nome: validado.avaliado_nome,
      avaliado_email: validado.avaliado_email,
      updated_at: new Date(),
      modified_by: sessao.userId,
    })
    .where(
      and(
        eq(assessments.id, id),
        eq(assessments.updated_at, updatedAtOriginal),
        eq(assessments.is_deleted, false),
        escopoDoDono(sessao),
      ),
    )
    .returning();

  if (resultado.length === 0) {
    throw new Error("Registro alterado por outro usuario. Recarregue e tente novamente.");
  }

  await registrarAuditoria({
    userId: sessao.userId,
    acao: "atualizar",
    tabela: TABELA,
    registroId: id,
    detalhes: `Atualizou o avaliado do assessment ${id}`,
    dadosAnteriores: anterior,
    dadosNovos: resultado[0],
  });

  return resultado[0];
}

/**
 * Delete logico. Nunca apaga a linha.
 *
 * O credito consumido NAO volta: o link ja foi gerado e pode ter sido
 * enviado. Estorno e decisao do admin, pela tela de creditos.
 */
export async function excluir(id: string) {
  const sessao = await exigirSessao("deletar");

  const anterior = await obter(id);
  if (!anterior) throw new Error("Assessment nao encontrado");

  const resultado = await db
    .update(assessments)
    .set({
      is_deleted: true,
      deleted_at: new Date(),
      updated_at: new Date(),
      modified_by: sessao.userId,
    })
    .where(and(eq(assessments.id, id), eq(assessments.is_deleted, false), escopoDoDono(sessao)))
    .returning();

  if (resultado.length === 0) throw new Error("Assessment nao encontrado");

  await registrarAuditoria({
    userId: sessao.userId,
    acao: "excluir",
    tabela: TABELA,
    registroId: id,
    detalhes: `Excluiu (logico) o assessment de ${anterior.avaliado_email}`,
    dadosAnteriores: anterior,
  });

  return resultado[0];
}
