/**
 * Teste de integracao do CRUD de assessments, contra o banco local.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * Cobre o que a regra exige e o que quebra calado se alguem mexer:
 * autenticacao, RBAC por dono, consumo de credito, optimistic locking,
 * soft delete de verdade e trilha de auditoria.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, assessments, creditosTransacoes, auditoria } = await import("@/lib/db/schema");
const acoes = await import("@/lib/actions/assessments");
const { and, eq } = await import("drizzle-orm");

/** Marca as linhas desta rodada, para a limpeza no fim nao levar nada alheio. */
const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";

let facilitadorA = "";
let facilitadorB = "";

function entrarComo(id: string) {
  process.env.SESSAO_DEV_USUARIO_ID = id;
}

before(async () => {
  const [a] = await db
    .insert(usuarios)
    .values({
      nome: "Facilitador A",
      email: `a.${marca}@exemplo.com`,
      papel: "facilitador",
      creditos: 10,
      modified_by: SISTEMA,
    })
    .returning();

  const [b] = await db
    .insert(usuarios)
    .values({
      nome: "Facilitador B",
      email: `b.${marca}@exemplo.com`,
      papel: "facilitador",
      creditos: 0,
      modified_by: SISTEMA,
    })
    .returning();

  facilitadorA = a.id;
  facilitadorB = b.id;
});

after(async () => {
  // Limpeza de fixture, com SQL cru: e o unico lugar do projeto onde apagar
  // de verdade e o certo. A aplicacao nunca faz isso — ver excluir().
  const ids = [facilitadorA, facilitadorB];
  await db.execute(
    `delete from auditoria where user_id in ('${ids.join("','")}')`,
  );
  await db.execute(
    `delete from creditos_transacoes where usuario_id in ('${ids.join("','")}')`,
  );
  await db.execute(
    `delete from assessments where facilitador_id in ('${ids.join("','")}')`,
  );
  await db.execute(`delete from usuarios where id in ('${ids.join("','")}')`);
});

describe("assessments", () => {
  it("recusa quem nao tem sessao", async () => {
    delete process.env.SESSAO_DEV_USUARIO_ID;
    await assert.rejects(() => acoes.listar(), /Nao autenticado/);
  });

  it("valida o e-mail antes de gravar", async () => {
    entrarComo(facilitadorA);
    await assert.rejects(() =>
      acoes.criar({
        avaliado_nome: "Maria Silva",
        avaliado_email: "maria arroba exemplo",
        tipo_relatorio: "S1",
      }),
    );
  });

  it("cria consumindo credito e lancando no extrato", async () => {
    entrarComo(facilitadorA);
    const criado = await acoes.criar({
      avaliado_nome: "Maria Silva",
      avaliado_email: `Maria.${marca}@Exemplo.com`,
      tipo_relatorio: "S2",
    });

    assert.equal(criado.creditos_usados, 2, "S2 custa 2 creditos");
    assert.equal(criado.situacao, "pendente");
    assert.match(criado.token, /^[0-9a-f]{12}$/);
    assert.equal(criado.avaliado_email, `maria.${marca}@exemplo.com`, "e-mail normalizado");

    const [dono] = await db.select().from(usuarios).where(eq(usuarios.id, facilitadorA));
    assert.equal(dono.creditos, 8, "10 - 2");

    const extrato = await db
      .select()
      .from(creditosTransacoes)
      .where(eq(creditosTransacoes.assessment_id, criado.id));
    assert.equal(extrato.length, 1);
    assert.equal(extrato[0].quantidade, -2);

    const trilha = await db
      .select()
      .from(auditoria)
      .where(and(eq(auditoria.registro_id, criado.id), eq(auditoria.acao, "criar")));
    assert.equal(trilha.length, 1, "criacao gravada na auditoria");
  });

  it("recusa criacao sem saldo", async () => {
    entrarComo(facilitadorB);
    await assert.rejects(
      () =>
        acoes.criar({
          avaliado_nome: "Joao Souza",
          avaliado_email: `joao.${marca}@exemplo.com`,
          tipo_relatorio: "S1",
        }),
      /Saldo insuficiente/,
    );
  });

  it("nao mostra a um facilitador o assessment de outro", async () => {
    entrarComo(facilitadorB);
    const lista = await acoes.listar();
    assert.equal(
      lista.some((a) => a.facilitador_id === facilitadorA),
      false,
    );
  });

  it("rejeita gravacao com updated_at velho (colisao)", async () => {
    entrarComo(facilitadorA);
    const [alvo] = await acoes.listar();
    const velho = new Date(alvo.updated_at.getTime() - 1000);

    await assert.rejects(
      () =>
        acoes.atualizar(alvo.id, { avaliado_nome: "Maria S Silva", avaliado_email: alvo.avaliado_email }, velho),
      /alterado por outro usuario/,
    );
  });

  it("atualiza quando o updated_at confere", async () => {
    entrarComo(facilitadorA);
    const [alvo] = await acoes.listar();
    const atualizado = await acoes.atualizar(
      alvo.id,
      { avaliado_nome: "Maria S Silva", avaliado_email: alvo.avaliado_email },
      alvo.updated_at,
    );
    assert.equal(atualizado.avaliado_nome, "Maria S Silva");
  });

  it("exclui de forma logica: a linha continua no banco", async () => {
    entrarComo(facilitadorA);
    const [alvo] = await acoes.listar();
    await acoes.excluir(alvo.id);

    const [linha] = await db.select().from(assessments).where(eq(assessments.id, alvo.id));
    assert.ok(linha, "a linha nao pode sumir do banco");
    assert.equal(linha.is_deleted, true);
    assert.ok(linha.deleted_at instanceof Date);

    const lista = await acoes.listar();
    assert.equal(
      lista.some((a) => a.id === alvo.id),
      false,
      "some da listagem",
    );
  });
});
