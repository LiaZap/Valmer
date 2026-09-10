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
