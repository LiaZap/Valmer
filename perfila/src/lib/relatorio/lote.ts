/**
 * Execucao em lote com concorrencia limitada.
 *
 * Existe por causa dos 700 relatorios que o cliente precisa emitir. Disparar
 * 700 geracoes de uma vez bate no rate limit da API e abre 700 abas do Chrome:
 * aqui um numero fixo de trabalhadores puxa da mesma lista, e a falha de um
 * token nao derruba os outros 699.
 *
 * Nao ha fila persistente. Se o processo morrer no meio, a retomada vem do
 * banco: `gerarESalvar` devolve a narrativa que ja existe em vez de gerar
 * outra, entao rodar o mesmo comando de novo continua de onde parou.
 */

export type Resultado<T, R> =
  | { item: T; ok: true; valor: R }
  | { item: T; ok: false; erro: string };

export function mensagemDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro);
}

/**
 * Roda `tarefa` sobre `itens` com no maximo `concorrencia` em voo.
 * Devolve um resultado por item, na ordem da entrada.
 *
 * ponytail: concorrencia fixa. Se a API passar a devolver 429 com frequencia,
 * o proximo passo e reduzir o numero em voo ao ver o erro, e nao aumentar a
 * espera entre tentativas (isso o SDK ja faz).
 */
export async function emLote<T, R>(
  itens: readonly T[],
  concorrencia: number,
  tarefa: (item: T, indice: number) => Promise<R>,
): Promise<Resultado<T, R>[]> {
  const resultados = new Array<Resultado<T, R>>(itens.length);
  let proximo = 0;

  async function trabalhador(): Promise<void> {
    for (let i = proximo++; i < itens.length; i = proximo++) {
      const item = itens[i];
      try {
        resultados[i] = { item, ok: true, valor: await tarefa(item, i) };
      } catch (erro) {
        resultados[i] = { item, ok: false, erro: mensagemDoErro(erro) };
      }
    }
  }

  const trabalhadores = Math.min(Math.max(1, concorrencia), itens.length);
  await Promise.all(Array.from({ length: trabalhadores }, trabalhador));
  return resultados;
}

/**
 * Le a lista de tokens de um texto: um por linha, `#` comenta o resto da linha.
 *
 * A duplicata sai fora porque duas geracoes do mesmo token em voo ao mesmo
 * tempo nao se enxergam: as duas leriam o banco sem narrativa, as duas
 * chamariam a API e as duas seriam cobradas.
 */
export function tokensDoTexto(texto: string): string[] {
  const vistos = new Set<string>();

  for (const linha of texto.split(/\r?\n/)) {
    const token = linha.split("#")[0].trim();
    if (token) vistos.add(token);
  }

  return [...vistos];
}
