/**
 * Teste de integracao da leitura do relatorio, contra o banco local.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * Cobre o que /relatorio/<token> passa a depender: so assessment concluido
 * rende documento, os dados saem da linha do banco e nao de dado fixo, a
 * narrativa lida e a ultima versao, e narrativa fora de formato nao derruba o
 * relatorio inteiro.
 *
 * Fixtures por INSERT direto, como em avaliacao.test.mts: a leitura do
 * relatorio nao tem sessao nem action de escrita para montar o cenario.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, assessments, assessmentsRelatorios } = await import("@/lib/db/schema");
const acoes = await import("@/lib/actions/relatorio");
const { narrativaExemplo } = await import("@/data/narrativa-exemplo");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";

const DIA = 24 * 60 * 60 * 1000;

let facilitador = "";
let tokenPronto = "";
let tokenSemNarrativa = "";
let tokenPendente = "";
let tokenSemContadores = "";
let idPronto = "";

type Situacao = "pendente" | "em_andamento" | "concluido" | "expirado";

async function inserirAssessment(
  token: string,
  situacao: Situacao,
  contadores: { D: number; I: number; S: number; C: number } | null,
): Promise<string> {
  const [linha] = await db
    .insert(assessments)
    .values({
      token,
      facilitador_id: facilitador,
      avaliado_nome: "Avaliado do Relatorio",
      avaliado_email: `${token}@exemplo.com`,
      tipo_relatorio: "S3",
      situacao,
      creditos_usados: 3,
      expira_em: new Date(Date.now() - DIA),
      concluido_em: situacao === "concluido" ? new Date() : null,
      contador_d: contadores?.D ?? null,
      contador_i: contadores?.I ?? null,
      contador_s: contadores?.S ?? null,
      contador_c: contadores?.C ?? null,
      modified_by: SISTEMA,
    })
    .returning();

  return linha!.id;
}

before(async () => {
  const [dono] = await db
    .insert(usuarios)
    .values({
      nome: "Facilitadora do Relatorio",
      email: `rel.${marca}@exemplo.com`,
      papel: "facilitador",
      empresa: "Consultoria Teste",
      telefone: "+55 (11) 90000-0000",
      creditos: 0,
      modified_by: SISTEMA,
    })
    .returning();

  facilitador = dono!.id;

  tokenPronto = `rp${marca}`;
  tokenSemNarrativa = `rs${marca}`;
  tokenPendente = `rn${marca}`;
  tokenSemContadores = `rc${marca}`;

  // Vencido de proposito: relatorio pronto nao depende do link continuar aberto.
  idPronto = await inserirAssessment(tokenPronto, "concluido", { D: 10, I: 8, S: 6, C: 4 });
  await inserirAssessment(tokenSemNarrativa, "concluido", { D: 4, I: 5, S: 8, C: 11 });
  await inserirAssessment(tokenPendente, "pendente", null);
  // Estado que nao deveria existir: concluido sem os contadores da conclusao.
  await inserirAssessment(tokenSemContadores, "concluido", null);

  await db.insert(assessmentsRelatorios).values([
    {
      assessment_id: idPronto,
      versao: 1,
      narrativa: { ...narrativaExemplo, fraseDoPerfil: "Versao 1, a antiga." },
      modified_by: SISTEMA,
    },
    {
      assessment_id: idPronto,
      versao: 2,
      narrativa: { ...narrativaExemplo, fraseDoPerfil: "Versao 2, a que vale." },
      modified_by: SISTEMA,
    },
  ]);
});

after(async () => {
  // Limpeza de fixture com SQL cru: unico lugar do projeto onde apagar de
  // verdade e o certo.
  const tokens = [tokenPronto, tokenSemNarrativa, tokenPendente, tokenSemContadores];
  const lista = tokens.map((token) => `'${token}'`).join(",");

  await db.execute(
    `delete from assessments_relatorios where assessment_id in (select id from assessments where token in (${lista}))`,
  );
  await db.execute(`delete from assessments where token in (${lista})`);
  await db.execute(`delete from usuarios where id = '${facilitador}'`);
});

describe("relatorio", () => {
  it("nao entrega relatorio de token inexistente", async () => {
    assert.equal(await acoes.carregarRelatorio(`nao-existe-${marca}`), null);
  });

  it("nao entrega relatorio de assessment nao concluido", async () => {
    assert.equal(await acoes.carregarRelatorio(tokenPendente), null);
  });

  it("nao entrega relatorio de concluido sem contadores", async () => {
    // Preferir 404 a um documento com percentuais inventados a partir de zero.
    assert.equal(await acoes.carregarRelatorio(tokenSemContadores), null);
  });

  it("entrega os dados da linha do banco, e nao de dado fixo", async () => {
    const relatorio = await acoes.carregarRelatorio(tokenPronto);
    assert.ok(relatorio);
    assert.equal(relatorio.avaliado.nome, "Avaliado do Relatorio");
    assert.equal(relatorio.avaliado.email, `${tokenPronto}@exemplo.com`);
    assert.equal(relatorio.facilitador.nome, "Facilitadora do Relatorio");
    assert.equal(relatorio.facilitador.empresa, "Consultoria Teste");
    assert.equal(relatorio.facilitador.telefone, "+55 (11) 90000-0000");
    assert.equal(relatorio.tipoRelatorio, "S3");
    assert.deepEqual(relatorio.contadores, { D: 10, I: 8, S: 6, C: 4 });
    assert.ok(relatorio.emitidoEm instanceof Date);
  });

  it("le a ultima versao da narrativa", async () => {
    const relatorio = await acoes.carregarRelatorio(tokenPronto);
    assert.equal(relatorio?.narrativa?.fraseDoPerfil, "Versao 2, a que vale.");
  });

  it("devolve narrativa nula quando a geracao ainda nao rodou", async () => {
    const relatorio = await acoes.carregarRelatorio(tokenSemNarrativa);
    assert.ok(relatorio, "o relatorio existe mesmo sem narrativa gravada");
    assert.equal(relatorio.narrativa, null);
    assert.deepEqual(relatorio.contadores, { D: 4, I: 5, S: 8, C: 11 });
  });

  it("trata narrativa fora do formato como ausente, sem derrubar o relatorio", async () => {
    // Quatro pontos fortes onde o layout espera cinco: e o que uma versao
    // anterior do gerador deixaria gravado.
    const [linha] = await db
      .insert(assessmentsRelatorios)
      .values({
        assessment_id: idPronto,
        versao: 3,
        narrativa: { ...narrativaExemplo, pontosFortes: ["um", "dois", "tres", "quatro"] },
        modified_by: SISTEMA,
      })
      .returning();

    const relatorio = await acoes.carregarRelatorio(tokenPronto);
    assert.ok(relatorio, "o resto do documento continua correto");
    assert.equal(relatorio.narrativa, null);

    await db.execute(`delete from assessments_relatorios where id = '${linha!.id}'`);
  });

  it("ignora relatorio soft-deletado e cai na versao anterior", async () => {
    const [linha] = await db
      .insert(assessmentsRelatorios)
      .values({
        assessment_id: idPronto,
        versao: 4,
        narrativa: { ...narrativaExemplo, fraseDoPerfil: "Versao 4, apagada." },
        modified_by: SISTEMA,
        is_deleted: true,
        deleted_at: new Date(),
      })
      .returning();

    const relatorio = await acoes.carregarRelatorio(tokenPronto);
    assert.equal(relatorio?.narrativa?.fraseDoPerfil, "Versao 2, a que vale.");

    await db.execute(`delete from assessments_relatorios where id = '${linha!.id}'`);
  });
});
