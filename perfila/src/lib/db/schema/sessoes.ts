/**
 * Tabelas que o Better Auth administra: sessao, conta e verificacao.
 *
 * Os nomes das COLUNAS seguem o projeto (portugues, snake_case); os nomes das
 * CHAVES seguem o Better Auth, porque e por elas que o adapter do Drizzle
 * encontra cada campo. Onde os dois divergem, `lib/auth/config.ts` faz o
 * mapeamento explicito.
 *
 * As quatro colunas de auditoria estao aqui como em toda tabela do projeto,
 * com default onde o Better Auth nao as preenche — ele ignora coluna que nao
 * conhece, entao elas convivem sem atrapalhar.
 */
import { pgTable, uuid, text, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { usuarios } from "./usuarios";
import { TEMPO } from "./tempo";

/** Quem assina o que o Better Auth grava sozinho. Ver ADR-0002 e ADR-0004. */
const SENTINELA = sql`'00000000-0000-0000-0000-000000000000'::uuid`;

export const sessoes = pgTable(
  "sessoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    userId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    /**
     * O Better Auth guarda o token da sessao em claro, e e ele quem le esta
     * coluna — nao da para gravar um hash aqui sem reescrever o adapter. Quem
     * tiver leitura da tabela consegue se passar por qualquer sessao viva, e e
     * por isso que o acesso ao banco de producao e restrito. Ver ADR-0004.
     */
    token: text("token").notNull(),
    expiresAt: timestamp("expira_em", TEMPO).notNull(),
    ipAddress: text("ip"),
    userAgent: text("user_agent"),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    createdAt: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull().default(SENTINELA),
  },
  (t) => [uniqueIndex("uq_sessoes_token").on(t.token), index("idx_sessoes_usuario").on(t.userId)],
);

/**
 * Credenciais de acesso. Para e-mail e senha existe uma linha por usuario, com
 * `providerId` igual a "credential" e a senha ja derivada em `password`.
 *
 * A senha mora aqui, e nao em `usuarios`: e assim que o Better Auth organiza,
 * e e o que permite um dia acrescentar login por Google sem mexer no usuario.
 */
export const contas = pgTable(
  "contas",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    userId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "restrict" }),
    accountId: text("conta_externa_id").notNull(),
    providerId: text("provedor").notNull(),
    /** Quem emitiu a credencial. Para e-mail e senha, a propria plataforma. */
    issuer: text("emissor").notNull(),
    password: text("senha_hash"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expira_em", TEMPO),
    refreshTokenExpiresAt: timestamp("refresh_token_expira_em", TEMPO),
    scope: text("escopo"),
    idToken: text("id_token"),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    createdAt: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull().default(SENTINELA),
  },
  (t) => [
    uniqueIndex("uq_contas_emissor_conta").on(t.issuer, t.accountId),
    index("idx_contas_usuario").on(t.userId),
  ],
);

/**
 * Tokens de uso unico: confirmacao de e-mail e troca de senha.
 *
 * Sem FK para `usuarios` de proposito: o Better Auth guarda aqui o e-mail
 * digitado, que pode nem existir na base — e justamente o caso de "recuperar
 * senha de um e-mail que nao e cliente".
 */
export const verificacoes = pgTable(
  "verificacoes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    identifier: text("identificador").notNull(),
    value: text("valor").notNull(),
    expiresAt: timestamp("expira_em", TEMPO).notNull(),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    createdAt: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull().default(SENTINELA),
  },
  (t) => [index("idx_verificacoes_identificador").on(t.identifier)],
);

export type SessaoRegistro = typeof sessoes.$inferSelect;
export type ContaRegistro = typeof contas.$inferSelect;
export type VerificacaoRegistro = typeof verificacoes.$inferSelect;
