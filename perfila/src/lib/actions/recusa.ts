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
export class RecusaDeRegra extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = "RecusaDeRegra";
  }
}
