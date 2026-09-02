/**
 * O que o respondente faz: abrir o link, responder e concluir.
 *
 * Esta e a unica tela sem login da plataforma, entao nada aqui chama
 * getSession: o token E a credencial, e exigir sessao trancaria o respondente
 * para fora do proprio assessment. As demais regras de assessment (credito,
 * escopo do dono, edicao) continuam em actions/assessments.ts — aqui so mora o
 * que acontece do lado de quem responde.
 */
"use server";

import { and, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessments, assessmentsRespostas, usuarios } from "@/lib/db/schema";
import { registrarAuditoria } from "@/lib/audit/logger";
import { respostaSchema } from "@/lib/validators/assessment";
import { questoes } from "@/data/assessment";
import type { Respostas } from "@/lib/disc";
import type { FatorDisc } from "@/data/dna";

const TABELA = "assessments";

/**
 * Quem assina as linhas que o respondente grava.
 *
 * `modified_by` responde "quem alterou esta linha". Gravar o facilitador ali
 * afirmaria na trilha que ele proprio respondeu o assessment — e falso, e e
 * exatamente a mentira que uma coluna de auditoria nao pode contar. O
 * respondente nao e usuario da plataforma; a sentinela diz isso. Nao ha FK em
 * `modified_by`, entao o valor nao precisa existir em `usuarios`.
 */
const RESPONDENTE = "00000000-0000-0000-0000-000000000000";

export type FalhaAvaliacao =
  | "invalido"
  | "expirado"
  | "concluido"
  | "incompleto"
  /** So o cliente produz: a Server Action nao respondeu. Nunca vem do servidor. */
  | "rede"
  /** Idem, no envio final: a mensagem fala do envio, nao de uma resposta solta. */
  | "rede_envio";

type Recusa = { ok: false; erro: FalhaAvaliacao };

type Carregado =
  | { estado: "responder"; nome: string; respostas: Respostas }
  | { estado: "concluido"; nome: string }
  | { estado: "expirado"; facilitador: string; expiraEm: Date };

/**
 * Expiracao e derivada, nunca gravada.
 *
 * Persistir a transicao para "expirado" exigiria escrever durante uma leitura
 * ou manter um job de fundo, e criaria uma segunda fonte de verdade capaz de
 * divergir de `expira_em`. Mesmo raciocinio dos contadores: nao materializar o
 * que da para derivar. O valor "expirado" do enum continua respeitado, entao
 * um admin ainda pode encerrar um link na mao.
 */
function expirou(situacao: string, expiraEm: Date): boolean {
  return situacao === "expirado" || expiraEm.getTime() < Date.now();
}

/**
 * Estado do link para a tela decidir o que mostrar.
 *
 * Devolve null quando o token nao existe — a page transforma isso em 404, para
 * nao confirmar nem negar a existencia de um convite a quem nao tem o link.
 *
 * Fica exportada daqui mesmo, apesar de "use server" a transformar num POST
 * publico que devolve PII: quem tem o token obtem a mesma PII abrindo a pagina,
 * e um token de 12 hex inviabiliza forca bruta. Server Actions ainda checam
 * Origin/Host, o que a rota GET nao faz — ou seja, mover para um modulo sem
 * "use server" custaria um arquivo e dois imports por zero diferenca.
 */
export async function carregarAvaliacao(token: string): Promise<Carregado | null> {
  const [linha] = await db
    .select({
      id: assessments.id,
      nome: assessments.avaliado_nome,
      situacao: assessments.situacao,
      expira_em: assessments.expira_em,
      facilitador: usuarios.nome,
    })
    .from(assessments)
    .innerJoin(usuarios, eq(usuarios.id, assessments.facilitador_id))
    .where(and(eq(assessments.token, token), eq(assessments.is_deleted, false)))
    .limit(1);

  if (!linha) return null;

  // Concluido e verificado ANTES de expirado de proposito: um assessment pode
  // estar concluido e com a data ja vencida, e dizer "seu link expirou" a quem
  // ja respondeu seria errado e assustador.
  if (linha.situacao === "concluido") return { estado: "concluido", nome: linha.nome };

  if (expirou(linha.situacao, linha.expira_em)) {
    return { estado: "expirado", facilitador: linha.facilitador, expiraEm: linha.expira_em };
  }

  const gravadas = await db
    .select({
      codigo: assessmentsRespostas.questao_codigo,
      fator: assessmentsRespostas.fator,
    })
    .from(assessmentsRespostas)
    .where(
      and(
        eq(assessmentsRespostas.assessment_id, linha.id),
        eq(assessmentsRespostas.is_deleted, false),
      ),
    );

  const respostas: Respostas = {};
  for (const gravada of gravadas) respostas[gravada.codigo] = gravada.fator;

  return { estado: "responder", nome: linha.nome, respostas };
}

/**
 * Grava uma resposta e tira o assessment de "pendente".
 *
 * Recusa em objeto, e nao com throw: uma Server Action que lanca em producao
 * entrega ao cliente so um digest opaco, e a tela nao conseguiria distinguir
 * "o link expirou" de "caiu a rede". Estado invalido e resultado esperado, nao
 * excecao — throw fica para entrada adulterada, que e o zod abaixo.
 */
