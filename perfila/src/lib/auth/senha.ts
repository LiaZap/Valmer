/**
 * Define a senha de um usuario que ja existe na tabela.
 *
 * NAO e "use server" de proposito, pelo mesmo motivo de
 * `relatorio/persistir.ts`: toda funcao exportada de um modulo "use server"
 * vira endpoint POST publico assim que qualquer arquivo de `src/app/` a
 * importa — e basta um Server Component para isso, nao precisa de client
 * component. Uma troca de senha por id, aberta na internet, e tomada de conta.
 *
 * Quem chama daqui e o seed e os testes, que ja rodam com acesso direto ao
 * banco. No dia em que a tela do admin tiver o botao, o lugar dele e uma
 * action fina por cima disto, com sessao, `usuarios:atualizar`,
 * `senhaNovaSchema` e auditoria — como em actions/assessments.ts.
 *
 * O caminho normal do Better Auth (`signUpEmail`) cria o usuario junto, e aqui
 * ele ja veio do admin ou do seed, com papel, empresa e saldo definidos. Isto
 * so acrescenta a senha, no mesmo formato que a biblioteca confere no login.
 */
import { and, eq } from "drizzle-orm";
import { createLocalAccountIssuer } from "@better-auth/core/db";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { auth } from "@/lib/auth/config";

export async function definirSenha(usuarioId: string, senha: string): Promise<void> {
  const [usuario] = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.id, usuarioId), eq(usuarios.is_deleted, false)))
    .limit(1);
  if (!usuario) throw new Error("Usuario nao encontrado");

  const contexto = await auth.$context;
  const hash = await contexto.password.hash(senha);

  const existente = await contexto.internalAdapter.findAccounts(usuarioId);
  const credencial = existente.find((conta) => conta.providerId === "credential");

  if (credencial) {
    await contexto.internalAdapter.updateAccount(credencial.id, { password: hash });
    return;
  }

  await contexto.internalAdapter.createAccount({
    userId: usuarioId,
    providerId: "credential",
    // O emissor vem da funcao da biblioteca, e nao da string "credential": o
    // login compara com `createLocalAccountIssuer("credential")`, que hoje
    // resolve para "local:credential". Escrever o valor a mao fazia a conta
    // existir no banco e o login recusar assim mesmo.
    issuer: createLocalAccountIssuer("credential"),
    accountId: usuarioId,
    password: hash,
  });
}
