import { z } from "zod";
import { nomePessoa } from "./assessment";
import { senhaNovaSchema } from "./auth";

/**
 * Fronteira do que o PROPRIO parceiro pode mudar na conta dele.
 *
 * A lista e curta e fechada de proposito: nome, empresa e telefone. Papel,
 * creditos, situacao (`ativo`) e e-mail sao decisao do dono da plataforma e
 * mudam so pelas telas do admin — os quatro juntos definem quanto a conta pode
 * gastar e o que ela enxerga.
 *
 * O E-MAIL fica de fora porque e a CREDENCIAL de login e a chave da auditoria.
 * Trocar sem reverificar tranca a pessoa para fora da propria conta ao primeiro
 * erro de digitacao, e reverificar exige envio de e-mail, que o projeto ainda
 * nao tem (falta o Resend — ver a nota de `emailAndPassword` em
 * lib/auth/config.ts). Nao e campo esquecido: quando houver envio de e-mail,
 * o caminho e "pedir a troca -> confirmar no endereco novo", nunca um input a
 * mais neste schema.
 *
 * `strictObject`, e nao `object`: o zod normalmente DESCARTA chave
 * desconhecida em silencio, e uma action que recebe `papel: "admin"` e nao
 * reclama parece ter aceitado. Aqui a chave a mais e recusada com nome, que e
 * o que a tela — e o teste de escalada de privilegio — precisam ver. A segunda
 * camada e o UPDATE, que lista as tres colunas a mao.
 */
const TELEFONE_RE = /^[\d\s()+-]{8,20}$/;

/**
 * Campo de texto opcional: vazio vira NULL, e nao string vazia.
 *
 * As duas colunas ja nascem nulas para quem o admin cadastrou sem elas, e
 * gravar "" faria a mesma ausencia ter duas representacoes — a tela mostra
 * "Sem empresa" para uma e nada para a outra.
 */
const vazioVirandoNulo = z
  .string()
  .trim()
  .transform((valor) => (valor === "" ? null : valor));

export const atualizarPerfilSchema = z.strictObject({
  nome: nomePessoa,
  empresa: vazioVirandoNulo.refine(
    (valor) => valor === null || (valor.length >= 2 && valor.length <= 160),
    "Empresa: informe de 2 a 160 caracteres, ou deixe em branco",
  ),
  telefone: vazioVirandoNulo.refine(
    (valor) => valor === null || TELEFONE_RE.test(valor),
    "Telefone invalido: use DDD e numero, de 8 a 20 caracteres",
  ),
});

export const trocarSenhaSchema = z.strictObject({
  senha_atual: z.string().min(1, "Informe a senha atual").max(200),
  senha_nova: senhaNovaSchema,
});

export type AtualizarPerfil = z.infer<typeof atualizarPerfilSchema>;
