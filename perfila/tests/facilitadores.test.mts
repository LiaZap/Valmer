/**
 * Teste de integracao do cadastro de parceiro e da venda de credito, contra o
 * banco local.
 *
 *   docker compose up -d db   (na raiz do repositorio)
 *   npm test
 *
 * O que se verifica aqui e o que quebra calado: a invariante que a trigger da
 * 0005 cobra no COMMIT (saldo = soma do extrato), o recorte por papel, a
 * recusa legivel de e-mail repetido e a senha que o parceiro recebe de fato
 * funcionando no login.
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { config } from "dotenv";

config({ path: [".env.local", ".env"] });

const { db } = await import("@/lib/db");
const { usuarios, creditosTransacoes } = await import("@/lib/db/schema");
const acoes = await import("@/lib/actions/facilitadores");
const { auth } = await import("@/lib/auth/config");
const { eq, sql } = await import("drizzle-orm");

/** Marca as linhas desta rodada, para a limpeza no fim nao levar nada alheio. */
const marca = `teste-${Date.now()}`;
const SISTEMA = "00000000-0000-0000-0000-000000000000";
const SENHA = "senha-inicial-longa";

let adminId = "";
let facilitadorId = "";
let parceiroId = "";
const emailParceiro = `parceiro.${marca}@exemplo.com`;

function entrarComo(id: string) {
  process.env.SESSAO_DEV_USUARIO_ID = id;
}

/** A soma do extrato ativo do usuario: o numero que a trigger da 0005 confere. */
async function somaDoExtrato(usuarioId: string): Promise<number> {
  const [linha] = await db
    .select({ total: sql<number>`coalesce(sum(${creditosTransacoes.quantidade}), 0)::int` })
    .from(creditosTransacoes)
    .where(eq(creditosTransacoes.usuario_id, usuarioId));

  return linha!.total;
}

async function saldoDe(usuarioId: string): Promise<number> {
  const [linha] = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId));
  return linha!.creditos;
}

before(async () => {
  // Os dois nascem com saldo zero, que a soma vazia do extrato ja explica.
  const [admin, facilitador] = await db
    .insert(usuarios)
    .values([
      {
        nome: "Admin do Teste",
        email: `admin.${marca}@exemplo.com`,
        papel: "admin" as const,
        creditos: 0,
        modified_by: SISTEMA,
      },
      {
        nome: "Facilitador do Teste",
        email: `facilitador.${marca}@exemplo.com`,
        papel: "facilitador" as const,
        creditos: 0,
        modified_by: SISTEMA,
      },
    ])
    .returning();

  adminId = admin!.id;
  facilitadorId = facilitador!.id;
});

after(async () => {
  // Limpeza de fixture com SQL cru, numa transacao so: apagar o extrato num
  // commit deixaria, naquele instante, um usuario com saldo que transacao
  // nenhuma explica — exatamente o que a guarda da 0005 aborta. Apagando tudo
  // junto o usuario ja nao existe no COMMIT, e a checagem pula quem sumiu.
  const ids = [adminId, facilitadorId, parceiroId].filter(Boolean);
  const lista = `('${ids.join("','")}')`;

  await db.transaction(async (tx) => {
    await tx.execute(`delete from sessoes where usuario_id in ${lista}`);
    await tx.execute(`delete from contas where usuario_id in ${lista}`);
    await tx.execute(`delete from auditoria where user_id in ${lista}`);
    await tx.execute(`delete from creditos_transacoes where usuario_id in ${lista}`);
    await tx.execute(`delete from usuarios where id in ${lista}`);
  });
});

