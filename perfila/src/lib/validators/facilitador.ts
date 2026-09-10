import { z } from "zod";
import { pacotesCreditos } from "@/data/planos";
import { emailPessoa, nomePessoa } from "./assessment";
import { senhaNovaSchema } from "./auth";
import { empresaOpcional, telefoneOpcional } from "./perfil";

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

/**
 * Fronteira da edicao do parceiro pelo admin — /admin/facilitadores/[id].
 *
 * `creditos` NAO esta aqui, e nao e campo esquecido. O saldo e materializacao
 * da soma de `creditos_transacoes`, e a migration 0005 instalou uma CONSTRAINT
 * TRIGGER DEFERRABLE que aborta o COMMIT quando os dois lados divergem: um
 * UPDATE em `usuarios.creditos` sem a linha do extrato na mesma transacao
 * derruba a transacao inteira, e o admin veria "Saldo de creditos nao bate com
 * o extrato" — erro de banco, no meio de um formulario de cadastro. Saldo so se
 * move lancando extrato, e o caminho e a venda: `venderCreditos`, na tela
 * /admin/creditos. Por isso a tela mostra o saldo como LEITURA, com link para la.
 *
 * `strictObject`, e nao `object`: o zod normalmente DESCARTA chave desconhecida
 * em silencio, e uma action que recebe `creditos: 9999` e nao reclama parece ter
 * aceitado. Aqui a chave a mais e recusada com nome. A segunda camada e o
 * UPDATE da action, que lista as cinco colunas a mao — `papel` e `creditos`
 * continuam sem caminho ate o banco mesmo que este schema afrouxe.
 *
 * Empresa e telefone entram OPCIONAIS, ao contrario do cadastro: a coluna e
 * nula para quem o seed criou sem elas e para quem as apagou no proprio perfil,
 * e um campo obrigatorio aqui trancaria a edicao dessas linhas — o admin nao
 * conseguiria nem corrigir um nome sem inventar uma empresa.
 */
export const atualizarFacilitadorSchema = z.strictObject({
  nome: nomePessoa,
  /**
   * O e-mail e a CREDENCIAL de login: troca-lo troca por onde o parceiro entra.
   * Muda so por aqui, com o admin sabendo — o proprio parceiro nao alcanca este
   * campo (ver `atualizarPerfilSchema`).
   */
  email: emailPessoa,
  empresa: empresaOpcional,
  telefone: telefoneOpcional,
  /** Situacao da conta. `lib/auth/config.ts` recusa o login de quem esta `false`. */
  ativo: z.boolean(),
});

export type AtualizarFacilitador = z.infer<typeof atualizarFacilitadorSchema>;
