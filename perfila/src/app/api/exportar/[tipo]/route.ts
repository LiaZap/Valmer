/**
 * Download das exportacoes em CSV: /api/exportar/<tipo>.
 *
 * Route Handler, e nao Server Action: action devolve dado para a tela, nunca
 * uma resposta com `Content-Disposition` — e e o cabecalho que faz o navegador
 * salvar o arquivo em vez de exibi-lo.
 *
 * A rota confere sessao e permissao do mesmo jeito das actions, e as leituras
 * de `lib/exportar.ts` conferem de novo por dentro, cada uma com o recorte por
 * dono no WHERE. A checagem daqui existe para a recusa ter STATUS (401/403 em
 * vez de 500), e nao para substituir a de la: quem exporta e a mesma consulta
 * da tela, com a mesma regra.
 */
import { getSession, temPermissao } from "@/lib/auth";
import { csv, EXPORTACOES } from "@/lib/exportar";

/**
 * Data no nome do arquivo, no fuso de Sao Paulo.
 *
 * `sv-SE` porque o formato dele e ano-mes-dia: dois arquivos baixados em dias
 * diferentes ficam na ordem certa quando a pasta e ordenada por nome, e nao
 * viram "clientes (1).csv".
 */
const DATA_ARQUIVO = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
});

export async function GET(_requisicao: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;

  const exportacao = EXPORTACOES[tipo];
  if (!exportacao) return new Response("Exportacao nao encontrada", { status: 404 });

  const sessao = await getSession();
  if (!sessao) return new Response("Nao autenticado", { status: 401 });
  if (!temPermissao(sessao.papel, exportacao.recurso, "ler")) {
    return new Response("Sem permissao para exportar", { status: 403 });
  }

  const arquivo = `${exportacao.arquivo}-${DATA_ARQUIVO.format(new Date())}.csv`;

  return new Response(csv(await exportacao.montar()), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${arquivo}"`,
      // O arquivo carrega dado de uma conta so. Guardado em cache
      // compartilhado, o CSV de um parceiro seria servido ao proximo que
      // pedisse o mesmo endereco.
      "Cache-Control": "no-store",
    },
  });
}
