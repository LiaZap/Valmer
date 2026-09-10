/**
 * Armazenamento de arquivo: o MinIO do ambiente.
 *
 * Guarda o que nao cabe em coluna de banco — hoje a foto de perfil, amanha a
 * capa de curso, o video de aula e o PDF de relatorio. Ver `docs/infra.md`,
 * Etapa 6b.
 *
 * Quatro decisoes valem para TODO uso deste modulo, e cada uma existe por um
 * motivo que ja custou caro em algum projeto:
 *
 * 1. O BUCKET E PRIVADO, sem excecao. O acesso sai por `urlAssinada`, de prazo
 *    curto, gerada pelo servidor DEPOIS de conferir a sessao. Bucket publico
 *    entrega o arquivo a quem tiver o endereco, para sempre e sem login — e o
 *    mesmo bucket vai guardar relatorio com nome, e-mail e resultado
 *    comportamental de pessoa real. URL assinada aceita requisicao por faixa,
 *    entao video continua permitindo arrastar a barra: nao se perde nada.
 *
 * 2. O BANCO GUARDA A CHAVE, NUNCA A URL. `perfil/<id>/<uuid>.jpg`, e nao o
 *    endereco completo. O dominio de hoje e o subdominio padrao do EasyPanel;
 *    no dia em que virar dominio proprio, toda URL gravada quebraria de uma
 *    vez. A URL nasce no clique e morre no prazo.
 *
 * 3. O NOME DO OBJETO E NOSSO. Nome de arquivo vindo do navegador e texto
 *    escolhido por quem envia — `../../` inclusive — e escrever com ele e
 *    aceitar gravar onde nao devia. A chave sai de `randomUUID`, e a extensao
 *    sai do que os PRIMEIROS BYTES dizem, nao do que o cabecalho promete.
 *
 * 4. A APP NAO USA O ROOT. As credenciais do ambiente sao de uma conta de
 *    servico limitada a este bucket.
 */
import { randomUUID } from "node:crypto";
import { Client } from "minio";
import { RecusaDeRegra } from "@/lib/actions/recusa";

/** Prazo padrao de uma URL assinada. Curto: ela vive um clique, nao um dia. */
export const PRAZO_PADRAO_SEGUNDOS = 300;

/**
 * Tipos de imagem aceitos, e a extensao que cada um recebe na chave.
 *
 * Fechada de proposito: SVG fica de fora porque SVG e documento com script, e
 * um SVG servido do nosso dominio e XSS com a nossa assinatura.
 */
export const TIPOS_DE_IMAGEM = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type TipoDeImagem = keyof typeof TIPOS_DE_IMAGEM;

/** Teto da foto de perfil. Foto de rosto nao precisa de mais que isso. */
export const TAMANHO_MAXIMO_IMAGEM = 2 * 1024 * 1024;

const VARIAVEIS = [
  "MINIO_ENDPOINT",
  "MINIO_BUCKET",
  "MINIO_ACCESS_KEY",
  "MINIO_SECRET_KEY",
] as const;

let cache: { cliente: Client; bucket: string } | null = null;

/**
 * O cliente do bucket, criado uma vez.
 *
 * Variavel faltando derruba AQUI, com o nome do que falta, e na PRIMEIRA
 * chamada — nao no meio de um upload, como um 403 sem explicacao depois de a
 * pessoa ter escolhido o arquivo e esperado a barra encher.
 *
 * O endpoint aceita URL completa (`https://host`) ou so o host: o painel do
 * EasyPanel mostra a URL da API S3 com esquema, e exigir um formato so faria a
 * variavel ser copiada errado uma vez por ambiente.
 */
export function armazenamento(): { cliente: Client; bucket: string } {
  if (cache) return cache;

  const faltando = VARIAVEIS.filter((nome) => !process.env[nome]?.trim());
  if (faltando.length > 0) {
    throw new Error(
      `Armazenamento nao configurado: falta ${faltando.join(", ")} no ambiente. ` +
        "Ver docs/infra.md, Etapa 6b (MinIO), e .env.example.",
    );
  }

  const bruto = process.env.MINIO_ENDPOINT!.trim();
  const url = new URL(bruto.includes("://") ? bruto : `https://${bruto}`);
  const useSSL = url.protocol === "https:";

  const cliente = new Client({
    endPoint: url.hostname,
    ...(url.port ? { port: Number(url.port) } : {}),
    useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY!.trim(),
    secretKey: process.env.MINIO_SECRET_KEY!.trim(),
  });

  cache = { cliente, bucket: process.env.MINIO_BUCKET!.trim() };
  return cache;
}

/**
 * O tipo real do arquivo, lido dos primeiros bytes.
 *
 * Extensao e `Content-Type` sao escolhidos por quem envia: um executavel
 * renomeado para `.jpg` chega com `image/jpeg` e passa por qualquer checagem
 * que confie no cabecalho. O que nao se falsifica de graca e a assinatura no
 * comeco do arquivo.
 *
 * Devolve `null` quando nao reconhece — e ai o arquivo nao sobe.
 */
