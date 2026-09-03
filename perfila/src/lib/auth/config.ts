/**
 * Better Auth, ligado ao schema que ja existia.
 *
 * O projeto nao adotou as tabelas padrao da biblioteca: `usuarios` ja tinha
 * dados, FKs de `assessments` e `creditos_transacoes` apontando para ela, e
 * colunas de dominio (papel, creditos, empresa, telefone) que o produto usa em
 * toda tela. Em vez de duplicar pessoas em duas tabelas, o mapeamento abaixo
 * ensina a biblioteca a usar as nossas. Ver ADR-0004.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { contas, sessoes, usuarios, verificacoes } from "@/lib/db/schema";

const segredo = process.env.BETTER_AUTH_SECRET;
if (!segredo) {
  // Sem segredo o Better Auth assina cookie com um valor previsivel, e sessao
  // assinada com segredo conhecido nao vale nada. Falhar no boot e melhor que
  // subir uma plataforma que so parece autenticada.
  throw new Error(
    "BETTER_AUTH_SECRET nao definida. Gere uma com `openssl rand -base64 32` e coloque em .env.local.",
  );
}

export const auth = betterAuth({
  secret: segredo,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  database: drizzleAdapter(db, {
    provider: "pg",
    // As chaves precisam bater com os `modelName` abaixo, e nao com os nomes
    // internos da biblioteca: e por elas que o adapter acha cada tabela.
    schema: { usuarios, sessoes, contas, verificacoes },
  }),

  emailAndPassword: {
    enabled: true,
    // Sem fluxo de confirmacao por e-mail ainda: quem cria conta e o admin,
    // que ja conhece o parceiro. Exigir confirmacao agora trancaria todo mundo
    // do lado de fora, porque nao ha envio de e-mail no ar (falta o Resend).
    requireEmailVerification: false,
    minPasswordLength: 10,
    // Conta na plataforma se cria pelo admin, nunca pela internet. Sem isto o
    // catch-all publica POST /api/auth/sign-up/email, e o que hoje impede o
    // cadastro e so o NOT NULL de usuarios.modified_by — uma constraint de
    // auditoria, que nao e cadeado de autorizacao e pode ganhar default a
    // qualquer momento sem ninguem ligar uma coisa a outra.
    disableSignUp: true,
  },

  user: {
    modelName: "usuarios",
    fields: {
      // A esquerda o nome do Better Auth, a direita a chave no nosso schema.
      name: "nome",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    additionalFields: {
      // `input: false` em todos: sao decisoes do negocio, e nenhum deles pode
      // chegar pelo corpo de um POST de cadastro. Papel e saldo definidos pelo
      // proprio usuario seriam escalonamento de privilegio e credito de graca.
      papel: { type: "string", required: false, defaultValue: "facilitador", input: false },
      empresa: { type: "string", required: false, input: false },
      telefone: { type: "string", required: false, input: false },
      creditos: { type: "number", required: false, defaultValue: 0, input: false },
      ativo: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },

  session: {
    modelName: "sessoes",
    // O docs/oauth.md pede 24h; o Better Auth conta em segundos.
    expiresIn: 24 * 60 * 60,
    // Renova a sessao quando faltar menos de uma hora, para quem esta usando a
    // plataforma nao ser deslogado no meio de um trabalho.
    updateAge: 60 * 60,
  },

  account: { modelName: "contas" },
  verification: { modelName: "verificacoes" },

  advanced: {
    database: {
      // Deixa o Postgres gerar o id. Sem isto o Better Auth gera uma string
      // propria, que nao cabe numa coluna uuid — e as FKs de assessments e
      // creditos_transacoes apontam para uuid.
      generateId: false,
    },
  },

  // Sem isto, chamar signIn de dentro de uma Server Action nao grava o cookie:
  // o Set-Cookie da resposta se perde no caminho.
  plugins: [nextCookies()],
});

export type SessaoBetterAuth = typeof auth.$Infer.Session;
