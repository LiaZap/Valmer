/**
 * Teste de integracao da camada de leitura das telas de gestao.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * Cobre as duas regras que as telas de /admin e /facilitador dependem e que
 * quebram caladas: o recorte por dono (o facilitador nao pode ver o assessment
 * de outro) e a expiracao derivada de `expira_em`, com concluido tendo
 * precedencia sobre vencido.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, assessments } = await import("@/lib/db/schema");
const painel = await import("@/lib/painel");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";

const DIA = 24 * 60 * 60 * 1000;
const ONTEM = new Date(Date.now() - DIA);
const AMANHA = new Date(Date.now() + DIA);

let facilitadorA = "";
let facilitadorB = "";
let admin = "";

/** Ids dos assessments criados aqui, na ordem em que sao inseridos. */
let vencido = "";
let noPrazo = "";
let concluidoVencido = "";
let deOutroDono = "";

function entrarComo(id: string) {
  process.env.SESSAO_DEV_USUARIO_ID = id;
}

async function criarUsuario(nome: string, papel: "admin" | "facilitador") {
  const [linha] = await db
    .insert(usuarios)
    .values({
      nome,
      email: `${nome.toLowerCase().replace(/\s/g, ".")}.${marca}@exemplo.com`,
      papel,
      creditos: 10,
      modified_by: SISTEMA,
    })
    .returning();
  return linha.id;
}

async function criarAssessment(dono: string, situacao: "pendente" | "concluido", expira: Date) {
  const [linha] = await db
    .insert(assessments)
    .values({
      token: `${marca}-${Math.random().toString(36).slice(2, 10)}`,
      facilitador_id: dono,
      avaliado_nome: "Avaliado de Teste",
      avaliado_email: `avaliado.${marca}@exemplo.com`,
      tipo_relatorio: "S1",
      situacao,
      creditos_usados: 1,
      expira_em: expira,
      concluido_em: situacao === "concluido" ? expira : null,
      modified_by: SISTEMA,
    })
    .returning();
  return linha.id;
}

before(async () => {
  facilitadorA = await criarUsuario("Facilitador Painel A", "facilitador");
  facilitadorB = await criarUsuario("Facilitador Painel B", "facilitador");
  admin = await criarUsuario("Admin Painel", "admin");

  vencido = await criarAssessment(facilitadorA, "pendente", ONTEM);
  noPrazo = await criarAssessment(facilitadorA, "pendente", AMANHA);
  concluidoVencido = await criarAssessment(facilitadorA, "concluido", ONTEM);
  deOutroDono = await criarAssessment(facilitadorB, "pendente", AMANHA);
});

after(async () => {
  // Limpeza de fixture, com SQL cru: e o unico lugar do projeto onde apagar
  // de verdade e o certo. A aplicacao nunca faz isso.
  const ids = [facilitadorA, facilitadorB, admin];
  await db.execute(`delete from assessments where facilitador_id in ('${ids.join("','")}')`);
  await db.execute(`delete from usuarios where id in ('${ids.join("','")}')`);
  delete process.env.SESSAO_DEV_USUARIO_ID;
});

describe("painel", () => {
  it("recusa quem nao tem sessao", async () => {
    delete process.env.SESSAO_DEV_USUARIO_ID;
    await assert.rejects(() => painel.assessmentsVisiveis(), /Nao autenticado/);
    await assert.rejects(() => painel.contaAtual(), /Nao autenticado/);
  });

  it("facilitador nao ve o assessment de outro facilitador", async () => {
    entrarComo(facilitadorA);
    const ids = (await painel.assessmentsVisiveis()).map((item) => item.id);

    assert.ok(ids.includes(noPrazo), "deveria ver o proprio");
    assert.ok(!ids.includes(deOutroDono), "nao pode ver o de outro dono");
  });

  it("admin ve os assessments de todos os parceiros", async () => {
    entrarComo(admin);
    const ids = (await painel.assessmentsVisiveis()).map((item) => item.id);

    assert.ok(ids.includes(noPrazo));
    assert.ok(ids.includes(deOutroDono));
  });

  it("passou de expira_em sem conclusao aparece como expirado", async () => {
    entrarComo(facilitadorA);
    const itens = await painel.assessmentsVisiveis();

    assert.equal(itens.find((item) => item.id === vencido)?.situacao, "expirado");
    assert.equal(itens.find((item) => item.id === noPrazo)?.situacao, "pendente");
  });

  it("concluido tem precedencia sobre a data vencida", async () => {
    entrarComo(facilitadorA);
    const itens = await painel.assessmentsVisiveis();

    // Quem respondeu dentro do prazo nao pode virar "expirado" no dia
    // seguinte: o relatorio existe e a tela precisa continuar oferecendo.
    assert.equal(itens.find((item) => item.id === concluidoVencido)?.situacao, "concluido");
  });

  it("listarFacilitadores e listarTransacoes sao so do admin", async () => {
    entrarComo(facilitadorA);
    await assert.rejects(() => painel.listarFacilitadores(), /Sem permissao/);
    await assert.rejects(() => painel.listarTransacoes(), /Sem permissao/);

    entrarComo(admin);
    const parceiros = await painel.listarFacilitadores();
    assert.ok(parceiros.some((item) => item.id === facilitadorA));
    assert.ok(!parceiros.some((item) => item.id === admin), "admin nao e parceiro");
  });

  it("contaAtual devolve o saldo de quem esta logado", async () => {
    entrarComo(facilitadorB);
    const conta = await painel.contaAtual();

    assert.equal(conta.id, facilitadorB);
    assert.equal(conta.creditos, 10);
  });

  it("empresasPorId resolve os nomes numa consulta so", async () => {
    entrarComo(admin);
    const nomes = await painel.empresasPorId([facilitadorA, facilitadorB]);

    assert.equal(Object.keys(nomes).length, 2);
    assert.ok(nomes[facilitadorA]);
    assert.deepEqual(await painel.empresasPorId([]), {});
  });
});
