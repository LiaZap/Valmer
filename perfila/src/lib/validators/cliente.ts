import { z } from "zod";
import { emailPessoa, nomePessoa } from "./assessment";

/**
 * Cliente do parceiro — a mesma pessoa que aparece como avaliado no
 * assessment.
 *
 * Nome e e-mail reaproveitam `nomePessoa` e `emailPessoa` DE PROPOSITO, e nao
 * por economia: o formato e da PESSOA, nao do papel dela. Duas regras de
 * e-mail no projeto viram duas respostas para o mesmo endereco — e a de la ja
 * aplica `toLowerCase`, que e o que faz o indice unico por dono reconhecer
 * "Ana@x.com" e "ana@x.com" como a mesma pessoa.
 *
 * O celular fica solto de proposito: entra por WhatsApp, colado de agenda, com
 * ou sem +55, com ou sem parenteses. Regex aqui recusaria numero valido e o
 * campo nao dispara nada — nenhum envio depende dele. Vazio vira NULL, para o
 * banco nao guardar string em branco como se fosse contato.
 */
export const criarClienteSchema = z.object({
  nome: nomePessoa,
  email: emailPessoa,
  celular: z
    .string()
    .trim()
    .max(30, "Celular muito longo")
    .optional()
    .transform((valor) => (valor ? valor : null)),
  /** Opcional: o admin cadastra em nome de um parceiro. */
  facilitador_id: z.string().uuid().optional(),
});

/**
 * Edicao: o dono nao entra.
 *
 * Trocar `facilitador_id` de um cliente existente moveria a pessoa para a
 * carteira do concorrente, junto do historico de edicao dela.
 */
export const atualizarClienteSchema = criarClienteSchema.omit({ facilitador_id: true });

export type CriarCliente = z.infer<typeof criarClienteSchema>;
export type AtualizarCliente = z.infer<typeof atualizarClienteSchema>;
