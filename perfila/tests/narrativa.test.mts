/**
 * Teste de integracao da gravacao da narrativa, contra o banco local.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * Cobre a persistencia, e nao a chamada da API: `salvarNarrativa` recebe o texto
 * pronto, entao a suite roda sem chave e sem gastar dinheiro. O que se verifica
 * aqui e o versionamento — a parte que corrompe historico quando erra.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, assessments, assessmentsRelatorios } = await import("@/lib/db/schema");
const { salvarNarrativa } = await import("@/lib/relatorio/persistir");
const { carregarRelatorio } = await import("@/lib/actions/relatorio");
const { narrativaExemplo } = await import("@/data/narrativa-exemplo");
const { eq } = await import("drizzle-orm");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";
const DIA = 24 * 60 * 60 * 1000;

let facilitador = "";
let tokenConcluido = "";
let tokenPendente = "";
let idConcluido = "";

function narrativaCom(frase: string) {
  return { ...narrativaExemplo, fraseDoPerfil: frase };
}

before(async () => {
  const [dono] = await db
    .insert(usuarios)
    .values({
      nome: "Facilitador da Narrativa",
      email: `nar.${marca}@exemplo.com`,
      papel: "facilitador",
      creditos: 0,
      modified_by: SISTEMA,
    })
    .returning();

  facilitador = dono!.id;
  tokenConcluido = `nc${marca}`;
  tokenPendente = `np${marca}`;

  const [concluido] = await db
    .insert(assessments)
    .values({
      token: tokenConcluido,
      facilitador_id: facilitador,
      avaliado_nome: "Avaliado da Narrativa",
      avaliado_email: `${tokenConcluido}@exemplo.com`,
      tipo_relatorio: "S2",
      situacao: "concluido",
      creditos_usados: 2,
      expira_em: new Date(Date.now() - DIA),
      concluido_em: new Date(),
      contador_d: 10,
      contador_i: 8,
      contador_s: 6,
      contador_c: 4,
      modified_by: SISTEMA,
    })
    .returning();

  idConcluido = concluido!.id;

  await db.insert(assessments).values({
    token: tokenPendente,
    facilitador_id: facilitador,
    avaliado_nome: "Ainda Respondendo",
    avaliado_email: `${tokenPendente}@exemplo.com`,
    tipo_relatorio: "S1",
    situacao: "pendente",
    creditos_usados: 1,
    expira_em: new Date(Date.now() + 7 * DIA),
    modified_by: SISTEMA,
  });
});

after(async () => {
  const lista = [tokenConcluido, tokenPendente].map((token) => `'${token}'`).join(",");

  await db.execute(
    `delete from assessments_relatorios where assessment_id in (select id from assessments where token in (${lista}))`,
  );
  await db.execute(
    `delete from auditoria where registro_id in (select id from assessments where token in (${lista}))`,
  );
  await db.execute(`delete from assessments where token in (${lista})`);
  await db.execute(`delete from usuarios where id = '${facilitador}'`);
});

describe("narrativa", () => {
  it("recusa token inexistente e assessment nao concluido", async () => {
    assert.deepEqual(await salvarNarrativa(`nao-existe-${marca}`, narrativaExemplo), {
      ok: false,
      erro: "invalido",
    });
    assert.deepEqual(await salvarNarrativa(tokenPendente, narrativaExemplo), {
      ok: false,
      erro: "nao_concluido",
    });
  });

  it("grava a primeira narrativa como v1", async () => {
    const gravada = await salvarNarrativa(tokenConcluido, narrativaCom("Primeira."));
    assert.equal(gravada.ok && gravada.versao, 1);
  });

  it("a segunda gravacao vira v2 e nao apaga a v1", async () => {
    const gravada = await salvarNarrativa(tokenConcluido, narrativaCom("Segunda."));
    assert.equal(gravada.ok && gravada.versao, 2);

    const linhas = await db
      .select()
      .from(assessmentsRelatorios)
      .where(eq(assessmentsRelatorios.assessment_id, idConcluido));
    assert.equal(linhas.length, 2, "o historico continua completo");
  });

  it("o relatorio passa a mostrar a versao mais nova", async () => {
    const relatorio = await carregarRelatorio(tokenConcluido);
    assert.equal(relatorio?.narrativa?.fraseDoPerfil, "Segunda.");
  });

  it("nao reaproveita o numero de uma versao apagada", async () => {
    // Apagar a v2 e gravar de novo nao pode produzir uma segunda linha "v2":
    // duas linhas responderiam por "a v2 deste relatorio" na auditoria.
    await db
      .update(assessmentsRelatorios)
      .set({ is_deleted: true, deleted_at: new Date() })
      .where(eq(assessmentsRelatorios.versao, 2));

    const gravada = await salvarNarrativa(tokenConcluido, narrativaCom("Terceira."));
    assert.equal(gravada.ok && gravada.versao, 3);
  });

  it("gravacoes simultaneas nao colidem na mesma versao", async () => {
    const [a, b] = await Promise.all([
      salvarNarrativa(tokenConcluido, narrativaCom("Corrida A.")),
      salvarNarrativa(tokenConcluido, narrativaCom("Corrida B.")),
    ]);

    assert.ok(a.ok && b.ok);
    assert.notEqual(a.versao, b.versao, "o lock serializa as duas");
    assert.deepEqual([a.versao, b.versao].sort(), [4, 5]);
  });
});
