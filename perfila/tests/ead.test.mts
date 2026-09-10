/**
 * Teste de integracao do programa do curso (modulo, aula e video), contra o
 * banco local.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   node --import tsx --test tests/ead.test.mts
 *
 * Cobre o que quebra calado nesta frente:
 *
 * - RBAC: o programa e do dono da plataforma, nao do parceiro;
 * - o ESPELHO: rascunho nao vaza, e aula SEM VIDEO continua na lista em vez de
 *   sumir — o requisito que separa "espelho" de "vitrine so do que ficou
 *   pronto";
 * - a reordenacao trocando DUAS linhas, com o optimistic locking recusando a
 *   gravacao que passaria por cima de outra aba;
 * - a guarda do delete logico do modulo com aula dentro;
 * - a chave de video fora da pasta da aula sendo recusada — o pedido montado a
 *   mao que apontaria a aula para qualquer objeto do bucket.
 *
 * O ENVIO EM SI NAO E TESTADO AQUI: ele acontece no navegador, direto contra o
 * MinIO. O que este arquivo cobre e a metade que e nossa — a decisao de aceitar
 * ou recusar a chave. Ver `tests/storage.test.mts` para o bucket de verdade.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, cursoAulas, cursoModulos } = await import("@/lib/db/schema");
const acoes = await import("@/lib/actions/ead");
const video = await import("@/lib/actions/ead-video");
const titulo = await import("@/lib/actions/ead-titulo");
const cursosAcoes = await import("@/lib/actions/cursos");
const { trilhaPublicada } = await import("@/lib/ead");
const { eq } = await import("drizzle-orm");

const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";

let admin = "";
let facilitador = "";
let cursoId = "";
let moduloId = "";
let aulaA = "";
let aulaB = "";

function entrarComo(id: string) {
  process.env.SESSAO_DEV_USUARIO_ID = id;
}

before(async () => {
  const [a, f] = await db
    .insert(usuarios)
    .values([
      {
        nome: "Admin do EAD",
        email: `admin.ead.${marca}@exemplo.com`,
        papel: "admin" as const,
        modified_by: SISTEMA,
      },
      {
        nome: "Facilitador do EAD",
        email: `fac.ead.${marca}@exemplo.com`,
        papel: "facilitador" as const,
        modified_by: SISTEMA,
      },
    ])
    .returning();

  admin = a!.id;
  facilitador = f!.id;

  entrarComo(admin);
  const curso = await cursosAcoes.criar({
    titulo: `Curso EAD ${marca}`,
    descricao: "Descricao com tamanho suficiente para passar na validacao.",
    conteudo: "Ementa do curso, em prosa, que e o que este campo passa a ser.",
  });
  cursoId = curso.id;
});

after(async () => {
  // Limpeza de fixture, com SQL cru: e o unico lugar do projeto onde apagar de
  // verdade e o certo. A ordem segue as FKs — aula aponta para modulo, modulo
  // aponta para curso.
  const ids = [admin, facilitador];
  await db.transaction(async (tx) => {
    if (moduloId) {
      await tx.execute(`delete from curso_aulas where modulo_id = '${moduloId}'`);
      await tx.execute(`delete from curso_modulos where id = '${moduloId}'`);
    }
    await tx.execute(`delete from auditoria where user_id in ('${ids.join("','")}')`);
    if (cursoId) await tx.execute(`delete from cursos where id = '${cursoId}'`);
    await tx.execute(`delete from usuarios where id in ('${ids.join("','")}')`);
  });
  delete process.env.SESSAO_DEV_USUARIO_ID;
});

describe("programa do curso", () => {
  it("recusa quem nao esta logado", async () => {
    delete process.env.SESSAO_DEV_USUARIO_ID;
    await assert.rejects(
      () => acoes.criarModulo({ curso_id: cursoId, titulo: "Modulo pirata" }),
      /Nao autenticado/,
    );
  });

  it("recusa o facilitador: o programa e do dono da plataforma", async () => {
    entrarComo(facilitador);
    await assert.rejects(
      () => acoes.criarModulo({ curso_id: cursoId, titulo: "Modulo do parceiro" }),
      /Sem permissao/,
    );
  });

  it("cria modulo e aulas, e a aula nasce SEM video", async () => {
    entrarComo(admin);
    const modulo = await acoes.criarModulo({ curso_id: cursoId, titulo: "Fundamentos DISC" });
    moduloId = modulo.id;

    const primeira = await acoes.criarAula({ modulo_id: moduloId, titulo: "Apresentacao" });
    const segunda = await acoes.criarAula({ modulo_id: moduloId, titulo: "Graficos DISC" });
    aulaA = primeira.id;
    aulaB = segunda.id;

    assert.equal(primeira.video_chave, null, "aula nao pode nascer com video");
    assert.equal(primeira.duracao_segundos, null, "duracao nao pode nascer inventada");
    // A posicao nasce do "ultimo + 1": sem isso as duas empatariam em zero e a
    // reordenacao nao teria com que trocar.
    assert.ok(segunda.ordem > primeira.ordem, "a segunda aula nao ficou depois da primeira");
  });

  it("nao espelha curso em rascunho", async () => {
    const trilha = await trilhaPublicada();
    assert.ok(!trilha.some((curso) => curso.id === cursoId), "rascunho vazou para o parceiro");
  });

  it("espelha o que foi publicado, com a aula pendente ainda na lista", async () => {
    entrarComo(admin);
    const [antes] = await db
      .select()
      .from(cursoModulos)
      .where(eq(cursoModulos.id, moduloId));
    assert.ok(antes);

    const curso = (await cursosAcoes.listar()).find((linha) => linha.id === cursoId)!;
    await cursosAcoes.alternarPublicacao(cursoId, true, curso.updated_at);

    const trilha = await trilhaPublicada();
    const espelhado = trilha.find((linha) => linha.id === cursoId);

    assert.ok(espelhado, "curso publicado nao chegou ao parceiro");
    assert.equal(espelhado.modulos.length, 1);
    assert.equal(espelhado.modulos[0]!.aulas.length, 2, "aula sem video sumiu do espelho");
    assert.equal(espelhado.modulos[0]!.aulas[0]!.video_chave, null);
  });

  it("reordena trocando so as duas linhas envolvidas", async () => {
    entrarComo(admin);
    const [antes] = await db.select().from(cursoAulas).where(eq(cursoAulas.id, aulaB));
    const ordemOriginalB = antes!.ordem;

    await acoes.moverAula(aulaB, "cima", antes!.updated_at);

    const [a, b] = await Promise.all([
      db.select().from(cursoAulas).where(eq(cursoAulas.id, aulaA)),
      db.select().from(cursoAulas).where(eq(cursoAulas.id, aulaB)),
    ]);

    assert.ok(b[0]!.ordem < a[0]!.ordem, "a aula nao subiu");
    assert.equal(a[0]!.ordem, ordemOriginalB, "a vizinha nao recebeu a posicao da que subiu");

    const trilha = await trilhaPublicada();
    const aulas = trilha.find((linha) => linha.id === cursoId)!.modulos[0]!.aulas;
    assert.equal(aulas[0]!.id, aulaB, "o espelho nao respeitou a nova ordem");
  });

  it("recusa subir a aula que ja e a primeira", async () => {
    entrarComo(admin);
    const [linha] = await db.select().from(cursoAulas).where(eq(cursoAulas.id, aulaB));
    await assert.rejects(
      () => acoes.moverAula(aulaB, "cima", linha!.updated_at),
      /ja e a primeira/,
    );
  });

  it("recusa a reordenacao que passaria por cima de outra aba", async () => {
    entrarComo(admin);
    const desatualizado = new Date(2020, 0, 1);
    await assert.rejects(
      () => acoes.moverAula(aulaB, "baixo", desatualizado),
      /alterada por outra aba/,
    );

    const [linha] = await db.select().from(cursoAulas).where(eq(cursoAulas.id, aulaB));
    const trilha = await trilhaPublicada();
    const aulas = trilha.find((curso) => curso.id === cursoId)!.modulos[0]!.aulas;
    assert.equal(aulas[0]!.id, aulaB, "a recusa nao pode ter mexido na ordem");
    assert.ok(linha, "a recusa nao pode ter mexido na linha");
  });

  it("recusa video cuja chave nao esta na pasta da aula", async () => {
    entrarComo(admin);
    const [linha] = await db.select().from(cursoAulas).where(eq(cursoAulas.id, aulaA));

    await assert.rejects(
      () =>
        video.confirmarVideo(
          { aula_id: aulaA, chave: `cursos/videos/${aulaB}/roubado.mp4` },
          linha!.updated_at,
        ),
      /nao confere com a aula/,
    );

    const [depois] = await db.select().from(cursoAulas).where(eq(cursoAulas.id, aulaA));
    assert.equal(depois!.video_chave, null, "a recusa gravou a chave assim mesmo");
  });

  /**
   * A porta que faltava, e o motivo dela.
   *
   * O programa nasceu sem renomear, com o argumento de que "titulo errado se
   * resolve excluindo e recriando". Nao se resolve: `excluirModulo` recusa
   * modulo com aula dentro (o teste logo abaixo prova isso) e `excluirAula`
   * leva o video junto. Sem esta action, corrigir um acento custava reenviar as
   * gravacoes do modulo inteiro.
   */
  it("renomeia o modulo sem tocar nas aulas nem na ordem", async () => {
    entrarComo(admin);
    const [antes] = await db.select().from(cursoModulos).where(eq(cursoModulos.id, moduloId));

    const gravado = await titulo.renomearModulo(
      moduloId,
      { titulo: `Modulo corrigido ${marca}` },
      antes!.updated_at,
    );

    assert.equal(gravado.titulo, `Modulo corrigido ${marca}`);
    assert.equal(gravado.ordem, antes!.ordem, "renomear nao pode reposicionar");

    const aulas = await db.select().from(cursoAulas).where(eq(cursoAulas.modulo_id, moduloId));
    assert.equal(
      aulas.filter((aula) => !aula.is_deleted).length,
      antes ? aulas.filter((aula) => !aula.is_deleted).length : 0,
      "nenhuma aula pode sumir",
    );
  });

  it("renomear aula nao apaga o video que ja subiu", async () => {
    entrarComo(admin);
    // Simula uma aula com gravacao no ar: e o caso em que perder a chave
    // custaria o reenvio do arquivo.
    await db
      .update(cursoAulas)
      .set({ video_chave: `cursos/videos/${aulaA}/fake.mp4`, duracao_segundos: 90 })
      .where(eq(cursoAulas.id, aulaA));

    const [antes] = await db.select().from(cursoAulas).where(eq(cursoAulas.id, aulaA));
    const gravado = await titulo.renomearAula(
      aulaA,
      { titulo: `Aula corrigida ${marca}` },
      antes!.updated_at,
    );

    assert.equal(gravado.titulo, `Aula corrigida ${marca}`);
    assert.equal(gravado.video_chave, antes!.video_chave, "a gravacao continua no lugar");
    assert.equal(gravado.duracao_segundos, 90);

    // Deixa a aula como estava, para os testes seguintes.
    await db
      .update(cursoAulas)
      .set({ video_chave: null, duracao_segundos: null })
      .where(eq(cursoAulas.id, aulaA));
  });

  it("recusa o renomear que passaria por cima de outra aba", async () => {
    entrarComo(admin);
    const [linha] = await db.select().from(cursoModulos).where(eq(cursoModulos.id, moduloId));
    const velho = new Date(linha!.updated_at.getTime() - 1000);

    await assert.rejects(
      () => titulo.renomearModulo(moduloId, { titulo: `Outro ${marca}` }, velho),
      /outra aba/,
    );

    const [depois] = await db.select().from(cursoModulos).where(eq(cursoModulos.id, moduloId));
    assert.equal(depois!.titulo, linha!.titulo, "o titulo recusado nao pode ter mudado");
  });

  it("renomear e do dono da plataforma: recusa sessao ausente e facilitador", async () => {
    delete process.env.SESSAO_DEV_USUARIO_ID;
    const [linha] = await db.select().from(cursoModulos).where(eq(cursoModulos.id, moduloId));
    await assert.rejects(
      () => titulo.renomearModulo(moduloId, { titulo: "Invasao" }, linha!.updated_at),
      /Nao autenticado/,
    );

    entrarComo(facilitador);
    await assert.rejects(
      () => titulo.renomearModulo(moduloId, { titulo: "Invasao" }, linha!.updated_at),
      /Sem permissao/,
    );
  });

  /**
   * A guarda que `ead-video.ts` chama, nos proprios comentarios, de porta para
   * "qualquer um encher o bucket". Ela nao tinha teste nenhum.
   */
  it("assinar envio de video exige sessao com permissao", async () => {
    delete process.env.SESSAO_DEV_USUARIO_ID;
    await assert.rejects(
      () => video.assinarVideo({ aula_id: aulaA, tipo: "video/mp4", tamanho: 1024 }),
      /Nao autenticado/,
    );

    entrarComo(facilitador);
    await assert.rejects(
      () => video.assinarVideo({ aula_id: aulaA, tipo: "video/mp4", tamanho: 1024 }),
      /Sem permissao/,
    );
  });

  it("nao exclui modulo com aula dentro, e exclui depois de esvaziar", async () => {
    entrarComo(admin);
    await assert.rejects(() => acoes.excluirModulo(moduloId), /ainda tem 2 aula/);

    await acoes.excluirAula(aulaA);
    await acoes.excluirAula(aulaB);
    const excluido = await acoes.excluirModulo(moduloId);

    assert.equal(excluido.is_deleted, true);
    assert.ok(excluido.deleted_at instanceof Date);

    // Delete logico: a linha continua no banco, so nao aparece mais.
    const [linha] = await db.select().from(cursoModulos).where(eq(cursoModulos.id, moduloId));
    assert.ok(linha, "delete fisico: a linha do modulo sumiu do banco");

    const trilha = await trilhaPublicada();
    assert.equal(
      trilha.find((curso) => curso.id === cursoId)!.modulos.length,
      0,
      "modulo excluido continuou no espelho",
    );
  });
});
