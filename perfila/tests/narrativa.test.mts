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
const { narrativaExemplo, narrativaParaExibir } = await import("@/data/narrativa-exemplo");
const { gerarRelatorio } = await import("@/lib/actions/relatorio");
const { eq } = await import("drizzle-orm");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";
const DIA = 24 * 60 * 60 * 1000;

let facilitador = "";
let outroFacilitador = "";
let tokenConcluido = "";
let tokenPendente = "";
/** Concluido e SEM narrativa: e este que a pagina do relatorio nao pode preencher. */
let tokenSemTexto = "";
let idConcluido = "";
let idSemTexto = "";

function entrarComo(id: string) {
  process.env.SESSAO_DEV_USUARIO_ID = id;
}

/**
 * As palavras distintivas do texto de exemplo.
 *
 * So os VALORES, e nao as chaves do objeto: o que nao pode vazar e o texto.
 * Corte em seis letras para nao comparar "de", "que" e "para", que existem em
 * qualquer frase em portugues. O que sobra e vocabulario do texto escrito para
 * OUTRA pessoa: e a presenca de qualquer uma delas no relatorio de quem nao
 * tem narrativa que este teste existe para pegar.
 */
const PALAVRAS_DO_EXEMPLO = [
  ...new Set(
    Object.values(narrativaExemplo)
      .flat()
      .join(" ")
      .toLowerCase()
      .split(/[^a-zà-ú]+/)
      .filter((palavra) => palavra.length >= 6),
  ),
];

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

  const [outro] = await db
    .insert(usuarios)
    .values({
      nome: "Facilitador de Outro Parceiro",
      email: `outro.${marca}@exemplo.com`,
      papel: "facilitador",
      creditos: 0,
      modified_by: SISTEMA,
    })
    .returning();

  outroFacilitador = outro!.id;
  tokenConcluido = `nc${marca}`;
  tokenPendente = `np${marca}`;
  tokenSemTexto = `ns${marca}`;

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

  const [semTexto] = await db
    .insert(assessments)
    .values({
      token: tokenSemTexto,
      facilitador_id: facilitador,
      // Nome sem nenhuma palavra do texto de exemplo: se o relatorio devolver
      // vocabulario do exemplo, veio do fallback e nao daqui.
      avaliado_nome: "Zilda Kruger",
      avaliado_email: `${tokenSemTexto}@exemplo.com`,
      tipo_relatorio: "S4",
      situacao: "concluido",
      creditos_usados: 4,
      expira_em: new Date(Date.now() - DIA),
      concluido_em: new Date(),
      contador_d: 4,
      contador_i: 6,
      contador_s: 10,
      contador_c: 8,
      modified_by: SISTEMA,
    })
    .returning();

  idSemTexto = semTexto!.id;

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
  const lista = [tokenConcluido, tokenPendente, tokenSemTexto]
    .map((token) => `'${token}'`)
    .join(",");

  await db.execute(
    `delete from assessments_relatorios where assessment_id in (select id from assessments where token in (${lista}))`,
  );
  await db.execute(
    `delete from auditoria where registro_id in (select id from assessments where token in (${lista}))`,
  );
  await db.execute(`delete from assessments where token in (${lista})`);
  await db.execute(
    `delete from usuarios where id in ('${facilitador}','${outroFacilitador}')`,
  );
  delete process.env.SESSAO_DEV_USUARIO_ID;
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

  /**
   * O defeito mais grave que este arquivo cobre.
   *
   * Antes, um mapa concluido sem narrativa caia na narrativa de exemplo, que
   * comeca chamando o leitor de "Paulo" e descreve o perfil do Paulo. Todo
   * avaliado sem geracao recebia o texto de outra pessoa, no unico documento
   * que sai da plataforma.
   *
   * O teste MEDE por vocabulario: junta as palavras de seis letras ou mais do
   * texto de exemplo e exige que nenhuma delas apareca no que a pagina recebe.
   * Mutacao verificada: trocar o corpo de `narrativaParaExibir` por
   * `return gravada ?? narrativaExemplo` (o comportamento antigo) faz o teste
   * falhar aqui, apontando a primeira palavra emprestada.
   */
  it("relatorio sem narrativa nao empresta uma palavra do texto de exemplo", async () => {
    const relatorio = await carregarRelatorio(tokenSemTexto);
    assert.ok(relatorio, "o documento continua saindo: os numeros sao calculados");
    assert.equal(relatorio.narrativa, null, "nao ha narrativa gravada para este mapa");

    // O mesmo caminho da pagina, com o ambiente de producao dito na chamada.
    const narrativa = narrativaParaExibir(relatorio.narrativa, "production");

    // A varredura vem ANTES da checagem de nulo de proposito: assim quem
    // quebrar isto le "o relatorio devolveu tal palavra", e nao um "esperava
    // null" que nao diz de onde o texto veio.
    const documento = JSON.stringify({ ...relatorio, narrativa }).toLowerCase();
    for (const palavra of PALAVRAS_DO_EXEMPLO) {
      assert.ok(
        !documento.includes(palavra),
        `o relatorio devolveu "${palavra}", que e do texto escrito para outra pessoa`,
      );
    }

    assert.equal(narrativa, null, "em producao a pagina nao recebe texto nenhum");

    // Fora de producao o exemplo continua vivo, que e o que sustenta o layout.
    assert.equal(narrativaParaExibir(null, "development"), narrativaExemplo);
  });

  it("facilitador nao gera relatorio de assessment de outro parceiro", async () => {
    entrarComo(outroFacilitador);

    await assert.rejects(
      () => gerarRelatorio(tokenSemTexto),
      (erro: Error) => erro.name === "RecusaDeRegra" && /nao encontrado/i.test(erro.message),
      "o mapa e de outro parceiro, e a resposta nao confirma nem que ele existe",
    );

    const linhas = await db
      .select()
      .from(assessmentsRelatorios)
      .where(eq(assessmentsRelatorios.assessment_id, idSemTexto));
    assert.equal(linhas.length, 0, "nada foi gravado");
  });

  it("sem chave da API a geracao recusa com mensagem e nao grava nada", async () => {
    entrarComo(facilitador);
    const chave = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      await assert.rejects(
        () => gerarRelatorio(tokenSemTexto),
        (erro: Error) =>
          erro.name === "RecusaDeRegra" && erro.message.includes("ANTHROPIC_API_KEY"),
        "a recusa diz o que falta, em vez de cair na narrativa de exemplo",
      );
    } finally {
      if (chave !== undefined) process.env.ANTHROPIC_API_KEY = chave;
    }

    const linhas = await db
      .select()
      .from(assessmentsRelatorios)
      .where(eq(assessmentsRelatorios.assessment_id, idSemTexto));
    assert.equal(linhas.length, 0, "recusa nao escreve versao nenhuma");
  });
});
