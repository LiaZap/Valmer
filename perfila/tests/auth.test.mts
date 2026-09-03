/**
 * Teste de integracao da autenticacao, contra o banco local.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * A mecanica de credencial e do Better Auth; o que se verifica aqui e a
 * integracao com o NOSSO schema, que e onde o mapeamento pode quebrar calado:
 * a senha guardada em `contas`, os campos de dominio (papel, ativo) chegando
 * na sessao, e a recusa de senha errada e de e-mail inexistente.
 *
 * As fixtures entram pela API da biblioteca, e nao por INSERT: e o unico jeito
 * de o hash sair no formato que o login confere.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, contas, sessoes } = await import("@/lib/db/schema");
const { auth } = await import("@/lib/auth/config");
const { definirSenha } = await import("@/lib/auth/senha");
const { eq } = await import("drizzle-orm");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";
const SENHA = "senha-de-teste-longa";

let usuarioId = "";
let email = "";

before(async () => {
  email = `login.${marca}@exemplo.com`;

  const [usuario] = await db
    .insert(usuarios)
    .values({
      nome: "Usuario do Login",
      email,
      papel: "facilitador",
      empresa: "Empresa Teste",
      creditos: 0,
      modified_by: SISTEMA,
    })
    .returning();

  usuarioId = usuario!.id;
  await definirSenha(usuarioId, SENHA);
});

after(async () => {
  await db.execute(`delete from sessoes where usuario_id = '${usuarioId}'`);
  await db.execute(`delete from contas where usuario_id = '${usuarioId}'`);
  await db.execute(`delete from auditoria where user_id = '${usuarioId}'`);
  await db.execute(`delete from usuarios where id = '${usuarioId}'`);
});

/** Entra e devolve o usuario da resposta, ou null quando a credencial e recusada. */
async function entrar(comEmail: string, comSenha: string) {
  try {
    const resposta = await auth.api.signInEmail({
      body: { email: comEmail, password: comSenha },
      headers: new Headers(),
    });
    return resposta.user as { id: string; papel?: string; ativo?: boolean; nome?: string };
  } catch {
    return null;
  }
}

describe("auth", () => {
  it("entra com a senha certa e recusa a errada", async () => {
    assert.equal((await entrar(email, SENHA))?.id, usuarioId);
    assert.equal(await entrar(email, "senha-errada"), null);
  });

  it("recusa e-mail que nao existe", async () => {
    assert.equal(await entrar(`fantasma.${marca}@exemplo.com`, SENHA), null);
  });

  it("guarda a senha em contas, e nao em usuarios", async () => {
    const [conta] = await db.select().from(contas).where(eq(contas.userId, usuarioId));
    assert.ok(conta, "a credencial existe");
    assert.equal(conta.providerId, "credential");
    assert.ok(conta.password, "o hash esta em contas.senha_hash");
    assert.ok(!conta.password!.includes(SENHA), "a senha em claro nao vai para o banco");

    const [usuario] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId));
    assert.ok(!("senha_hash" in usuario!), "usuarios nao tem mais coluna de senha");
  });

  it("o emissor da credencial e o que o login confere", async () => {
    // Gravar "credential" em vez de "local:credential" fazia a conta existir e
    // o login recusar assim mesmo, sem erro que explicasse o motivo.
    const [conta] = await db.select().from(contas).where(eq(contas.userId, usuarioId));
    assert.equal(conta!.issuer, "local:credential");
  });

  it("os campos de dominio chegam na sessao", async () => {
    // Sem os additionalFields do config, papel e ativo nao viriam, e o
    // recorte por papel nos layouts pararia de funcionar em silencio.
    const usuario = await entrar(email, SENHA);
    assert.equal(usuario?.papel, "facilitador");
    assert.equal(usuario?.ativo, true);
  });

  it("cada login abre uma sessao no banco", async () => {
    const antes = await db.select().from(sessoes).where(eq(sessoes.userId, usuarioId));
    await entrar(email, SENHA);
    const depois = await db.select().from(sessoes).where(eq(sessoes.userId, usuarioId));

    assert.equal(depois.length, antes.length + 1);
    assert.ok(depois[0]!.expiresAt > new Date(), "a sessao nasce valida");
  });

  it("redefinir a senha invalida a anterior", async () => {
    const nova = "outra-senha-longa";
    await definirSenha(usuarioId, nova);

    assert.equal((await entrar(email, nova))?.id, usuarioId);
    assert.equal(await entrar(email, SENHA), null, "a senha velha para de valer");

    await definirSenha(usuarioId, SENHA);
  });
});
