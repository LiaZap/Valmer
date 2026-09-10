/**
 * Renomear modulo e aula.
 *
 * POR QUE ISTO EXISTE, E POR QUE NAO ESTA EM `actions/ead.ts`
 * ----------------------------------------------------------
 * `ead.ts` nasceu sem renomear, com o argumento de que "titulo errado se
 * resolve excluindo e recriando". O proprio arquivo desmente isso:
 * `excluirModulo` RECUSA modulo que ainda tem aula, e `excluirAula` apaga a
 * aula com o video junto. Ou seja, sem esta porta, corrigir um acento no titulo
 * de um modulo custava apagar e reenviar todas as gravacoes dele — gigabytes
 * por causa de uma letra.
 *
 * Arquivo separado porque `ead.ts` esta em 465 linhas e o teto do projeto e
 * 500; e porque `ead-video.ts` ja estabeleceu que o assunto do EAD mora em mais
 * de um modulo, cada um com uma responsabilidade.
 *
 * O desenho e o mesmo do vizinho: sessao na entrada, permissao pelo rbac,
 * transacao com a trilha dentro, optimistic locking por `updated_at` e recusa
 * de regra separada de falha.
 */
"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { cursoAulas, cursoModulos } from "@/lib/db/schema";
import { getSession, temPermissao, type Acao, type Sessao } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit/logger";
import { renomearAulaSchema, renomearModuloSchema } from "@/lib/validators/ead";
import { paraTela, RecusaDeRegra } from "./recusa";

const TELA = "/admin/cursos";

async function exigirSessao(acao: Acao): Promise<Sessao> {
  const sessao = await getSession();
  if (!sessao) throw new Error("Nao autenticado");
  if (!temPermissao(sessao.papel, "cursos", acao)) {
    throw new Error(`Sem permissao para ${acao} cursos`);
  }
  return sessao;
}

export async function renomearModulo(id: string, dados: unknown, updatedAtOriginal: Date) {
  const sessao = await exigirSessao("atualizar");
  const validado = renomearModuloSchema.parse(dados);

  return db.transaction(async (tx) => {
    const [anterior] = await tx
      .select()
      .from(cursoModulos)
      .where(and(eq(cursoModulos.id, id), eq(cursoModulos.is_deleted, false)))
      .limit(1);

    if (!anterior) throw new RecusaDeRegra("Modulo nao encontrado");

    // A ordem NAO entra no SET: renomear nao pode reposicionar o modulo, e
    // listar a coluna aqui abriria essa porta sem ninguem perceber.
    const gravado = await tx
      .update(cursoModulos)
      .set({ titulo: validado.titulo, updated_at: new Date(), modified_by: sessao.userId })
      .where(
        and(
          eq(cursoModulos.id, id),
          eq(cursoModulos.updated_at, updatedAtOriginal),
          eq(cursoModulos.is_deleted, false),
        ),
      )
      .returning();

    if (gravado.length === 0) {
      throw new RecusaDeRegra(
        "Este modulo foi alterado por outra aba. Recarregue a pagina e tente de novo.",
      );
    }

    await registrarAuditoria(
      {
        userId: sessao.userId,
        acao: "atualizar",
        tabela: "curso_modulos",
        registroId: id,
        detalhes: `Renomeou o modulo "${anterior.titulo}" para "${validado.titulo}"`,
        dadosAnteriores: anterior,
        dadosNovos: gravado[0],
      },
      tx,
    );

    return gravado[0]!;
  });
}

export async function renomearAula(id: string, dados: unknown, updatedAtOriginal: Date) {
  const sessao = await exigirSessao("atualizar");
  const validado = renomearAulaSchema.parse(dados);

  return db.transaction(async (tx) => {
    const [anterior] = await tx
      .select()
      .from(cursoAulas)
      .where(and(eq(cursoAulas.id, id), eq(cursoAulas.is_deleted, false)))
      .limit(1);

    if (!anterior) throw new RecusaDeRegra("Aula nao encontrada");

    // `video_chave` e `duracao_segundos` ficam de fora do SET: renomear nao
    // pode desfazer um envio de video. Quem mexe neles e `ead-video.ts`.
    const gravado = await tx
      .update(cursoAulas)
      .set({ titulo: validado.titulo, updated_at: new Date(), modified_by: sessao.userId })
      .where(
        and(
          eq(cursoAulas.id, id),
          eq(cursoAulas.updated_at, updatedAtOriginal),
          eq(cursoAulas.is_deleted, false),
        ),
      )
      .returning();

    if (gravado.length === 0) {
      throw new RecusaDeRegra(
        "Esta aula foi alterada por outra aba. Recarregue a pagina e tente de novo.",
      );
    }

    await registrarAuditoria(
      {
        userId: sessao.userId,
        acao: "atualizar",
        tabela: "curso_aulas",
        registroId: id,
        detalhes: `Renomeou a aula "${anterior.titulo}" para "${validado.titulo}"`,
        dadosAnteriores: anterior,
        dadosNovos: gravado[0],
      },
      tx,
    );

    return gravado[0]!;
  });
}

export async function renomearModuloPelaTela(id: string, dados: unknown, updatedAt: Date) {
  return paraTela(TELA, () => renomearModulo(id, dados, updatedAt));
}

export async function renomearAulaPelaTela(id: string, dados: unknown, updatedAt: Date) {
  return paraTela(TELA, () => renomearAula(id, dados, updatedAt));
}