describe("facilitadores", () => {
  it("recusa quem nao tem sessao", async () => {
    delete process.env.SESSAO_DEV_USUARIO_ID;
    await assert.rejects(
      () =>
        acoes.criar({
          nome: "Sem Sessao",
          email: `anonimo.${marca}@exemplo.com`,
          empresa: "Consultoria Anonima",
          pacote: "Starter",
          senha: SENHA,
        }),
      /Nao autenticado/,
    );
  });

  it("admin cria o parceiro com o pacote creditado e lastro no extrato", async () => {
    entrarComo(adminId);

    const novo = await acoes.criar({
      nome: "Parceiro Novo",
      email: emailParceiro.toUpperCase(),
      empresa: "Consultoria Teste",
      pacote: "Starter",
      senha: SENHA,
    });
    parceiroId = novo.id;

    assert.equal(novo.papel, "facilitador");
    assert.equal(novo.email, emailParceiro, "e-mail normalizado");
    assert.equal(novo.creditos, 10, "o pacote Starter tem 10 creditos");

    // A invariante da trigger: o commit acima ja teria sido abortado se o
    // extrato nao explicasse o saldo. O assert deixa o motivo visivel.
    assert.equal(await somaDoExtrato(novo.id), novo.creditos);

    const [compra] = await db
      .select()
      .from(creditosTransacoes)
      .where(eq(creditosTransacoes.usuario_id, novo.id));
    assert.equal(compra!.tipo, "compra");
    assert.equal(compra!.quantidade, 10);
  });

  it("o parceiro criado entra com a senha definida", async () => {
    const resposta = await auth.api.signInEmail({
      body: { email: emailParceiro, password: SENHA },
      headers: new Headers(),
    });

    assert.equal((resposta.user as { id: string }).id, parceiroId);
  });

  it("recusa e-mail repetido com mensagem, e nao com excecao de banco", async () => {
    entrarComo(adminId);

    const resposta = await acoes.criarPelaTela({
      nome: "Parceiro Repetido",
      email: emailParceiro,
      empresa: "Outra Consultoria",
      pacote: "Pro",
      senha: SENHA,
    });

    assert.equal(resposta.ok, false);
    assert.match(resposta.ok ? "" : resposta.erro, /Ja existe um usuario com o e-mail/);
  });

  it("recusa senha curta antes de gravar", async () => {
    entrarComo(adminId);

    const resposta = await acoes.criarPelaTela({
      nome: "Parceiro Sem Senha",
      email: `curta.${marca}@exemplo.com`,
      empresa: "Consultoria Teste",
      pacote: "Starter",
      senha: "123",
    });

    assert.equal(resposta.ok, false);
    assert.match(resposta.ok ? "" : resposta.erro, /pelo menos 10 caracteres/);

    const [criado] = await db
      .select()
      .from(usuarios)
      .where(eq(usuarios.email, `curta.${marca}@exemplo.com`));
    assert.equal(criado, undefined, "nada foi gravado");
  });

  it("admin vende um pacote: saldo sobe e o extrato explica", async () => {
    entrarComo(adminId);

    const venda = await acoes.venderCreditos({ facilitador_id: parceiroId, pacote: "Pro" });

    assert.equal(venda.creditos, 50);
    assert.equal(venda.saldo, 60, "10 do Starter + 50 do Pro");
    assert.equal(await saldoDe(parceiroId), 60);
    assert.equal(await somaDoExtrato(parceiroId), 60);
  });

  it("facilitador nao cria parceiro nem vende credito", async () => {
    entrarComo(facilitadorId);

    await assert.rejects(
      () =>
        acoes.criar({
          nome: "Parceiro Do Colega",
          email: `colega.${marca}@exemplo.com`,
          empresa: "Consultoria Teste",
          pacote: "Starter",
          senha: SENHA,
        }),
      /Sem permissao/,
    );

    await assert.rejects(
      () => acoes.venderCreditos({ facilitador_id: facilitadorId, pacote: "Enterprise" }),
      /Sem permissao/,
    );

    // Recusar com excecao nao basta: o que nao pode e o saldo ter se mexido.
    assert.equal(await saldoDe(facilitadorId), 0);
    assert.equal(await somaDoExtrato(facilitadorId), 0);
  });
});
