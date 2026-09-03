/**
 * Usuarios da plataforma: o admin e os facilitadores (parceiros).
 *
 * A especificacao do cliente chama esta tabela de `users` e trata os dois
 * papeis na mesma entidade — os campos sao os mesmos e o que muda e o
 * acesso. Mantido assim.
 *
 * E tambem o modelo `user` do Better Auth, mapeado em `lib/auth/config.ts`.
 * A senha NAO mora aqui: ela fica em `contas`, com o resto das credenciais,
 * que e como o Better Auth organiza. Ver ADR-0004.
 */
import { pgTable, uuid, text, integer, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { TEMPO } from "./tempo";
import { papelUsuario } from "./enums";

export const usuarios = pgTable(
  "usuarios",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // --- colunas de dominio ---
    nome: text("nome").notNull(),
    email: text("email").notNull(),
    /** Exigido pelo Better Auth. Sem fluxo de confirmacao por e-mail ainda. */
    emailVerified: boolean("email_verificado").notNull().default(false),
    /** Foto de perfil. Exigido pelo Better Auth; a interface ainda usa iniciais. */
    image: text("imagem"),
    papel: papelUsuario("papel").notNull().default("facilitador"),
    empresa: text("empresa"),
    /**
     * Contato impresso na capa e no rodape do relatorio. E o do facilitador,
     * nao o da plataforma: o relatorio chega ao cliente final por ele.
     */
    telefone: text("telefone"),
    /** Saldo de creditos. Derivado das transacoes, materializado para leitura. */
    creditos: integer("creditos").notNull().default(0),
    ativo: boolean("ativo").notNull().default(true),

    // --- colunas de auditoria OBRIGATORIAS (nunca omitir) ---
    created_at: timestamp("created_at", TEMPO).notNull().defaultNow(),
    updated_at: timestamp("updated_at", TEMPO).notNull().defaultNow(),
    deleted_at: timestamp("deleted_at", TEMPO),
    is_deleted: boolean("is_deleted").notNull().default(false),
    modified_by: uuid("modified_by").notNull(),
  },
  (t) => [
    uniqueIndex("uq_usuarios_email").on(t.email),
    index("idx_usuarios_ativos").on(t.is_deleted),
  ],
);

export type Usuario = typeof usuarios.$inferSelect;
export type NovoUsuario = typeof usuarios.$inferInsert;
