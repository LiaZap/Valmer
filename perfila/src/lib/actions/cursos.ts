/**
 * Regra de negocio dos cursos, em um lugar so.
 *
 * O admin cria, edita e publica; ninguem mais escreve aqui. A plataforma do
 * aluno, quando existir, le por `listarPublicados()` e nunca ve rascunho.
 */
"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { db } from "@/lib/db";
import { cursos } from "@/lib/db/schema";
import { getSession, temPermissao, type Acao, type Sessao } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit/logger";
import { criarCursoSchema } from "@/lib/validators/curso";
import { RecusaDeRegra } from "./recusa";

const TABELA = "cursos";

async function exigirSessao(acao: Acao): Promise<Sessao> {
  const sessao = await getSession();
  if (!sessao) throw new Error("Nao autenticado");
  if (!temPermissao(sessao.papel, TABELA, acao)) {
    throw new Error(`Sem permissao para ${acao} cursos`);
  }
  return sessao;
}

/** Todos os cursos vivos, rascunho junto, do mais novo ao mais antigo. */
export async function listar() {
  await exigirSessao("ler");

  return db
    .select()
    .from(cursos)
    .where(eq(cursos.is_deleted, false))
    .orderBy(desc(cursos.created_at));
}

/**
 * O que a plataforma do aluno enxerga.
 *
 * Sem sessao de proposito: quem chama e outro sistema, com login proprio. O
 * recorte e o mesmo filtro de sempre, e por isso ele mora aqui e nao na tela.
 */
export async function listarPublicados() {
  return db
    .select()
    .from(cursos)
    .where(and(eq(cursos.is_deleted, false), eq(cursos.publicado, true)))
    .orderBy(desc(cursos.publicado_em));
}

/** Cria o curso como rascunho. Publicar e um segundo passo, deliberado. */
export async function criar(dados: unknown) {
  const sessao = await exigirSessao("criar");
  const validado = criarCursoSchema.parse(dados);

  const [novo] = await db
    .insert(cursos)
    .values({ ...validado, modified_by: sessao.userId })
    .returning();

  await registrarAuditoria({
    userId: sessao.userId,
    acao: "criar",
    tabela: TABELA,
    registroId: novo!.id,
    detalhes: `Criou o curso "${novo!.titulo}" como rascunho`,
    dadosNovos: novo,
  });

  return novo!;
}

/**
 * Publica ou tira do ar, com optimistic locking.
 *
 * O WHERE compara `updated_at` com o valor que a tela leu: se outra aba mexeu
 * no curso nesse meio tempo, a gravacao e recusada em vez de sobrescrever. E o
 * estado desejado vem da tela em vez de ser um "inverta o que estiver la" —
 * dois cliques na mesma linha nao podem se cancelar sem ninguem perceber.
 */
export async function alternarPublicacao(
  id: string,
  publicar: boolean,
  updatedAtOriginal: Date,
) {
  const sessao = await exigirSessao("atualizar");

  const [anterior] = await db
    .select()
    .from(cursos)
    .where(and(eq(cursos.id, id), eq(cursos.is_deleted, false)))
    .limit(1);

  if (!anterior) throw new RecusaDeRegra("Curso nao encontrado");

  const resultado = await db
    .update(cursos)
    .set({
      publicado: publicar,
      publicado_em: publicar ? new Date() : null,
      updated_at: new Date(),
      modified_by: sessao.userId,
    })
    .where(
      and(
        eq(cursos.id, id),
        eq(cursos.updated_at, updatedAtOriginal),
        eq(cursos.is_deleted, false),
      ),
    )
    .returning();

  if (resultado.length === 0) {
    throw new RecusaDeRegra(
      "Este curso foi alterado por outra aba. Recarregue a pagina e tente de novo.",
    );
  }

  await registrarAuditoria({
    userId: sessao.userId,
    acao: "atualizar",
    tabela: TABELA,
    registroId: id,
    detalhes: `${publicar ? "Publicou" : "Tirou do ar"} o curso "${anterior.titulo}"`,
    dadosAnteriores: anterior,
    dadosNovos: resultado[0],
  });

  return resultado[0]!;
}

/**
 * Traduz a recusa para a tela.
 *
 * Mesmo motivo de `assessments.criarPelaTela`: uma Server Action que lanca
 * entrega ao navegador um digest opaco em producao, e "titulo muito curto"
 * chegaria com a mesma cara de "o banco caiu". Falha de verdade continua
 * subindo.
 */
async function pelaTela<T>(operacao: () => Promise<T>): Promise<
  { ok: true } | { ok: false; erro: string }
> {
  try {
    await operacao();
    revalidatePath("/admin/cursos");
    return { ok: true };
  } catch (erro) {
    if (erro instanceof RecusaDeRegra) return { ok: false, erro: erro.message };
    if (erro instanceof ZodError) {
      return { ok: false, erro: erro.issues[0]?.message ?? "Dados invalidos" };
    }
    throw erro;
  }
}

export async function criarPelaTela(dados: unknown) {
  return pelaTela(() => criar(dados));
}

export async function alternarPublicacaoPelaTela(
  id: string,
  publicar: boolean,
  updatedAtOriginal: Date,
) {
  return pelaTela(() => alternarPublicacao(id, publicar, updatedAtOriginal));
}
