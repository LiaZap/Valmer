/**
 * Grava a narrativa do relatorio, versionada.
 *
 * NAO e "use server" de proposito. Uma Server Action vira endpoint POST
 * publico, e `gerarESalvar` gasta dinheiro a cada chamada: exposta assim, um
 * script de terceiro esvaziaria a conta da API repetindo a mesma requisicao.
 * Quem chama daqui e o CLI (`npm run relatorio:gerar`), que ja roda com acesso
 * ao banco e a chave. No dia em que a UI tiver um botao, o lugar dele e uma
 * action fina por cima disto, com sessao e escopo do dono como em
 * actions/assessments.ts.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessments, assessmentsRelatorios } from "@/lib/db/schema";
import { registrarAuditoria } from "@/lib/audit/logger";
import { resultadoDeContadores } from "@/lib/disc";
import { gerarNarrativa } from "./gerar";
import type { NarrativaRelatorio } from "./tipos";
import type { FatorDisc } from "@/data/dna";

/** Assina as linhas escritas pelo gerador; nao ha pessoa por tras delas. */
const GERADOR = "00000000-0000-0000-0000-000000000000";

export type FalhaPersistencia = "invalido" | "nao_concluido" | "sem_contadores";

type Recusa = { ok: false; erro: FalhaPersistencia };

export type NarrativaGravada = {
  ok: true;
  versao: number;
  /** Verdadeiro quando ja havia narrativa e a geracao foi dispensada. */
  reaproveitada: boolean;
  narrativa: NarrativaRelatorio;
};

type Alvo = {
  id: string;
  nome: string;
  contadores: Record<FatorDisc, number>;
};

/** O assessment so rende relatorio concluido e com os quatro contadores. */
async function alvoDoToken(token: string): Promise<Alvo | Recusa> {
  const [linha] = await db
    .select()
    .from(assessments)
    .where(and(eq(assessments.token, token), eq(assessments.is_deleted, false)))
    .limit(1);

  if (!linha) return { ok: false, erro: "invalido" };
  if (linha.situacao !== "concluido") return { ok: false, erro: "nao_concluido" };

  const { contador_d, contador_i, contador_s, contador_c } = linha;
  if (contador_d === null || contador_i === null || contador_s === null || contador_c === null) {
    return { ok: false, erro: "sem_contadores" };
  }

  return {
    id: linha.id,
    nome: linha.avaliado_nome,
    contadores: { D: contador_d, I: contador_i, S: contador_s, C: contador_c },
  };
}

/**
 * Grava a narrativa como versao nova, sem apagar as anteriores.
 *
 * A versao sai de dentro da transacao, com a linha do assessment travada: duas
 * gravacoes simultaneas leriam o mesmo maximo e a segunda bateria no indice
 * unico (assessment_id, versao). O historico e exigencia de auditoria, entao
 * regravar por cima da mesma versao nao e opcao.
 */
export async function salvarNarrativa(
  token: string,
  narrativa: NarrativaRelatorio,
): Promise<NarrativaGravada | Recusa> {
  const alvo = await alvoDoToken(token);
  if ("ok" in alvo) return alvo;

  const versao = await db.transaction(async (tx) => {
    await tx.select().from(assessments).where(eq(assessments.id, alvo.id)).limit(1).for("update");

    const [ultima] = await tx
      .select({ versao: assessmentsRelatorios.versao })
      .from(assessmentsRelatorios)
      .where(eq(assessmentsRelatorios.assessment_id, alvo.id))
      .orderBy(desc(assessmentsRelatorios.versao))
      .limit(1);

    // Conta as apagadas tambem: reaproveitar o numero de uma versao soft-deletada
    // faria duas linhas diferentes responderem por "a v2 deste relatorio".
    const proxima = (ultima?.versao ?? 0) + 1;

    await tx.insert(assessmentsRelatorios).values({
      assessment_id: alvo.id,
      versao: proxima,
      narrativa,
      modified_by: GERADOR,
    });

    await registrarAuditoria(
      {
        userId: GERADOR,
        acao: "criar",
        tabela: "assessments_relatorios",
        registroId: alvo.id,
        detalhes: `Gravou a narrativa v${proxima} do relatorio de ${alvo.nome}`,
      },
      tx,
    );

    return proxima;
  });

  return { ok: true, versao, reaproveitada: false, narrativa };
}

/**
 * Escreve a narrativa pela API e grava.
 *
 * `forcar` existe porque cada chamada custa dinheiro: sem ele, rodar o comando
 * duas vezes no mesmo token devolve o que ja esta gravado em vez de pagar de
 * novo pelo mesmo texto.
 *
 * A chamada da API fica FORA da transacao: ela leva minutos, e uma transacao
 * aberta esse tempo todo segura a linha do assessment e a conexao do pool.
 */
export async function gerarESalvar(
  token: string,
  { forcar = false }: { forcar?: boolean } = {},
): Promise<NarrativaGravada | Recusa> {
  const alvo = await alvoDoToken(token);
  if ("ok" in alvo) return alvo;

  if (!forcar) {
    const [existente] = await db
      .select({
        versao: assessmentsRelatorios.versao,
        narrativa: assessmentsRelatorios.narrativa,
      })
      .from(assessmentsRelatorios)
      .where(
        and(
          eq(assessmentsRelatorios.assessment_id, alvo.id),
          eq(assessmentsRelatorios.is_deleted, false),
        ),
      )
      .orderBy(desc(assessmentsRelatorios.versao))
      .limit(1);

    if (existente) {
      return {
        ok: true,
        versao: existente.versao,
        reaproveitada: true,
        narrativa: existente.narrativa as NarrativaRelatorio,
      };
    }
  }

  const narrativa = await gerarNarrativa({
    nome: alvo.nome,
    resultado: resultadoDeContadores(alvo.contadores),
  });

  return salvarNarrativa(token, narrativa);
}
