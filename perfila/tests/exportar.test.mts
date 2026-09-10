/**
 * Teste da exportacao em CSV — o formato do arquivo e o recorte por dono.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * Duas metades, e as duas ja foram vazamento em algum sistema:
 *
 * 1. O ARQUIVO. Celula que comeca com `=`, `+`, `-` ou `@` vira FORMULA ao
 *    abrir no Excel — a falha conhecida como CSV injection —, e o arquivo
 *    carrega nome e e-mail digitados por terceiros. Aqui se confere o
 *    apostrofo de protecao, o BOM que salva a acentuacao no Excel do Windows,
 *    o separador ponto e virgula e a ida e volta de um campo com aspas,
 *    separador e quebra de linha dentro.
 *
 * 2. O DONO. A exportacao sai da MESMA leitura da tela, e nao de consulta
 *    nova. O caso abaixo cria dois parceiros com dado parecido e exige que o
 *    CSV de A nao contenha uma linha de B — pelos DOIS lados, porque so "B nao
 *    aparece" passaria com uma consulta que nao devolve nada nunca.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, clientes, turmas } = await import("@/lib/db/schema");
const { csv, EXPORTACOES } = await import("@/lib/exportar");
const { temPermissao } = await import("@/lib/auth");

/** Marca as linhas desta rodada, para a limpeza no fim nao levar nada alheio. */
const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";

/**
 * O nome que um cadastro hostil deixaria no banco.
 *
 * Entra por insert direto, e nao pela action: `nomePessoa` ja recusa isto no
 * formulario, e e justamente por isso que o teste nao pode depender dele — o
 * dado tambem chega por seed, por importacao e por UPDATE no psql, e a
 * protecao que o CSV precisa ter e a dele, no momento de escrever o arquivo.
 */
const NOME_HOSTIL = '=HYPERLINK("http://mau.site")';

let adminId = "";
let facilitadorA = "";
let facilitadorB = "";

function entrarComo(id: string) {
  process.env.SESSAO_DEV_USUARIO_ID = id;
}

/**
 * Le o CSV de volta, com as regras do RFC 4180.
 *
 * Existe so no teste: nada no sistema LE csv, e um parser em `src/` sem
 * chamador seria codigo morto. Aqui ele e o que faz a ida e volta valer —
 * conferir a string escapada com um `includes` provaria apenas que o escape
 * aconteceu, e nao que alguem consegue desfaze-lo.
 */
function lerCsv(texto: string): string[][] {
  // O BOM e do arquivo, nao da primeira celula — todo leitor de CSV o descarta
  // aqui. Quem confere se ele existe e o caso proprio, sobre o texto cru.
  if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);

  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let entreAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]!;

    if (entreAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreAspas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') entreAspas = true;
    else if (c === ";") {
      linha.push(campo);
      campo = "";
    } else if (c === "\r" && texto[i + 1] === "\n") {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
      i++;
    } else campo += c;
  }

  if (campo !== "" || linha.length > 0) {
    linha.push(campo);
    linhas.push(linha);
  }

  return linhas;
}

before(async () => {
  const [admin, a, b] = await db
    .insert(usuarios)
    .values([
      {
        nome: "Admin da Exportacao",
        email: `admin.exportar.${marca}@exemplo.com`,
        papel: "admin" as const,
        creditos: 0,
        modified_by: SISTEMA,
      },
      {
        nome: "Facilitador A",
        email: `a.exportar.${marca}@exemplo.com`,
        papel: "facilitador" as const,
        creditos: 0,
        modified_by: SISTEMA,
      },
      {
        nome: "Facilitador B",
        email: `b.exportar.${marca}@exemplo.com`,
        papel: "facilitador" as const,
        creditos: 0,
        modified_by: SISTEMA,
      },
    ])
    .returning();

  adminId = admin!.id;
  facilitadorA = a!.id;
  facilitadorB = b!.id;

  await db.insert(clientes).values([
    {
      facilitador_id: facilitadorA,
      nome: NOME_HOSTIL,
      email: `hostil.${marca}@exemplo.com`,
      celular: "+55 11 90000-0001",
      modified_by: SISTEMA,
    },
    {
      facilitador_id: facilitadorA,
      // Acentuacao, aspas, separador e quebra de linha no mesmo campo: e o
      // que o Excel abre errado quando falta BOM ou sobra virgula.
      nome: 'João "Zé" Antunes; o Terceiro\nSegunda linha',
      email: `joao.${marca}@exemplo.com`,
      celular: null,
      modified_by: SISTEMA,
    },
    {
      facilitador_id: facilitadorB,
      nome: "Carteira do Concorrente",
      email: `carteira.b.${marca}@exemplo.com`,
      celular: "+55 11 90000-0002",
      modified_by: SISTEMA,
    },
  ]);

  await db.insert(turmas).values([
    {
      facilitador_id: facilitadorA,
      nome: `Turma de A ${marca}`,
      area: "global" as const,
      tipo_relatorio: "S1" as const,
      modified_by: SISTEMA,
    },
    {
      facilitador_id: facilitadorB,
      nome: `Turma de B ${marca}`,
      area: "pessoal" as const,
      tipo_relatorio: "S2" as const,
      modified_by: SISTEMA,
    },
  ]);
});

