/**
 * Teste de integracao do modulo de cursos, contra o banco local.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * Cobre o que quebra calado: RBAC (so o admin escreve), o curso nascendo como
 * rascunho, a publicacao com optimistic locking e o recorte que a plataforma
 * do aluno vai ler.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, cursos, auditoria } = await import("@/lib/db/schema");
const acoes = await import("@/lib/actions/cursos");
const { eq } = await import("drizzle-orm");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";

let admin = "";
let facilitador = "";
let cursoId = "";

function entrarComo(id: string) {
  process.env.SESSAO_DEV_USUARIO_ID = id;
}

before(async () => {
  const [a, f] = await db
    .insert(usuarios)
    .values([
      {
        nome: "Admin do teste",
        email: `admin.${marca}@exemplo.com`,
        papel: "admin" as const,
        modified_by: SISTEMA,
      },
      {
        nome: "Facilitador do teste",
        email: `fac.${marca}@exemplo.com`,
        papel: "facilitador" as const,
        modified_by: SISTEMA,
      },
    ])
    .returning();

  admin = a!.id;
  facilitador = f!.id;
});

after(async () => {
  // Limpeza de fixture, com SQL cru: e o unico lugar do projeto onde apagar de
  // verdade e o certo. A aplicacao nunca faz isso.
  const ids = [admin, facilitador];
  await db.transaction(async (tx) => {
    await tx.execute(`delete from auditoria where user_id in ('${ids.join("','")}')`);
    if (cursoId) await tx.execute(`delete from cursos where id = '${cursoId}'`);
    await tx.execute(`delete from usuarios where id in ('${ids.join("','")}')`);
  });
  delete process.env.SESSAO_DEV_USUARIO_ID;
});

describe("cursos", () => {
  it("recusa quem nao esta logado", async () => {
    delete process.env.SESSAO_DEV_USUARIO_ID;
    await assert.rejects(() => acoes.listar(), /Nao autenticado/);
  });

  it("recusa o facilitador: o curso e do dono da plataforma", async () => {
    entrarComo(facilitador);
    await assert.rejects(
      () => acoes.criar({ titulo: "Curso do parceiro", descricao: "x".repeat(20), conteudo: "y".repeat(20) }),
      /Sem permissao/,
    );
  });

  it("valida a entrada antes de gravar", async () => {
    entrarComo(admin);
    await assert.rejects(() => acoes.criar({ titulo: "ab", descricao: "", conteudo: "" }));
  });

  it("nasce como rascunho e fica fora do que o aluno le", async () => {
    entrarComo(admin);
    const criado = await acoes.criar({
      titulo: `Curso ${marca}`,
      descricao: "Descricao com tamanho suficiente para passar.",
      conteudo: "Modulo 1: abertura.\nModulo 2: pratica.",
    });
    cursoId = criado.id;

    assert.equal(criado.publicado, false);
    assert.equal(criado.publicado_em, null);

    const publicos = await acoes.listarPublicados();
    assert.ok(!publicos.some((curso) => curso.id === cursoId), "rascunho vazou para o aluno");

    const trilha = await db.select().from(auditoria).where(eq(auditoria.registro_id, cursoId));
    assert.equal(trilha.length, 1, "criacao sem trilha de auditoria");
  });

  it("publica, e so ai o aluno enxerga", async () => {
    entrarComo(admin);
    const [antes] = await db.select().from(cursos).where(eq(cursos.id, cursoId));

    const depois = await acoes.alternarPublicacao(cursoId, true, antes!.updated_at);
    assert.equal(depois.publicado, true);
    assert.ok(depois.publicado_em instanceof Date);

    const publicos = await acoes.listarPublicados();
    assert.ok(publicos.some((curso) => curso.id === cursoId), "publicado nao chegou ao aluno");
  });

  it("recusa a gravacao que passaria por cima de outra aba", async () => {
    entrarComo(admin);
    // `antes` e o updated_at que a primeira aba leu; a linha ja mudou desde
    // entao, no teste acima. Sem o optimistic locking isto passaria.
    const desatualizado = new Date(2020, 0, 1);
    await assert.rejects(
      () => acoes.alternarPublicacao(cursoId, false, desatualizado),
      /alterado por outra aba/,
    );

    const [linha] = await db.select().from(cursos).where(eq(cursos.id, cursoId));
    assert.equal(linha!.publicado, true, "a recusa nao pode ter mexido na linha");
  });

  it("tira do ar e limpa a data de publicacao", async () => {
    entrarComo(admin);
    const [antes] = await db.select().from(cursos).where(eq(cursos.id, cursoId));

    const depois = await acoes.alternarPublicacao(cursoId, false, antes!.updated_at);
    assert.equal(depois.publicado, false);
    assert.equal(depois.publicado_em, null);
  });
});
