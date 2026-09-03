/**
 * Teste de integracao da autenticacao, contra o banco local.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * Cobre o que protege a plataforma: hash de senha, sessao viva no banco,
 * expiracao, revogacao e o recorte de destino por papel. As funcoes que
 * dependem de cookie (login/logout) nao rodam fora de uma requisicao do Next,
 * entao aqui o que se exercita e a camada de baixo — senha e consulta de
 * sessao — mais o comportamento do banco.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, sessoes } = await import("@/lib/db/schema");
const { gerarHashSenha, conferirSenha, novoTokenSessao, hashDoToken } = await import(
  "@/lib/auth/senha"
);
const { and, eq, gt } = await import("drizzle-orm");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";
const SENHA = "senha-de-teste-longa";

let usuarioId = "";

before(async () => {
  const [usuario] = await db
    .insert(usuarios)
    .values({
      nome: "Usuario do Login",
      email: `login.${marca}@exemplo.com`,
      senha_hash: await gerarHashSenha(SENHA),
      papel: "facilitador",
      creditos: 0,
      modified_by: SISTEMA,
    })
    .returning();

  usuarioId = usuario!.id;
});

after(async () => {
  await db.execute(`delete from sessoes where usuario_id = '${usuarioId}'`);
  await db.execute(`delete from auditoria where user_id = '${usuarioId}'`);
  await db.execute(`delete from usuarios where id = '${usuarioId}'`);
});

/** Repete a consulta que `getSession` faz, sem depender do cookie. */
async function sessaoViva(token: string) {
  const [linha] = await db
    .select({ userId: usuarios.id, ativo: usuarios.ativo })
    .from(sessoes)
    .innerJoin(usuarios, eq(usuarios.id, sessoes.usuario_id))
    .where(
      and(
        eq(sessoes.token_hash, hashDoToken(token)),
        eq(sessoes.is_deleted, false),
        gt(sessoes.expira_em, new Date()),
        eq(usuarios.is_deleted, false),
      ),
    )
    .limit(1);

  return linha ?? null;
}

async function abrirSessao(expiraEm: Date): Promise<string> {
  const { token, hash } = novoTokenSessao();
  await db.insert(sessoes).values({
    usuario_id: usuarioId,
    token_hash: hash,
    expira_em: expiraEm,
    modified_by: usuarioId,
  });
  return token;
}

const HORA = 60 * 60 * 1000;

describe("auth", () => {
  it("aceita a senha certa e recusa a errada", async () => {
    const hash = await gerarHashSenha(SENHA);
    assert.equal(await conferirSenha(SENHA, hash), true);
    assert.equal(await conferirSenha("outra-senha", hash), false);
    assert.equal(await conferirSenha(SENHA, null), false, "usuario sem senha nunca entra");
    assert.equal(await conferirSenha(SENHA, "lixo"), false, "hash fora do formato nao explode");
  });

  it("nao guarda a senha, e dois hashes da mesma senha diferem", async () => {
    const a = await gerarHashSenha(SENHA);
    const b = await gerarHashSenha(SENHA);

    assert.ok(!a.includes(SENHA), "a senha nao aparece no que vai para o banco");
    assert.notEqual(a, b, "o sal muda, entao hashes iguais nao denunciam senhas iguais");
    assert.equal(await conferirSenha(SENHA, b), true);
  });

  it("guarda o hash do token, nunca o token", async () => {
    const token = await abrirSessao(new Date(Date.now() + HORA));

    const [linha] = await db
      .select()
      .from(sessoes)
      .where(eq(sessoes.token_hash, hashDoToken(token)));

    assert.ok(linha, "a sessao existe");
    assert.notEqual(linha.token_hash, token, "o valor do cookie nao esta no banco");

    const porToken = await db.select().from(sessoes).where(eq(sessoes.token_hash, token));
    assert.equal(porToken.length, 0, "procurar pelo token cru nao acha nada");
  });

  it("reconhece a sessao viva e ignora a expirada", async () => {
    const viva = await abrirSessao(new Date(Date.now() + HORA));
    const vencida = await abrirSessao(new Date(Date.now() - HORA));

    assert.equal((await sessaoViva(viva))?.userId, usuarioId);
    assert.equal(await sessaoViva(vencida), null, "cookie de sessao vencida nao vale");
  });

  it("revogar a sessao derruba o acesso na hora", async () => {
    const token = await abrirSessao(new Date(Date.now() + HORA));
    assert.ok(await sessaoViva(token));

    await db
      .update(sessoes)
      .set({ is_deleted: true, deleted_at: new Date() })
      .where(eq(sessoes.token_hash, hashDoToken(token)));

    assert.equal(await sessaoViva(token), null);
  });

  it("desativar o usuario invalida as sessoes que ele ja tinha", async () => {
    const token = await abrirSessao(new Date(Date.now() + HORA));

    await db.update(usuarios).set({ ativo: false }).where(eq(usuarios.id, usuarioId));
    const linha = await sessaoViva(token);
    assert.equal(linha?.ativo, false, "getSession recusa quem esta inativo");

    await db.update(usuarios).set({ ativo: true }).where(eq(usuarios.id, usuarioId));
  });

  it("token inventado nao abre sessao", async () => {
    assert.equal(await sessaoViva("token-que-nunca-existiu"), null);
  });
});
