/**
 * Teste da geracao em lote, contra o banco local.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * Cobre as duas coisas que quebram um lote de 700 e so aparecem no fim: o teto
 * de concorrencia (sem ele o lote dispara tudo de uma vez e bate no rate limit
 * da API) e a retomada (sem ela uma segunda rodada paga de novo por narrativa
 * que ja esta gravada).
 *
 * Nao chama a API e nao sobe o Chrome. A retomada e verificada com a chave
 * apagada do ambiente: se `gerarESalvar` deixar de reaproveitar o que ja
 * existe, ela cai em `gerarNarrativa`, que recusa sem chave, e o teste falha
 * em vez de gastar dinheiro.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

// Antes de qualquer import que leve ate gerar.ts. Ver o cabecalho acima.
delete process.env.ANTHROPIC_API_KEY;

const { db } = await import("@/lib/db");
const { usuarios, assessments } = await import("@/lib/db/schema");
const { emLote, tokensDoTexto } = await import("@/lib/relatorio/lote");
const { salvarNarrativa, gerarESalvar } = await import("@/lib/relatorio/persistir");
const { narrativaExemplo } = await import("@/data/narrativa-exemplo");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";
const DIA = 24 * 60 * 60 * 1000;

let facilitador = "";
let tokenPronto = "";
let tokenPendente = "";

before(async () => {
  const [dono] = await db
    .insert(usuarios)
    .values({
      nome: "Facilitador do Lote",
      email: `lote.${marca}@exemplo.com`,
      papel: "facilitador",
      creditos: 0,
      modified_by: SISTEMA,
    })
    .returning();

  facilitador = dono!.id;
  tokenPronto = `lp${marca}`;
  tokenPendente = `lx${marca}`;

  await db.insert(assessments).values([
    {
      token: tokenPronto,
      facilitador_id: facilitador,
      avaliado_nome: "Avaliado do Lote",
      avaliado_email: `${tokenPronto}@exemplo.com`,
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
    },
    {
      token: tokenPendente,
      facilitador_id: facilitador,
      avaliado_nome: "Ainda Respondendo",
      avaliado_email: `${tokenPendente}@exemplo.com`,
      tipo_relatorio: "S1",
      situacao: "pendente",
      creditos_usados: 1,
      expira_em: new Date(Date.now() + 7 * DIA),
      modified_by: SISTEMA,
    },
  ]);

  // A narrativa que a retomada tem que reaproveitar.
  const gravada = await salvarNarrativa(tokenPronto, narrativaExemplo);
  assert.ok(gravada.ok, "a fixture precisa de narrativa gravada");
});

after(async () => {
  const lista = [tokenPronto, tokenPendente].map((token) => `'${token}'`).join(",");

  await db.execute(
    `delete from assessments_relatorios where assessment_id in (select id from assessments where token in (${lista}))`,
  );
  await db.execute(
    `delete from auditoria where registro_id in (select id from assessments where token in (${lista}))`,
  );
  await db.execute(`delete from assessments where token in (${lista})`);
  await db.execute(`delete from usuarios where id = '${facilitador}'`);
});

describe("lote", () => {
  it("le a lista de tokens ignorando linha vazia, comentario e repetido", () => {
    const texto = "  aaa \n\n# so comentario\nbbb # sobra do fim\naaa\r\n";
    assert.deepEqual(tokensDoTexto(texto), ["aaa", "bbb"]);
  });

  it("nunca passa do teto de concorrencia e devolve na ordem da entrada", async () => {
    const itens = Array.from({ length: 20 }, (_, i) => i);
    let emVoo = 0;
    let pico = 0;

    const resultados = await emLote(itens, 3, async (item) => {
      pico = Math.max(pico, ++emVoo);
      await new Promise((resolve) => setTimeout(resolve, 5));
      emVoo--;
      return item * 2;
    });

    assert.equal(pico, 3, `o teto de 3 foi rompido (chegou a ${pico})`);
    assert.deepEqual(
      resultados.map((r) => (r.ok ? r.valor : null)),
      itens.map((i) => i * 2),
    );
  });

  it("uma falha nao derruba o resto do lote e sai identificada", async () => {
    const resultados = await emLote(["a", "quebra", "c"], 2, async (item) => {
      if (item === "quebra") throw new Error("estourou");
      return item.toUpperCase();
    });

    assert.deepEqual(resultados[0], { item: "a", ok: true, valor: "A" });
    assert.deepEqual(resultados[1], { item: "quebra", ok: false, erro: "estourou" });
    assert.deepEqual(resultados[2], { item: "c", ok: true, valor: "C" });
  });

  it("retoma: quem ja tem narrativa nao volta a API, e o invalido so falha sozinho", async () => {
    const tokens = [tokenPronto, tokenPendente, `nao-existe-${marca}`];

    const resultados = await emLote(tokens, 2, async (token) => {
      const gravada = await gerarESalvar(token);
      if (!gravada.ok) throw new Error(gravada.erro);
      return gravada;
    });

    const pronto = resultados[0];
    assert.ok(pronto.ok, pronto.ok ? "" : `deveria reaproveitar: ${pronto.erro}`);
    assert.equal(pronto.valor.reaproveitada, true, "a retomada nao pode gerar de novo");
    assert.equal(pronto.valor.versao, 1);

    assert.deepEqual(
      resultados.slice(1).map((r) => (r.ok ? "ok" : r.erro)),
      ["nao_concluido", "invalido"],
    );
  });
});
