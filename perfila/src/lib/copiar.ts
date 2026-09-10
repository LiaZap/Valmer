/**
 * Copiar texto para a area de transferencia, do lado do navegador.
 *
 * Existe porque `navigator.clipboard` SO existe em contexto seguro: em HTTP
 * puro, que e como a homologacao e acessada, o objeto e `undefined`. O
 * `navigator.clipboard?.writeText(...)` que estava espalhado pelos chamadores
 * engolia a chamada calado — o botao acendia, nada era copiado, e o
 * facilitador colava no e-mail do cliente dele o que estivesse na area de
 * transferencia antes. A correcao mora aqui, uma vez, e nao em cada botao.
 *
 * Sao tres degraus, do melhor para o pior, e nenhum deles mente:
 *
 * 1. `navigator.clipboard`, quando existe e o navegador deixa;
 * 2. selecao invisivel + `execCommand("copy")`, obsoleto e ainda o unico
 *    caminho que copia DE VERDADE fora de HTTPS;
 * 3. `prompt`, que nao copia mas mostra o endereco para a pessoa copiar a mao.
 *
 * O degrau 3 e o aviso: quem chamou nao precisa avisar de novo, so precisa
 * saber se houve copia automatica para dizer "copiado". Nunca lanca — um botao
 * de copiar nao derruba a tela.
 *
 * So para componente de cliente: toca `navigator`, `document` e `prompt`.
 */

/**
 * A fatia do navegador que esta funcao usa.
 *
 * E parametro, e nao leitura direta de `window` no corpo, para o teste provar
 * os tres degraus sem DOM — mesmo motivo do `ambiente` de `narrativaParaExibir`.
 */
export type Navegador = {
  navigator: { clipboard?: { writeText: (texto: string) => Promise<void> } };
  document?: Document;
  prompt: (mensagem?: string, valor?: string) => string | null;
};

// Texto de tela, entao vai acentuado: o resto do arquivo e comentario.
const AVISO = "Não foi possível copiar sozinho. Selecione o endereço abaixo e copie:";

/** Verdadeiro quando o texto foi para a area de transferencia sem ajuda. */
export async function copiarTexto(
  texto: string,
  janela: Navegador = window,
): Promise<boolean> {
  try {
    if (janela.navigator.clipboard) {
      await janela.navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Permissao negada, aba sem foco, iframe sem permissao: ainda ha o degrau
    // de baixo, entao a falha aqui nao encerra a tentativa.
  }

  const documento = janela.document;
  if (documento) {
    // Tudo dentro do try: `createElement`, `appendChild` e `select` tambem
    // podem lancar, e um botao de copiar nao derruba a tela. O campo sai da
    // pagina no finally mesmo quando a copia falha no meio.
    let campo: HTMLTextAreaElement | null = null;
    try {
      campo = documento.createElement("textarea");
      campo.value = texto;
      // Fora da tela e somente-leitura: o campo existe por um instante, nao
      // rola a pagina e nao abre teclado no celular.
      campo.readOnly = true;
      campo.style.position = "fixed";
      campo.style.top = "0";
      campo.style.opacity = "0";
      documento.body.appendChild(campo);
      campo.select();

      if (documento.execCommand("copy")) return true;
    } catch {
      // Navegador que ja removeu o execCommand: cai no aviso de baixo.
    } finally {
      campo?.remove();
    }
  }

  janela.prompt(AVISO, texto);
  return false;
}
