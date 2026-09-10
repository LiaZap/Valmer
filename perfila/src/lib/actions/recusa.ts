/**
 * Recusa de regra de negocio: o pedido e valido como requisicao, mas o estado
 * do sistema nao permite atende-lo — saldo insuficiente, facilitador inativo,
 * dado que nao passa na validacao.
 *
 * Existe para separar isso de falha de verdade (banco fora do ar, bug). Uma
 * Server Action que lanca entrega ao navegador so um digest opaco em producao,
 * e a tela nao consegue distinguir "voce nao tem credito" de "o servidor
 * caiu" — a primeira o usuario resolve sozinho, a segunda nao. As actions
 * marcam a recusa com este tipo, e quem atende a tela devolve objeto para uma
 * e deixa a outra subir.
 *
 * Nao mora em `actions/assessments.ts` porque aquele modulo e "use server",
 * que so pode exportar funcoes assincronas.
 */
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

export class RecusaDeRegra extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "RecusaDeRegra";
  }
}

/**
 * Traduz a recusa para a tela, com o revalidate junto.
 *
 * Mesmo contrato de `turmas.criarPelaTela`, extraido porque os cadastros
 * (clientes, cargos, devolutivas) gravam por tres portas cada um — criar,
 * atualizar e excluir — e nove try/catch iguais e onde um deles nasce
 * diferente dos outros oito.
 *
 * Recusa de regra e erro de validacao voltam como objeto; falha de verdade
 * continua subindo. Uma Server Action que lanca entrega ao navegador um digest
 * opaco em producao, e "nome muito curto" chegaria a tela com a mesma cara de
 * "o banco caiu" — a primeira o usuario resolve sozinho, a segunda nao.
 *
 * Por causa do `revalidatePath` exige uma requisicao em curso. Quem chama de
 * script ou de teste usa a action crua.
 */
export async function paraTela<T>(
  caminho: string,
  operacao: () => Promise<T>,
): Promise<{ ok: true; dado: T } | { ok: false; erro: string }> {
  try {
    const dado = await operacao();
    revalidatePath(caminho);
    return { ok: true, dado };
  } catch (erro) {
    if (erro instanceof RecusaDeRegra) return { ok: false, erro: erro.message };
    if (erro instanceof ZodError) {
      return { ok: false, erro: erro.issues[0]?.message ?? "Dados invalidos" };
    }
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

/**
 * A mensagem legivel de uma recusa, ou null quando e falha de verdade.
 *
 * Fica ao lado de `paraTela` sem ser usada por ela, de proposito: esta versao
 * traduz TAMBEM a corrida do indice unico, e ligar isso em `paraTela` mudaria
 * calada o que clientes, cargos, devolutivas, precos e relatorio devolvem para
 * uma colisao de indice — hoje aquilo sobe como falha, que e o combinado.
 * Quem precisar da traducao pede por ela, como `facilitadores.ts` faz.
 */
export function comoRecusa(erro: unknown): string | null {
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
