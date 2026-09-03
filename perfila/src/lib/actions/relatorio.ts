/**
 * Leitura do relatorio pronto, pelo mesmo token do assessment.
 *
 * O relatorio e o artefato que o facilitador entrega ao cliente dele, entao a
 * regra de acesso e a do respondente e nao a do portal: quem tem o link le, sem
 * sessao. Escrita nenhuma mora aqui — o que existe hoje e so a leitura.
 */
"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessments, assessmentsRelatorios, usuarios } from "@/lib/db/schema";
import { esquemaNarrativa, type NarrativaRelatorio } from "@/lib/relatorio/tipos";
import type { CodigoRelatorio } from "@/data/planos";
import type { FatorDisc } from "@/data/dna";

export type RelatorioCarregado = {
  avaliado: { nome: string; email: string };
  facilitador: { nome: string; empresa: string; telefone: string };
  /** Data da conclusao; a pagina formata. */
  emitidoEm: Date;
  tipoRelatorio: CodigoRelatorio;
  contadores: Record<FatorDisc, number>;
  /** Nula enquanto a geracao por IA nao rodou para este assessment. */
  narrativa: NarrativaRelatorio | null;
};

/**
 * Devolve null quando nao ha relatorio a mostrar, e a pagina transforma isso em
 * 404. Sao tres casos, de proposito indistinguiveis para quem chama: token que
 * nao existe, assessment ainda nao concluido, e concluido sem contadores. O
 * ultimo nao deveria acontecer — `concluir()` grava os quatro na mesma transacao
 * em que fecha o assessment — mas um relatorio com numero inventado e pior que
 * um 404, entao a leitura desconfia em vez de completar com zero.
 */
export async function carregarRelatorio(token: string): Promise<RelatorioCarregado | null> {
  const [linha] = await db
    .select({
      id: assessments.id,
      nome: assessments.avaliado_nome,
      email: assessments.avaliado_email,
      tipo_relatorio: assessments.tipo_relatorio,
      situacao: assessments.situacao,
      concluido_em: assessments.concluido_em,
      created_at: assessments.created_at,
      contador_d: assessments.contador_d,
      contador_i: assessments.contador_i,
      contador_s: assessments.contador_s,
      contador_c: assessments.contador_c,
      facilitador_nome: usuarios.nome,
      facilitador_empresa: usuarios.empresa,
      facilitador_telefone: usuarios.telefone,
    })
    .from(assessments)
    .innerJoin(usuarios, eq(usuarios.id, assessments.facilitador_id))
    .where(and(eq(assessments.token, token), eq(assessments.is_deleted, false)))
    .limit(1);

  if (!linha || linha.situacao !== "concluido") return null;

  const { contador_d, contador_i, contador_s, contador_c } = linha;
  if (contador_d === null || contador_i === null || contador_s === null || contador_c === null) {
    return null;
  }

  // A ultima versao e a que vale: o versionamento existe para guardar historico,
  // e quem abre o link quer o documento atual.
  const [ultima] = await db
    .select({ narrativa: assessmentsRelatorios.narrativa })
    .from(assessmentsRelatorios)
    .where(
      and(
        eq(assessmentsRelatorios.assessment_id, linha.id),
        eq(assessmentsRelatorios.is_deleted, false),
      ),
    )
    .orderBy(desc(assessmentsRelatorios.versao))
    .limit(1);

  // Narrativa fora do formato e tratada como ausente, e nao como erro: o
  // relatorio inteiro nao pode sumir porque um campo mudou de forma entre
  // versoes do gerador. O resto do documento continua correto.
  const validada = ultima ? esquemaNarrativa.safeParse(ultima.narrativa) : null;

  return {
    avaliado: { nome: linha.nome, email: linha.email },
    facilitador: {
      nome: linha.facilitador_nome,
      empresa: linha.facilitador_empresa ?? "",
      telefone: linha.facilitador_telefone ?? "",
    },
    // Concluido sempre tem data, mas a coluna aceita nulo: cair na criacao
    // imprime uma data plausivel em vez de quebrar a capa.
    emitidoEm: linha.concluido_em ?? linha.created_at,
    tipoRelatorio: linha.tipo_relatorio,
    contadores: { D: contador_d, I: contador_i, S: contador_s, C: contador_c },
    narrativa: validada?.success ? validada.data : null,
  };
}
