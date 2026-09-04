/**
 * PDF do relatorio, renderizado no servidor.
 *
 * O Puppeteer abre a MESMA rota `/relatorio/<token>` que a pessoa ve na tela e
 * imprime com as regras de `@media print` que ja existem em page.module.css.
 * Um caminho so evita o classico de o PDF sair diferente do que foi revisado.
 *
 * Roda SOMENTE fora do Next: quem chama e o CLI (`npm run relatorio:gerar`),
 * com a aplicacao no ar em `--url`. Nao importe daqui de dentro de uma rota:
 * cada chamada sobe um Chrome, e a rota do relatorio e publica.
 */
import { renameSync, rmSync } from "node:fs";
import puppeteer, { type Browser } from "puppeteer";

/**
 * Espelha o `@page { size: A4; margin: 20mm }` de page.module.css.
 *
 * Quem manda de verdade e o CSS: quando a pagina declara `@page`, o Chrome
 * ignora a margem passada aqui (medido — trocar este valor por zero produz PDF
 * identico, byte a byte). Estes numeros sao a rede de seguranca para o dia em
 * que a regra sair do CSS, e por isso precisam continuar iguais aos de la.
 */
const MARGEM = "20mm";

const MARGENS = { top: MARGEM, right: MARGEM, bottom: MARGEM, left: MARGEM };

/**
 * Um navegador para o lote inteiro, e nao um por relatorio: subir o Chrome leva
 * cerca de um segundo, e 700 vezes isso e o dobro do tempo total do lote.
 */
export async function abrirNavegador(): Promise<Browser> {
  return puppeteer.launch({
    // A VPS roda o processo como root dentro do container, onde o sandbox do
    // Chrome nao sobe. O conteudo renderizado e a nossa propria pagina.
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
}

export function urlDoRelatorio(base: string, token: string): string {
  return new URL(`/relatorio/${encodeURIComponent(token)}`, base).toString();
}

/**
 * Grava o PDF de uma URL. Uma aba por chamada, fechada no fim: abas abertas
 * acumulam memoria e derrubam o Chrome antes do fim de um lote grande.
 */
export async function salvarPdf(navegador: Browser, url: string, destino: string): Promise<void> {
  const pagina = await navegador.newPage();

  // Grava num parcial e renomeia no fim. O rename dentro da mesma pasta e
  // atomico, entao o destino ou existe inteiro ou nao existe. Sem isso um
  // processo morto no meio da gravacao, que e exatamente o caso para o qual a
  // retomada existe, deixaria um PDF truncado no disco; na rodada seguinte a
  // retomada veria o arquivo, pularia o token e chamaria aquilo de sucesso.
  const parcial = `${destino}.parcial`;

  try {
    const resposta = await pagina.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });

    // Token invalido devolve 404, e o 404 tambem renderiza. Sem esta checagem o
    // lote gravaria PDFs bem formatados da pagina de erro e diria que deu certo.
    if (!resposta?.ok()) {
      throw new Error(`HTTP ${resposta?.status() ?? "sem resposta"} em ${url}`);
    }

    await pagina.pdf({
      path: parcial,
      format: "A4",
      margin: MARGENS,
      // A capa e os destaques do relatorio sao area preenchida. Sem isto o
      // Chrome descarta todo fundo e o documento sai em branco e preto.
      printBackground: true,
    });

    renameSync(parcial, destino);
  } finally {
    await pagina.close();
    // Depois de um rename bem-sucedido o parcial nao existe mais, e `force`
    // faz disto um no-op. O que ele limpa e o parcial da tentativa que falhou.
    rmSync(parcial, { force: true });
  }
}
