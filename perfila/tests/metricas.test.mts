/**
 * Indicadores do painel do dono da plataforma.
 *
 * Modulo puro, entao este arquivo nao encosta no banco: roda com `npm test`
 * como os outros, mas nao precisa do Postgres de pe.
 *
 * Cobre as duas formas independentes pelas quais o painel mentia: somar como
 * venda o credito que o proprio dono lancou para si (populacao diferente da que
 * o cartao ao lado usava) e recalcular a receita do passado com o preco de hoje.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { metricasPlataforma } = await import("@/lib/metricas");

type Dados = Parameters<typeof metricasPlataforma>[0];

const parceiro = (id: string, creditos: number): Dados["facilitadores"][number] => ({
  id,
  nome: id,
  email: `${id}@exemplo.com`,
  empresa: "",
  telefone: "",
  creditos,
  ativo: true,
  criadoEm: "01/01/2026",
  iniciais: "XX",
});

const movimento = (
  facilitadorId: string,
  tipo: Dados["transacoes"][number]["tipo"],
  quantidade: number,
  valorCobrado: number | null = null,
): Dados["transacoes"][number] => ({
  id: `${facilitadorId}-${tipo}-${quantidade}-${valorCobrado}`,
  facilitadorId,
  tipo,
  quantidade,
  valorCobrado,
  descricao: "",
  data: "01/01/2026",
});

/** O `facilitadores` do painel ja chega recortado a papel='facilitador'. */
function metricas(transacoes: Dados["transacoes"], facilitadores = [parceiro("juliana", 0)]) {
  return metricasPlataforma({ facilitadores, assessments: [], transacoes });
}

describe("populacao dos indicadores de venda", () => {
  it("credito que o dono lancou para si nao e venda", () => {
    // O dono da plataforma tem papel='admin', entao ele nao esta na lista de
    // parceiros — e era isso que fazia "vendidos" e "em carteira" contarem
    // gente diferente no mesmo cartao.
    const m = metricas([
      movimento("juliana", "compra", 50, 990),
      movimento("valmer-admin", "compra", 100, 1790),
      movimento("valmer-admin", "compra", 100, 1790),
    ]);

    assert.equal(m.creditosVendidos, 50, "so o que foi vendido a parceiro");
    assert.equal(m.receita, 990, "as duas compras do proprio dono ficam de fora");
  });

  it("o consumo segue a mesma populacao da venda", () => {
    // Senao a barra "consumidos sobre vendidos" divide numeros de duas
    // populacoes e passa de 100% sem ninguem ter gastado a mais.
    const m = metricas([
      movimento("juliana", "compra", 50, 990),
      movimento("juliana", "uso", -10),
      movimento("valmer-admin", "uso", -40),
    ]);

    assert.equal(m.creditosUsados, 10);
    assert.equal(m.creditosVendidos, 50);
  });

  it("bonus nao e receita nem venda", () => {
    const m = metricas([movimento("juliana", "bonus", 5)]);

    assert.equal(m.creditosVendidos, 0);
    assert.equal(m.receita, 0);
    assert.equal(m.comprasSemValor, 0, "bonus nunca cobrou nada; nao ha valor faltando");
  });
});

describe("receita", () => {
  it("e o que foi cobrado, e nao o preco vigente da mesma quantidade", () => {
    // Duas compras do mesmo tamanho por precos diferentes: a soma so pode dar
    // 2280 se cada linha carregar o proprio valor. Casando pela quantidade
    // contra um pacote unico, as duas valeriam o mesmo numero.
    const m = metricas([
      movimento("juliana", "compra", 50, 990),
      movimento("juliana", "compra", 50, 1290),
    ]);

    assert.equal(m.receita, 2280);
    assert.equal(m.creditosVendidos, 100);
  });

  it("compra antiga sem valor gravado conta no credito e fica fora da receita, declarada", () => {
    const m = metricas([
      movimento("juliana", "compra", 50, 990),
      movimento("juliana", "compra", 10),
    ]);

    assert.equal(m.creditosVendidos, 60, "o credito foi entregue de qualquer forma");
    assert.equal(m.receita, 990, "nenhum preco e arbitrado para a linha sem valor");
    assert.equal(m.comprasSemValor, 1, "a tela precisa poder dizer o que ficou de fora");
  });
});
