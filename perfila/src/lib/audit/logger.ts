import { db } from "@/lib/db";
import { auditoria } from "@/lib/db/schema";

type Registro = {
  userId: string;
  acao: "criar" | "atualizar" | "excluir";
  tabela: string;
  registroId: string;
  detalhes: string;
  dadosAnteriores?: unknown;
  dadosNovos?: unknown;
};

/**
 * Quem executa o INSERT: o `db` normal ou o `tx` de uma transacao em curso.
 *
 * Structural: `db` e o `tx` do drizzle expoem o mesmo `insert`, entao pedir so
 * essa parte evita importar os tipos internos de transacao do drizzle.
 */
type Executor = Pick<typeof db, "insert">;

/**
 * Grava uma linha na trilha de auditoria.
 *
 * Chamar depois de toda mutacao. Recebe os objetos crus e serializa aqui,
 * para nenhuma action precisar lembrar do JSON.stringify.
 *
 * Quem mutou dentro de uma transacao PRECISA passar o `tx`: assim a linha da
 * trilha entra junto com a mutacao, e ou as duas gravam ou nenhuma. Sem isso o
 * commit acontece, a falha aqui derruba a action, e a tela mostra erro para uma
 * operacao que de fato aconteceu — em `criar()` isso faz o facilitador refazer
 * e pagar o credito duas vezes, alem de deixar a mutacao sem trilha.
 */
export async function registrarAuditoria(
  registro: Registro,
  executor: Executor = db,
): Promise<void> {
  await executor.insert(auditoria).values({
    user_id: registro.userId,
    acao: registro.acao,
    tabela: registro.tabela,
    registro_id: registro.registroId,
    detalhes: registro.detalhes,
    dados_anteriores:
      registro.dadosAnteriores === undefined ? null : JSON.stringify(registro.dadosAnteriores),
    dados_novos: registro.dadosNovos === undefined ? null : JSON.stringify(registro.dadosNovos),
  });
}