export function tipoRealDaImagem(bytes: Uint8Array): TipoDeImagem | null {
  // FF D8 FF — SOI de JPEG.
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  // 89 'P' 'N' 'G' CR LF 1A LF — assinatura de 8 bytes do PNG.
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && PNG.every((byte, i) => bytes[i] === byte)) return "image/png";
  // 'RIFF' ....(tamanho).... 'WEBP' — contêiner RIFF com o formato no byte 8.
  if (bytes.length >= 12 && texto(bytes, 0, 4) === "RIFF" && texto(bytes, 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

function texto(bytes: Uint8Array, inicio: number, fim: number): string {
  return String.fromCharCode(...bytes.subarray(inicio, fim));
}

/**
 * Sobe uma imagem e devolve a CHAVE do objeto — o que vai para o banco.
 *
 * A ordem das checagens importa: tipo declarado e TAMANHO sao conferidos antes
 * de ler um byte do arquivo, para um envio grande demais ser recusado sem
 * ocupar memoria nem trafego com um conteudo que ja se sabe que sera jogado
 * fora. So depois o conteudo e lido e comparado com o cabecalho.
 *
 * As recusas sao `RecusaDeRegra` porque sao erro de quem enviou, e a tela
 * precisa mostrar o motivo — "arquivo maior que 2 MB" nao pode chegar ao
 * navegador com a mesma cara de "o servidor caiu".
 */
export async function enviarImagem({
  prefixo,
  arquivo,
  tamanhoMaximo = TAMANHO_MAXIMO_IMAGEM,
}: {
  /** Pasta logica dentro do bucket, sem barra no fim: `perfil/<id>`. */
  prefixo: string;
  arquivo: File;
  tamanhoMaximo?: number;
}): Promise<string> {
  if (!/^[a-z0-9][a-z0-9/_-]*[a-z0-9]$/.test(prefixo)) {
    // Prefixo e do codigo, nunca do formulario. Se um dia passar a vir de
    // fora, e aqui que ele para antes de virar caminho.
    throw new Error(`Prefixo de objeto invalido: ${prefixo}`);
  }

  const declarado = arquivo.type as TipoDeImagem;
  if (!(declarado in TIPOS_DE_IMAGEM)) {
    throw new RecusaDeRegra("Formato nao aceito. Envie JPEG, PNG ou WebP.");
  }

  if (arquivo.size === 0) throw new RecusaDeRegra("Arquivo vazio.");
  if (arquivo.size > tamanhoMaximo) {
    const mb = (tamanhoMaximo / 1024 / 1024).toFixed(0);
    throw new RecusaDeRegra(`Arquivo maior que ${mb} MB. Envie uma imagem menor.`);
  }

  const bytes = Buffer.from(await arquivo.arrayBuffer());

  // O tamanho volta a ser conferido no conteudo lido: `File.size` e o que o
  // remetente diz, e a unica medida confiavel e a do buffer que temos na mao.
  if (bytes.byteLength > tamanhoMaximo) {
    throw new RecusaDeRegra("Arquivo maior que o limite. Envie uma imagem menor.");
  }

  const real = tipoRealDaImagem(bytes);
  if (real === null || real !== declarado) {
    throw new RecusaDeRegra("O arquivo enviado nao e uma imagem valida.");
  }

  const { cliente, bucket } = armazenamento();
  const chave = `${prefixo}/${randomUUID()}.${TIPOS_DE_IMAGEM[real]}`;

  await cliente.putObject(bucket, chave, bytes, bytes.byteLength, {
    "Content-Type": real,
  });

  return chave;
}

/**
 * URL temporaria de leitura de um objeto privado.
 *
 * Quem chama JA CONFERIU a sessao — este modulo nao sabe quem esta pedindo, e
 * gerar URL sem essa checagem transforma o bucket privado em publico com
 * passos a mais.
 */
export async function urlAssinada(
  chave: string,
  segundos: number = PRAZO_PADRAO_SEGUNDOS,
): Promise<string> {
  if (!chave.trim()) throw new Error("Chave de objeto vazia.");
  const { cliente, bucket } = armazenamento();
  return cliente.presignedGetObject(bucket, chave, segundos);
}

/**
 * Apaga um objeto. Chave ausente ou vazia e no-op.
 *
 * Falha aqui NAO derruba quem chamou: apagar a foto antiga acontece depois de
 * a foto nova ja estar gravada, e devolver erro nesse ponto faria a tela dizer
 * "nao deu" para uma troca que deu. O que fica e um objeto orfao e uma linha
 * no log — barato perto de um formulario que mente.
 */
export async function apagarObjeto(chave: string | null | undefined): Promise<void> {
  if (!chave?.trim()) return;
  try {
    const { cliente, bucket } = armazenamento();
    await cliente.removeObject(bucket, chave);
  } catch (erro) {
    console.error("[storage] falha ao apagar objeto", chave, erro);
  }
}

/**
 * A URL assinada de uma foto, para quem so vai DESENHAR a tela.
 *
 * Sem chave nao chama o armazenamento — e por isso um ambiente sem MinIO
 * configurado continua abrindo o portal normalmente: quem nunca enviou foto
 * nao tem chave, e a regra de "variavel faltando derruba na primeira chamada"
 * continua valendo no upload, que e onde ela importa.
 *
 * Com chave e falha no meio (bucket fora do ar, objeto apagado por fora), volta
 * `null` em vez de subir: a barra superior cai nas iniciais, que e o que ela
 * mostrava antes da foto existir. Derrubar o layout inteiro por causa de um
 * avatar seria trocar um circulo cinza por uma tela de erro.
 */
export async function urlAssinadaOuNula(
  chave: string | null | undefined,
  segundos: number = PRAZO_PADRAO_SEGUNDOS,
): Promise<string | null> {
  if (!chave?.trim()) return null;
  try {
    return await urlAssinada(chave, segundos);
  } catch (erro) {
    console.error("[storage] falha ao assinar URL", chave, erro);
    return null;
  }
}