after(async () => {
  // Limpeza de fixture, com SQL cru: e o unico lugar do projeto onde apagar de
  // verdade e o certo. A aplicacao nunca faz isso — ver excluir().
  const lista = `'${[adminId, facilitadorA, facilitadorB].join("','")}'`;
  await db.transaction(async (tx) => {
    await tx.execute(`delete from auditoria where user_id in (${lista})`);
    await tx.execute(`delete from clientes where facilitador_id in (${lista})`);
    await tx.execute(`delete from turmas where facilitador_id in (${lista})`);
    await tx.execute(`delete from usuarios where id in (${lista})`);
  });
});

describe("csv", () => {
  it("comeca com BOM UTF-8", () => {
    const arquivo = csv({ colunas: ["Nome"], linhas: [["João"]] });

    // Sem o BOM o Excel no Windows le o arquivo na codificacao da maquina e a
    // acentuacao abre quebrada — o arquivo inteiro parece defeito.
    assert.equal(arquivo.charCodeAt(0), 0xfeff, "o arquivo precisa comecar com BOM");
  });

  it("separa por ponto e virgula, e nao por virgula", () => {
    const arquivo = csv({ colunas: ["A", "B"], linhas: [["1,5", "x"]] });

    // Virgula e separador DECIMAL no Excel pt-BR: com ela, a planilha inteira
    // abriria numa coluna so.
    assert.ok(arquivo.includes("A;B"), "cabecalho separado por ponto e virgula");
    assert.deepEqual(lerCsv(arquivo)[1], ["1,5", "x"]);
  });

  /**
   * O caso que a protecao existe para impedir.
   *
   * O assert e sobre o valor DEPOIS de reler o arquivo: a celula tem de chegar
   * ao Excel comecando por apostrofo, e nao por `=`. Tirar o prefixo de
   * `lib/exportar.ts` faz este caso falhar — foi conferido apagando a linha.
   */
  it("neutraliza celula que o Excel leria como formula", () => {
    const perigosos = [NOME_HOSTIL, "+55 11 0000", "-2+3", "@SUM(A1)", "\tescondido"];
    const [, linha] = lerCsv(csv({ colunas: ["Campo"], linhas: perigosos.map((v) => [v]) }));

    assert.equal(linha![0], `'${NOME_HOSTIL}`, "a formula precisa sair prefixada");

    for (const valor of perigosos) {
      const [, lida] = lerCsv(csv({ colunas: ["Campo"], linhas: [[valor]] }));
      assert.equal(lida![0], `'${valor}`, `${valor} deveria sair prefixado`);
    }
  });

  /**
   * O outro lado do mesmo cuidado: numero continua numero.
   *
   * O extrato tem quantidade negativa, e prefixar `-5` com apostrofo o
   * transformaria em texto — a coluna de creditos pararia de somar na
   * planilha. O sinal de um numero nao e formula.
   */
  it("nao prefixa numero negativo", () => {
    const [, linha] = lerCsv(csv({ colunas: ["Creditos"], linhas: [[-5]] }));
    assert.equal(linha![0], "-5");
  });

  it("sobrevive a ida e volta com aspas, separador e quebra de linha", () => {
    const valor = 'João "Zé" Antunes; o Terceiro\nSegunda linha';
    const arquivo = csv({ colunas: ["Nome", "Nota"], linhas: [[valor, 7]] });

    assert.deepEqual(lerCsv(arquivo), [
      ["Nome", "Nota"],
      [valor, "7"],
    ]);
  });

  it("escreve vazio para nulo e indefinido", () => {
    const [, linha] = lerCsv(csv({ colunas: ["A", "B"], linhas: [[null, undefined]] }));
    assert.deepEqual(linha, ["", ""]);
  });
});

