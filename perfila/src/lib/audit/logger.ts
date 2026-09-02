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
 * Grava uma linha na trilha de auditoria.
 *
 * Chamar depois de toda mutacao. Recebe os objetos crus e serializa aqui,
 * para nenhuma action precisar lembrar do JSON.stringify.
 */
export async function registrarAuditoria(registro: Registro): Promise<void> {
  await db.insert(auditoria).values({
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