export async function salvarResposta(
  token: string,
  questaoCodigo: string,
  fator: FatorDisc,
): Promise<{ ok: true } | Recusa> {
  const validado = respostaSchema.parse({ questao_codigo: questaoCodigo, fator });

  return db.transaction(async (tx) => {
    const [linha] = await tx
      .select()
      .from(assessments)
      .where(and(eq(assessments.token, token), eq(assessments.is_deleted, false)))
      .limit(1)
      .for("update");

    if (!linha) return { ok: false, erro: "invalido" };
    if (linha.situacao === "concluido") return { ok: false, erro: "concluido" };
    if (expirou(linha.situacao, linha.expira_em)) return { ok: false, erro: "expirado" };

    await tx
      .insert(assessmentsRespostas)
      .values({
        assessment_id: linha.id,
        questao_codigo: validado.questao_codigo,
        fator: validado.fator,
        modified_by: RESPONDENTE,
      })
      .onConflictDoUpdate({
        target: [assessmentsRespostas.assessment_id, assessmentsRespostas.questao_codigo],
        // Ressuscita a linha em vez de criar outra. O indice unico continua
        // ocupado por uma resposta soft-deletada, entao sem limpar is_deleted
        // aqui a questao ficaria presa e nunca mais poderia ser respondida.
        set: {
          fator: validado.fator,
          updated_at: new Date(),
          modified_by: RESPONDENTE,
          is_deleted: false,
          deleted_at: null,
        },
      });

    // Condicional e idempotente: se duas primeiras respostas chegarem juntas,
    // uma vence e a outra atualiza zero linhas, sem erro.
    await tx
      .update(assessments)
      .set({ situacao: "em_andamento", updated_at: new Date(), modified_by: RESPONDENTE })
      .where(and(eq(assessments.id, linha.id), eq(assessments.situacao, "pendente")));

    return { ok: true };
  });
}

/**
 * Fecha o assessment gravando os quatro contadores.
 *
 * Grava os contadores e nada mais: perfil primario, secundario e percentuais
 * saem de `resultadoDeContadores`, entao lista e relatorio derivam do mesmo
 * numero e nao tem como divergir.
 */
export async function concluir(
  token: string,
): Promise<{ ok: true; contadores: Record<FatorDisc, number> } | Recusa> {
  const resultado = await db.transaction(async (tx) => {
    // `.for("update")` trava a linha ate a transacao fechar. Sem ela, uma
    // correcao de resposta que chegue entre a contagem e a gravacao faria os
    // contadores divergirem das linhas do banco — calado, e os contadores sao
    // o produto inteiro. Duas abas abertas basta para reproduzir.
    const [linha] = await tx
      .select()
      .from(assessments)
      .where(and(eq(assessments.token, token), eq(assessments.is_deleted, false)))
      .limit(1)
      .for("update");

    if (!linha) return { ok: false, erro: "invalido" } as const;
    if (linha.situacao === "concluido") return { ok: false, erro: "concluido" } as const;
    if (expirou(linha.situacao, linha.expira_em)) return { ok: false, erro: "expirado" } as const;

    const somas = await tx
      .select({ fator: assessmentsRespostas.fator, total: count() })
      .from(assessmentsRespostas)
      .where(
        and(
          eq(assessmentsRespostas.assessment_id, linha.id),
          eq(assessmentsRespostas.is_deleted, false),
        ),
      )
      .groupBy(assessmentsRespostas.fator);

    const contadores: Record<FatorDisc, number> = { D: 0, I: 0, S: 0, C: 0 };
    for (const soma of somas) contadores[soma.fator] = soma.total;

    const respondidas = somas.reduce((total, soma) => total + soma.total, 0);
    // Nada foi gravado antes deste ponto, entao o commit vazio nao muda nada.
    // (Retornar do callback do drizzle COMMITA; rollback so com throw.)
    if (respondidas !== questoes.length) return { ok: false, erro: "incompleto" } as const;

    const [gravado] = await tx
      .update(assessments)
      .set({
        contador_d: contadores.D,
        contador_i: contadores.I,
        contador_s: contadores.S,
        contador_c: contadores.C,
        situacao: "concluido",
        concluido_em: new Date(),
        updated_at: new Date(),
        modified_by: RESPONDENTE,
      })
      .where(eq(assessments.id, linha.id))
      .returning();

    return { ok: true, contadores, gravado: gravado! } as const;
  });

  if (!resultado.ok) return resultado;

  // Fora da transacao porque registrarAuditoria usa `db` e nao aceita `tx` —
  // mesmo arranjo que criar() ja adota em actions/assessments.ts.
  await registrarAuditoria({
    userId: RESPONDENTE,
    acao: "atualizar",
    tabela: TABELA,
    registroId: resultado.gravado.id,
    detalhes: `Respondente concluiu o assessment de ${resultado.gravado.avaliado_nome}`,
    dadosNovos: resultado.gravado,
  });

  return { ok: true, contadores: resultado.contadores };
}