describe("exportar com dono", () => {
  it("recusa quem nao tem sessao", async () => {
    delete process.env.SESSAO_DEV_USUARIO_ID;
    await assert.rejects(() => EXPORTACOES.clientes!.montar(), /Nao autenticado/);
  });

  it("facilitador exporta so a propria carteira", async () => {
    entrarComo(facilitadorA);
    const arquivo = csv(await EXPORTACOES.clientes!.montar());
    const linhas = lerCsv(arquivo);

    const emails = linhas.slice(1).map((linha) => linha[1]);
    assert.ok(emails.includes(`hostil.${marca}@exemplo.com`), "A precisa ver o proprio cliente");
    assert.equal(
      arquivo.includes("Carteira do Concorrente"),
      false,
      "o CSV de A nao pode conter uma linha de B",
    );
    assert.equal(arquivo.includes(`carteira.b.${marca}@exemplo.com`), false);
  });

  it("facilitador exporta so as proprias turmas", async () => {
    entrarComo(facilitadorA);
    const arquivo = csv(await EXPORTACOES.turmas!.montar());

    assert.ok(arquivo.includes(`Turma de A ${marca}`));
    assert.equal(arquivo.includes(`Turma de B ${marca}`), false, "turma de B fora do CSV de A");
  });

  /**
   * A protecao do arquivo, no caminho de verdade.
   *
   * O caso do `describe` acima prova a funcao; este prova que a exportacao
   * REAL passa por ela — uma exportacao que montasse a linha por conta propria
   * continuaria verde la e vazaria a formula aqui.
   */
  it("neutraliza a formula que veio do banco", async () => {
    entrarComo(facilitadorA);
    const linhas = lerCsv(csv(await EXPORTACOES.clientes!.montar()));
    const hostil = linhas.find((linha) => linha[1] === `hostil.${marca}@exemplo.com`);

    assert.ok(hostil, "a linha precisa estar no arquivo");
    assert.equal(hostil![0], `'${NOME_HOSTIL}`);
  });

  it("admin exporta a carteira dos dois parceiros", async () => {
    entrarComo(adminId);
    const arquivo = csv(await EXPORTACOES.clientes!.montar());

    assert.ok(arquivo.includes(`hostil.${marca}@exemplo.com`));
    assert.ok(arquivo.includes("Carteira do Concorrente"));
  });

  /**
   * O que a rota confere antes de montar qualquer coisa.
   *
   * As duas metades importam: a permissao recusa o parceiro na porta (403 em
   * vez de 500) e a leitura recusa de novo por dentro. Tirar uma das duas
   * deixaria a outra de pe, e e por isso que as duas sao testadas.
   */
  it("facilitador nao exporta a lista de parceiros nem o extrato da plataforma", async () => {
    assert.equal(temPermissao("facilitador", EXPORTACOES.facilitadores!.recurso, "ler"), false);
    assert.equal(temPermissao("facilitador", EXPORTACOES.creditos!.recurso, "ler"), false);
    assert.equal(temPermissao("facilitador", EXPORTACOES.questoes!.recurso, "ler"), false);
    assert.equal(temPermissao("admin", EXPORTACOES.facilitadores!.recurso, "ler"), true);

    entrarComo(facilitadorA);
    await assert.rejects(() => EXPORTACOES.facilitadores!.montar(), /Sem permissao/);
    await assert.rejects(() => EXPORTACOES.creditos!.montar(), /Sem permissao/);
  });

  /**
   * A rota, chamada direto.
   *
   * Vale como teste fora de uma requisicao do Next porque `getSession` aceita
   * o atalho de desenvolvimento antes de tocar em cabecalho — o mesmo atalho
   * que o resto da suite usa. O que se confere aqui e a entrega: sem
   * `Content-Disposition` o navegador exibe o CSV na tela em vez de salvar, e
   * ai o botao continua nao baixando nada.
   */
  it("a rota entrega o arquivo com nome, data e recusa por status", async () => {
    const { GET } = await import("@/app/api/exportar/[tipo]/route");
    const chamar = (tipo: string) =>
      GET(new Request(`http://local/api/exportar/${tipo}`), {
        params: Promise.resolve({ tipo }),
      });

    entrarComo(facilitadorA);
    const resposta = await chamar("clientes");
    assert.equal(resposta.status, 200);
    assert.match(resposta.headers.get("content-type") ?? "", /text\/csv; charset=utf-8/);
    assert.match(
      resposta.headers.get("content-disposition") ?? "",
      /attachment; filename="clientes-\d{4}-\d{2}-\d{2}\.csv"/,
    );
    // Cache compartilhado serviria o CSV de um parceiro ao proximo que pedisse
    // o mesmo endereco.
    assert.equal(resposta.headers.get("cache-control"), "no-store");
    // Os BYTES, e nao `text()`: quem decodifica UTF-8 DESCARTA o BOM ao ler,
    // entao `text()` devolveria o arquivo sem ele e o teste passaria mesmo se
    // a rota tivesse mandado o CSV cru.
    const bytes = new Uint8Array(await resposta.arrayBuffer());
    assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf], "o arquivo sai com BOM UTF-8");

    assert.equal((await chamar("facilitadores")).status, 403, "parceiro nao exporta parceiros");
    assert.equal((await chamar("nao-existe")).status, 404);

    delete process.env.SESSAO_DEV_USUARIO_ID;
    assert.equal((await chamar("clientes")).status, 401);
  });

  it("exporta o banco de questoes, que vem do codigo", async () => {
    entrarComo(adminId);
    const { questoes } = await import("@/data/assessment");
    const linhas = lerCsv(csv(await EXPORTACOES.questoes!.montar()));

    assert.equal(linhas.length - 1, questoes.length, "uma linha por questao, fora o cabecalho");
    assert.deepEqual(linhas[0]!.slice(0, 3), ["Bloco", "Codigo", "Enunciado"]);
  });
});
