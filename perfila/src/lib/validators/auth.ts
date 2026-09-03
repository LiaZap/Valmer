import { z } from "zod";

/**
 * Entrada do formulario de login.
 *
 * O limite de tamanho existe pelo scrypt: sem teto, uma senha de alguns
 * megabytes faria o servidor gastar CPU derivando o hash de lixo, e repetir
 * isso e negacao de servico barata. 200 caracteres cobrem qualquer senha real.
 *
 * As regras de forca ficam fora daqui de proposito: quem entra ja tem a senha
 * que tem, e recusar uma senha antiga no login so tranca a pessoa do lado de
 * fora. Forca se cobra em quem define a senha.
 */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(160),
  senha: z.string().min(1).max(200),
});

/**
 * Senha nova, quando alguem a define ou troca.
 *
 * Comprimento minimo em vez de exigir simbolo e maiuscula: o comprimento e o
 * que de fato encarece o ataque, e as regras de composicao empurram a pessoa
 * para "Senha@123" e para o post-it na tela.
 */
export const senhaNovaSchema = z
  .string()
  .min(10, "A senha precisa de pelo menos 10 caracteres")
  .max(200, "Senha muito longa");

export type Login = z.infer<typeof loginSchema>;
