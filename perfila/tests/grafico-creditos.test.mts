/**
 * O agrupamento do grafico de creditos do painel do parceiro.
 *
 *   npm test
 *
 * Puro: nao toca banco nem sessao. O que se prova aqui e o que quebra CALADO
 * num grafico — mes trocado por leitura americana da data, tempo correndo para
 * tras, e as duas series escaladas por reguas diferentes. Nenhum desses erros
 * derruba a tela: ele so desenha a barra errada, e ninguem confere de olho.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

const { agruparCreditos, paraData, rotuloDoPeriodo, tetoDoGrafico } = await import(
  "@/lib/grafico-creditos"
);

/** Como o extrato chega de `lib/painel.ts`: mais novo primeiro, data dd/mm/aaaa. */
const extrato = [
  { data: "10/03/2026", quantidade: -3 },
  { data: "02/03/2026", quantidade: 50 },
  { data: "20/02/2026", quantidade: -7 },
  { data: "05/02/2026", quantidade: 10 },
];

describe("grafico de creditos", () => {
  it("le a data no formato brasileiro, e nao no americano", () => {
    // `new Date("03/04/2026")` daria 4 de marco. Este e o erro que deslocaria o
    // extrato inteiro de mes sem quebrar nada na tela.
    const data = paraData("03/04/2026");
    assert.equal(data.getDate(), 3);
    assert.equal(data.getMonth(), 3, "abril e o mes 3 na contagem do Date");
    assert.equal(data.getFullYear(), 2026);
  });

  it("agrupa por mes somando compra e uso em series separadas", () => {
    const colunas = agruparCreditos(extrato, "Mensal");

    assert.equal(colunas.length, 2);
    // Do mais ANTIGO para o mais novo: o extrato veio ao contrario.
    assert.equal(colunas[0]!.comprados, 10, "fevereiro comprou 10");
    assert.equal(colunas[0]!.utilizados, 7, "fevereiro usou 7, em modulo");
    assert.equal(colunas[1]!.comprados, 50);
    assert.equal(colunas[1]!.utilizados, 3);
  });

  it("devolve as colunas da mais antiga para a mais recente", () => {
    // Sem a inversao o grafico desenha o tempo para tras, e alta le-se queda.
    // Este caso falha se alguem tirar o `.reverse()`.
    const colunas = agruparCreditos(extrato, "Mensal");
    const [primeira, segunda] = colunas.map((coluna) => coluna.rotulo);

    assert.equal(primeira, rotuloDoPeriodo(paraData("05/02/2026"), "Mensal"));
    assert.equal(segunda, rotuloDoPeriodo(paraData("02/03/2026"), "Mensal"));
  });

  it("junta a semana no domingo que a comeca", () => {
    // 04/03/2026 e quarta; 08/03/2026 e domingo. Sao semanas DIFERENTES, e o
    // domingo abre a dele — e o caso que uma conta de "dia - 7" erraria.
    const mesmaSemana = agruparCreditos(
      [
        { data: "06/03/2026", quantidade: 1 },
        { data: "04/03/2026", quantidade: 2 },
      ],
      "Semanal",
    );
    assert.equal(mesmaSemana.length, 1, "quarta e sexta da mesma semana viram uma coluna");

    const semanasVizinhas = agruparCreditos(
      [
        { data: "08/03/2026", quantidade: 1 },
        { data: "06/03/2026", quantidade: 2 },
      ],
      "Semanal",
    );
    assert.equal(semanasVizinhas.length, 2, "o domingo abre a semana seguinte");
  });

  it("corta as colunas mais antigas em vez das mais novas", () => {
    // Treze meses, um movimento em cada. O grafico mensal mostra seis, e tem de
    // ser os SEIS ULTIMOS: cortar do outro lado esconderia justamente o que
    // acabou de acontecer.
    const treze = Array.from({ length: 13 }, (_, i) => ({
      data: `15/${String(12 - i).padStart(2, "0")}/2026`,
      quantidade: 12 - i,
    })).filter((linha) => !linha.data.startsWith("15/00"));

    const colunas = agruparCreditos(treze, "Mensal");
    assert.equal(colunas.length, 6);
    assert.equal(
      colunas.at(-1)!.rotulo,
      rotuloDoPeriodo(paraData("15/12/2026"), "Mensal"),
      "dezembro, o mais recente, tem de sobrar",
    );
  });

  it("escala as duas series pela mesma regua", () => {
    const colunas = agruparCreditos(extrato, "Mensal");
    // 50 e o maior valor de qualquer das duas series. Se o teto saisse por
    // serie, o uso de 7 encostaria no topo do mesmo jeito que a compra de 50.
    assert.equal(tetoDoGrafico(colunas), 50);
  });

  it("nao divide por zero quando nao ha movimento", () => {
    assert.deepEqual(agruparCreditos([], "Mensal"), []);
    assert.equal(tetoDoGrafico([]), 1);
  });
});
