/**
 * Regras do programa de beneficios.
 *
 * Modulo puro, entao este arquivo nao encosta no banco: roda com `npm test`
 * como os outros, mas nao precisa do Postgres de pe.
 *
 * Cobre as duas decisoes que valem desconto para o parceiro — em que janela os
 * creditos contam, e qual faixa isso alcanca — mais a coerencia entre a regra
 * escrita na tela e o numero que decide de fato.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { cicloDe, categoriaAtingida, faltamPara, metaDaBarra } = await import("@/lib/beneficios");
const { categorias } = await import("@/data/beneficios");

/** Data em UTC, para o teste nao depender do fuso da maquina que roda. */
const em = (iso: string) => new Date(`${iso}T12:00:00.000Z`);

describe("ciclo do parceiro", () => {
  it("comeca no cadastro enquanto o primeiro ano nao fecha", () => {
    const ciclo = cicloDe(em("2026-03-18"), em("2026-09-03"));

    assert.equal(ciclo.inicio.toISOString().slice(0, 10), "2026-03-18");
    assert.equal(ciclo.fim.toISOString().slice(0, 10), "2027-03-18");
  });

  it("vira no aniversario da conta, e nao no primeiro de janeiro", () => {
    // Um dia antes do aniversario ainda e o ciclo velho...
    const antes = cicloDe(em("2026-03-18"), em("2027-03-17"));
    assert.equal(antes.inicio.toISOString().slice(0, 10), "2026-03-18");

    // ...e no dia seguinte ja e o novo. E aqui que os contadores zeram.
    const depois = cicloDe(em("2026-03-18"), em("2027-03-19"));
    assert.equal(depois.inicio.toISOString().slice(0, 10), "2027-03-18");
    assert.equal(depois.fim.toISOString().slice(0, 10), "2028-03-18");
  });

  it("cada parceiro tem o proprio ciclo", () => {
    const agora = em("2026-09-03");
    const juliana = cicloDe(em("2026-03-18"), agora);
    const marcos = cicloDe(em("2026-05-02"), agora);

    assert.notEqual(
      juliana.inicio.toISOString(),
      marcos.inicio.toISOString(),
      "ciclo ancorado no cadastro de cada um",
    );
  });

  it("aguenta varios anos de conta sem escorregar de janela", () => {
    const ciclo = cicloDe(em("2020-05-02"), em("2026-09-03"));

    assert.equal(ciclo.inicio.toISOString().slice(0, 10), "2026-05-02");
    assert.equal(ciclo.fim.toISOString().slice(0, 10), "2027-05-02");
  });

  it("conta recem-criada nao cai em ciclo negativo", () => {
    const ciclo = cicloDe(em("2026-09-03"), em("2026-09-03"));

    assert.equal(ciclo.inicio.toISOString().slice(0, 10), "2026-09-03");
    assert.ok(ciclo.fim > ciclo.inicio);
  });
});

describe("categoria alcancada", () => {
  it("quem nao movimentou nada fica na primeira faixa", () => {
    const { atual, proxima } = categoriaAtingida(0, 0);

    assert.equal(atual.name, "Membro");
    assert.equal(proxima?.name, "Gold");
  });

  it("basta bater UM dos dois criterios", () => {
    // A regra do Gold e "120 comprados OU 80 utilizados".
    assert.equal(categoriaAtingida(120, 0).atual.name, "Gold");
    assert.equal(categoriaAtingida(0, 80).atual.name, "Gold");
    assert.equal(categoriaAtingida(119, 79).atual.name, "Membro", "um a menos nao basta");
  });

  it("nao para na primeira faixa que couber, vai ate a mais alta", () => {
    // Quem comprou 800 satisfaz Gold e Platinum tambem; a resposta e Diamond.
    assert.equal(categoriaAtingida(800, 0).atual.name, "Diamond");
    assert.equal(categoriaAtingida(2000, 0).atual.name, "Black");
  });

  it("no topo nao ha proxima faixa nem quanto falta", () => {
    const { atual, proxima } = categoriaAtingida(2000, 2000);

    assert.equal(atual.name, "Black");
    assert.equal(proxima, null);
    assert.deepEqual(faltamPara(proxima, 2000, 2000), { comprados: 0, utilizados: 0 });
  });

  it("quanto falta nunca e negativo", () => {
    const { proxima } = categoriaAtingida(0, 100);
    // 100 utilizados ja passou dos 80 do Gold, mas nao dos 300 comprados
    // do Platinum: o que falta de utilizados para Platinum e 50, e o que
    // falta de comprados nao pode virar numero negativo na tela.
    const faltam = faltamPara(proxima, 0, 100);

    assert.ok(faltam.comprados >= 0);
    assert.ok(faltam.utilizados >= 0);
  });

  it("a barra tem meta da proxima faixa, e no topo fecha em 100%", () => {
    const membro = categoriaAtingida(0, 0);
    assert.equal(metaDaBarra(membro.atual, membro.proxima).utilizados, 80);

    const black = categoriaAtingida(2000, 2000);
    const meta = metaDaBarra(black.atual, black.proxima);
    assert.equal(meta.utilizados, 1200, "meta vira o proprio limite, barra cheia");
    assert.ok(meta.comprados > 0, "nunca zero: seria divisao por zero na tela");
  });
});

describe("regua do programa", () => {
  it("o texto da regra e o limite que decide contam a mesma coisa", () => {
    // O `rule` e o que o parceiro le; o `limite` e o que concede o beneficio.
    // Mudar um sem o outro faria a tela prometer uma regra e o sistema aplicar
    // outra — e ninguem descobriria ate alguem reclamar de desconto negado.
    for (const categoria of categorias) {
      const numeros = categoria.rule.match(/\d+/g) ?? [];

      assert.equal(numeros.length, 2, `regra de ${categoria.name} deve citar dois numeros`);
      assert.equal(Number(numeros[0]), categoria.limite.comprados, `comprados de ${categoria.name}`);
      assert.equal(Number(numeros[1]), categoria.limite.utilizados, `utilizados de ${categoria.name}`);
    }
  });

  it("as faixas sobem, nunca descem", () => {
    // `categoriaAtingida` percorre de cima para baixo e para na primeira que
    // couber. Se a lista sair de ordem, ela passa a devolver faixa errada sem
    // erro nenhum.
    for (let i = 1; i < categorias.length; i += 1) {
      assert.ok(
        categorias[i]!.limite.comprados > categorias[i - 1]!.limite.comprados &&
          categorias[i]!.limite.utilizados > categorias[i - 1]!.limite.utilizados,
        `${categorias[i]!.name} deve exigir mais que ${categorias[i - 1]!.name}`,
      );
    }
  });
});
