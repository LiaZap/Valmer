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
import type { Navegador } from "@/lib/copiar";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, assessments, assessmentsRelatorios } = await import("@/lib/db/schema");
const acoes = await import("@/lib/actions/relatorio");
const { narrativaExemplo } = await import("@/data/narrativa-exemplo");
const { copiarTexto } = await import("@/lib/copiar");
const persistir = await import("@/lib/relatorio/persistir");
const { eq } = await import("drizzle-orm");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";

const DIA = 24 * 60 * 60 * 1000;

let facilitador = "";
let tokenPronto = "";
let tokenSemNarrativa = "";
let tokenPendente = "";
let tokenSemContadores = "";
let idPronto = "";
let idSemNarrativa = "";

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
  idSemNarrativa = await inserirAssessment(tokenSemNarrativa, "concluido", { D: 4, I: 5, S: 8, C: 11 });
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

/**
 * Copiar o link, os tres degraus.
 *
 * Nao ha DOM aqui, entao `copiarTexto` recebe a fatia de navegador por
 * parametro — mesmo arranjo do `ambiente` de `narrativaParaExibir`. O degrau
 * do meio (`execCommand`) precisa de `document` de verdade e fica de fora: o
 * que este teste guarda e a REGRA que o `?.` engolido quebrava, ou seja, sem
 * area de transferencia a funcao avisa e devolve `false`, e nunca deixa a tela
 * dizer "copiado" com a area de transferencia intacta.
 */
/**
 * O arrendamento da geracao.
 *
 * Escrever a narrativa e a UNICA operacao paga do sistema, leva minutos e tem
 * dois gatilhos: o `after()` da conclusao e o botao "Gerar relatorio" da lista.
 * Antes do arrendamento, os dois liam "sem narrativa" e a plataforma pagava a
 * API duas vezes pelo mesmo texto.
 *
 * O teste nao chama a API: ele prova que a SEGUNDA chamada desiste ANTES de
 * chegar la. Se ela chegasse, o erro seria outro — o de chave ausente, que o
 * ultimo caso usa justamente como prova de que passou.
 */
describe("arrendamento da geracao da narrativa", () => {
  const chaveOriginal = process.env.ANTHROPIC_API_KEY;

  after(() => {
    if (chaveOriginal === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = chaveOriginal;
  });

  it("recusa a segunda geracao enquanto a primeira esta escrevendo", async () => {
    // Sem a chave, chegar na API seria um erro visivel: e o que garante que a
    // recusa abaixo veio do arrendamento, e nao de outro lugar.
    delete process.env.ANTHROPIC_API_KEY;

    await db
      .update(assessments)
      .set({ narrativa_gerando_em: new Date() })
      .where(eq(assessments.id, idSemNarrativa));

    const resposta = await persistir.gerarESalvar(tokenSemNarrativa);
    assert.deepEqual(resposta, { ok: false, erro: "em_geracao" });
  });

  it("o arrendamento vence, senao um processo morto travaria o mapa para sempre", async () => {
    delete process.env.ANTHROPIC_API_KEY;

    // Onze minutos: um a mais que o prazo. E o processo que caiu no meio.
    await db
      .update(assessments)
      .set({ narrativa_gerando_em: new Date(Date.now() - 11 * 60 * 1000) })
      .where(eq(assessments.id, idSemNarrativa));

    // Passar do arrendamento significa TENTAR gerar — e sem chave isso falha
    // com a mensagem de configuracao. Esse erro e a prova de que passou.
    await assert.rejects(() => persistir.gerarESalvar(tokenSemNarrativa), /ANTHROPIC_API_KEY/);

    const [linha] = await db
      .select({ desde: assessments.narrativa_gerando_em })
      .from(assessments)
      .where(eq(assessments.id, idSemNarrativa));
    assert.equal(linha!.desde, null, "falha da API tem de devolver o arrendamento na hora");
  });
});

describe("copiar link", () => {
  function fingir(clipboard: Navegador["navigator"]["clipboard"]) {
    const mostrados: string[] = [];
    const janela = {
      navigator: { clipboard },
      prompt: (_mensagem?: string, valor?: string) => {
        mostrados.push(valor ?? "");
        return null;
      },
    } satisfies Navegador;

    return { janela, mostrados };
  }

  it("copia quando a area de transferencia existe", async () => {
    const escritos: string[] = [];
    const { janela, mostrados } = fingir({
      writeText: async (texto: string) => {
        escritos.push(texto);
      },
    });

    assert.equal(await copiarTexto("https://exemplo/relatorio/abc", janela), true);
    assert.deepEqual(escritos, ["https://exemplo/relatorio/abc"]);
    assert.deepEqual(mostrados, [], "copiou sozinho, nao ha o que avisar");
  });

  it("fora de contexto seguro avisa e mostra o endereco", async () => {
    // Este e o defeito relatado: em HTTP `navigator.clipboard` e undefined.
    // O `navigator.clipboard?.writeText(...)` de antes engolia a chamada e o
    // botao acendia sem copiar nada.
    const { janela, mostrados } = fingir(undefined);

    assert.equal(await copiarTexto("https://exemplo/relatorio/abc", janela), false);
    assert.deepEqual(mostrados, ["https://exemplo/relatorio/abc"]);
  });

  it("permissao negada tambem avisa, em vez de sumir", async () => {
    const { janela, mostrados } = fingir({
      writeText: async () => {
        throw new Error("NotAllowedError");
      },
    });

    assert.equal(await copiarTexto("https://exemplo/relatorio/abc", janela), false);
    assert.deepEqual(mostrados, ["https://exemplo/relatorio/abc"]);
  });
});
