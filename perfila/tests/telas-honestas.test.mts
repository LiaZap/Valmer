/**
 * Teste das tres promessas que a tela faz e o servidor nao cumpre.
 *
 *   node --import tsx --test tests/telas-honestas.test.mts
 *
 * Nao toca no banco: o que se verifica aqui e o TEXTO-FONTE das telas, porque
 * e ele que mente. Sao regressoes que nenhum teste de action pega — o codigo
 * do servidor continua certo enquanto a tela anuncia o contrario.
 *
 * 1. Atalho publico. `demo` e o token de um mapa REAL e pendente do seed, e o
 *    token e a unica credencial do assessment. Um link para /avaliacao na tela
 *    de login, que roda sem sessao, entrega esse mapa a qualquer visitante.
 * 2. Selo de sucesso em recusa. Enquanto o toast so sabia desenhar check, toda
 *    recusa de regra saia com cara de gravacao feita.
 * 3. Botao que depende de e-mail. Nao existe provedor contratado, entao o
 *    aviso precisa mandar a pessoa pelo caminho manual em vez de encerrar o
 *    assunto com um check.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function arquivosDe(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) return arquivosDe(caminho);
    return /\.tsx?$/.test(entrada.name) ? [caminho] : [];
  });
}

/** Uma chamada `toast(...)` inteira, incluindo as que ocupam varias linhas. */
const CHAMADAS_TOAST = /toast\((?:[^()]|\([^()]*\))*\)/gs;

/** Vocabulario de recusa: nada disso pode sair com o selo de sucesso. */
const RECUSA = /ainda n[ãa]o|N[ãa]o foi poss[íi]vel|resposta\.erro|n[ãa]o s[ãa]o salvas|n[ãa]o grava/;

const fontes = arquivosDe("src").map((caminho) => ({
  caminho,
  texto: readFileSync(caminho, "utf8"),
}));

describe("telas honestas", () => {
  it("a tela de login nao oferece assessment de ninguem", () => {
    const login = readFileSync(join("src", "app", "page.tsx"), "utf8");
    // Procura o caminho entre aspas, nao solto no texto: e assim que ele vira
    // href, e assim o comentario que explica a remocao pode cita-lo.
    assert.ok(
      !/['"`]\/avaliacao/.test(login),
      "a tela de login roda sem sessao: qualquer link para /avaliacao entrega o mapa de uma pessoa real a quem passar por ali",
    );
  });

  it("toda recusa sai no tom de aviso", () => {
    const mentirosos = fontes.flatMap(({ caminho, texto }) =>
      (texto.match(CHAMADAS_TOAST) ?? [])
        .filter((chamada) => RECUSA.test(chamada) && !chamada.includes("'aviso'"))
        .map((chamada) => `${caminho}: ${chamada.replace(/\s+/g, " ").slice(0, 80)}`),
    );
    assert.deepEqual(mentirosos, [], "recusa com selo de sucesso");
  });

  it("botao de e-mail manda a pessoa pelo caminho manual", () => {
    const comEnvelope = fontes.filter(({ texto }) => /icon="mail"/.test(texto));
    assert.ok(comEnvelope.length > 0, "nenhum botao de envelope encontrado — o teste perdeu o alvo");

    for (const { caminho, texto } of comEnvelope) {
      const avisos = (texto.match(CHAMADAS_TOAST) ?? []).filter((chamada) =>
        /provedor de e-mail/.test(chamada),
      );
      assert.ok(
        avisos.length > 0,
        `${caminho} tem botao de envelope sem aviso dizendo que o provedor de e-mail nao existe`,
      );
      for (const aviso of avisos) {
        assert.ok(aviso.includes("'aviso'"), `${caminho}: aviso de e-mail com selo de sucesso`);
      }
    }
  });
});
