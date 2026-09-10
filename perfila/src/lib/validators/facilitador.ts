import { z } from "zod";
import { pacotesCreditos } from "@/data/planos";
import { emailPessoa, nomePessoa } from "./assessment";
import { senhaNovaSchema } from "./auth";

/**
 * Fronteira das duas escritas que movem dinheiro: cadastrar o parceiro e
 * vender credito para ele.
 *
 * O pacote e validado contra `src/data/planos.ts`, e nao contra um numero
 * livre. Aceitar `creditos` cru da tela deixaria o admin creditar qualquer
 * quantidade por um campo escondido, e o preco do pacote — que e o que
 * justifica o lancamento no extrato — nao viria de lugar nenhum.
 */
const NOMES_DE_PACOTE = pacotesCreditos.map((pacote) => pacote.nome) as [string, ...string[]];

export const criarFacilitadorSchema = z.object({
  nome: nomePessoa,
  email: emailPessoa,
  empresa: z
    .string()
    .trim()
    .min(2, "Informe a empresa ou consultoria")
    .max(160, "Nome da empresa muito longo"),
  pacote: z.enum(NOMES_DE_PACOTE),
  /**
   * A senha inicial vem do formulario porque nao ha provedor de e-mail no
   * projeto. Mesmo schema que qualquer senha nova do sistema: o parceiro vai
   * usar esta senha como qualquer outra, e um minimo mais frouxo aqui seria
   * um minimo mais frouxo no login.
   */
  senha: senhaNovaSchema,
});

export const venderCreditosSchema = z.object({
  facilitador_id: z.string().uuid(),
  pacote: z.enum(NOMES_DE_PACOTE),
});

export type CriarFacilitador = z.infer<typeof criarFacilitadorSchema>;
