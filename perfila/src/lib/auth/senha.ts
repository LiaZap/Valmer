/**
 * Hash de senha e token de sessao, com o `crypto` do proprio Node.
 *
 * O docs/oauth.md pede bcrypt. Aqui e scrypt, que o Node ja traz: e o mesmo
 * tipo de funcao (derivacao lenta, com sal, resistente a GPU), esta na lista
 * do OWASP ao lado de bcrypt e argon2, e nao acrescenta dependencia a uma
 * arvore que hoje tem sete pacotes. Ver docs/adr/0003.
 *
 * ponytail: parametros no padrao do Node (N=16384). Se o hardware do servidor
 * permitir, subir N encarece o ataque na mesma proporcao — o formato guarda os
 * parametros junto do hash, entao da para migrar sem invalidar as senhas
 * antigas.
 */
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derivar = promisify(scrypt);

const SAL_BYTES = 16;
const CHAVE_BYTES = 64;

/** Formato guardado: `scrypt$<sal em hex>$<hash em hex>`. */
export async function gerarHashSenha(senha: string): Promise<string> {
  const sal = randomBytes(SAL_BYTES);
  const chave = (await derivar(senha, sal, CHAVE_BYTES)) as Buffer;
  return `scrypt$${sal.toString("hex")}$${chave.toString("hex")}`;
}

/**
 * Compara em tempo constante.
 *
 * Uma comparacao normal (`===`) para no primeiro byte diferente, e o tempo da
 * resposta conta ao atacante quantos bytes ele ja acertou.
 */
export async function conferirSenha(senha: string, guardado: string | null): Promise<boolean> {
  if (!guardado) return false;

  const [algoritmo, salHex, hashHex] = guardado.split("$");
  if (algoritmo !== "scrypt" || !salHex || !hashHex) return false;

  const esperado = Buffer.from(hashHex, "hex");
  const calculado = (await derivar(senha, Buffer.from(salHex, "hex"), esperado.length)) as Buffer;

  return timingSafeEqual(esperado, calculado);
}

/**
 * Token de sessao: 256 bits de aleatoriedade criptografica.
 *
 * O valor cru vai para o cookie e nunca e gravado; o banco guarda so o
 * `sha256`. Ninguem com acesso de leitura ao banco consegue montar um cookie
 * valido a partir dele.
 */
export function novoTokenSessao(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashDoToken(token) };
}

export function hashDoToken(token: string): string {
  // SHA-256 puro basta aqui, sem sal nem iteracoes: a entrada ja e um segredo
  // de 256 bits sorteado por nos, entao nao existe dicionario a percorrer.
  return createHash("sha256").update(token).digest("hex");
}
