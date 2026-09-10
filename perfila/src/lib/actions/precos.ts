/**
 * Escrita da tabela comercial: o preco de cada nivel de relatorio e os pacotes
 * de credito. So o admin passa por aqui (`precos:*` no rbac).
 *
 * Mesma estrutura de `actions/turmas.ts` e `actions/assessments.ts`: sessao
 * exigida na entrada, transacao com a trilha dentro, optimistic locking por
 * `updated_at` e recusa de regra separada de falha. O que NAO tem aqui e o
 * recorte por dono — preco nao tem dono, e o porque esta escrito em
 * `db/schema/precos.ts`.
 *
 * A LEITURA do catalogo nao mora neste arquivo: e `lib/precos.ts`, aberta a
 * quem ja tem permissao para gastar credito. Aqui so entra quem pode MUDAR o
 * preco.
 *
 * NADA AQUI TOCA NO PASSADO
 * -------------------------
 * Mudar o preco de S1 nao mexe em `assessments.creditos_usados` de mapa
 * nenhum, nem em `creditos_transacoes`. O custo foi copiado para a linha do
 * mapa na criacao; estas funcoes so dizem quanto custa o PROXIMO. Reprecificar
 * o passado faria o extrato parar de explicar o saldo, e a CONSTRAINT TRIGGER
 * da migration 0005 abortaria o COMMIT — mas o motivo de nao fazer isso e
 * anterior ao banco: o credito ja foi debitado.
 */
"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { precosPacotes, precosRelatorios } from "@/lib/db/schema";
import { getSession, temPermissao, type Acao, type Sessao } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit/logger";
import { listarPacotes, listarPrecosRelatorios } from "@/lib/precos";
import { atualizarPrecoRelatorioSchema, pacoteSchema } from "@/lib/validators/preco";
import { paraTela, RecusaDeRegra } from "./recusa";

const RECURSO = "precos";
const TELA = "/admin/precos";

async function exigirSessao(acao: Acao): Promise<Sessao> {
  const sessao = await getSession();
  if (!sessao) throw new Error("Nao autenticado");
  if (!temPermissao(sessao.papel, RECURSO, acao)) {
    throw new Error(`Sem permissao para ${acao} precos`);
  }
  return sessao;
}

// ---------------------------------------------------------------------------
// Precos dos niveis de relatorio
// ---------------------------------------------------------------------------

/**
 * A tabela de precos para a TELA DE GESTAO — a de admin.
 *
 * Repare que ela chama o mesmo leitor de `lib/precos.ts` e so acrescenta a
 * checagem de permissao. Quem quer o catalogo para escolher um nivel (o
 * formulario de novo mapa, por exemplo) chama `lib/precos.ts` direto: aquele
 * caminho e do facilitador, e este e do dono do negocio.
 */
export async function listarRelatorios() {
  await exigirSessao("ler");
  return listarPrecosRelatorios();
}

/**
 * Muda quanto um nivel custa, com optimistic locking.
 *
 * O WHERE compara `updated_at` com o valor que a tela leu: se outra aba gravou
 * nesse meio tempo, nenhuma linha casa e a gravacao e recusada em vez de
 * sobrescrever o trabalho alheio. Em preco isso vale dobrado — duas abas com
 * numeros diferentes deixariam vigente o preco de quem clicou por ultimo, sem
 * ninguem saber qual foi.
 *
 * A trilha grava o antes e o depois. E a unica forma de responder, um mes
 * depois, por que dois mapas do mesmo nivel custaram numeros diferentes.
 */
export async function atualizarRelatorio(
  id: string,
  dados: unknown,
  updatedAtOriginal: Date,
) {
  const sessao = await exigirSessao("atualizar");
  const validado = atualizarPrecoRelatorioSchema.parse(dados);

  return db.transaction(async (tx) => {
    const [anterior] = await tx
      .select()
      .from(precosRelatorios)
      .where(and(eq(precosRelatorios.id, id), eq(precosRelatorios.is_deleted, false)))
      .limit(1);

    if (!anterior) throw new RecusaDeRegra("Preco nao encontrado");

    const resultado = await tx
      .update(precosRelatorios)
      .set({
        nome: validado.nome,
        creditos: validado.creditos,
        conteudo: validado.conteudo,
        revenda_min: validado.revenda_min,
        revenda_max: validado.revenda_max,
        updated_at: new Date(),
        modified_by: sessao.userId,
      })
      .where(
        and(
          eq(precosRelatorios.id, id),
          eq(precosRelatorios.updated_at, updatedAtOriginal),
          eq(precosRelatorios.is_deleted, false),
        ),
      )
      .returning();

    if (resultado.length === 0) {
      throw new RecusaDeRegra(
        "Este preco foi alterado por outra aba. Recarregue a pagina e tente de novo.",
      );
    }

    await registrarAuditoria(
      {
        userId: sessao.userId,
        acao: "atualizar",
        tabela: "precos_relatorios",
        registroId: id,
        detalhes:
          `Alterou o preco de ${anterior.codigo}: ${anterior.creditos} -> ` +
          `${resultado[0]!.creditos} credito(s). Vale para os proximos mapas; ` +
          `os ja criados mantem o custo que pagaram.`,
        dadosAnteriores: anterior,
        dadosNovos: resultado[0],
      },
      tx,
    );

    return resultado[0]!;
  });
}

// ---------------------------------------------------------------------------
// Pacotes de credito
// ---------------------------------------------------------------------------

/** Os pacotes para a tela de gestao. Ver a nota de `listarRelatorios`. */
export async function listarPacotesDeCredito() {
  await exigirSessao("ler");
  return listarPacotes();
}

/**
 * Cria um pacote.
 *
 * O indice unico parcial de `nome` ja recusaria o repetido, mas com erro de
 * banco na cara do admin. A consulta antes existe para a recusa ter nome; o
 * indice continua sendo a garantia.
 */
export async function criarPacote(dados: unknown) {
  const sessao = await exigirSessao("criar");
  const validado = pacoteSchema.parse(dados);

  return db.transaction(async (tx) => {
    const [existente] = await tx
      .select({ id: precosPacotes.id })
      .from(precosPacotes)
      .where(
        and(eq(precosPacotes.nome, validado.nome), eq(precosPacotes.is_deleted, false)),
      )
      .limit(1);

    if (existente) throw new RecusaDeRegra(`Ja existe um pacote chamado "${validado.nome}".`);

    const [novo] = await tx
      .insert(precosPacotes)
      .values({ ...validado, modified_by: sessao.userId })
      .returning();

    await registrarAuditoria(
      {
        userId: sessao.userId,
        acao: "criar",
        tabela: "precos_pacotes",
        registroId: novo!.id,
        detalhes: `Criou o pacote ${novo!.nome}: ${novo!.creditos} creditos por R$ ${novo!.preco}`,
        dadosNovos: novo,
      },
      tx,
    );

    return novo!;
  });
}

/**
 * Edita um pacote, com optimistic locking.
 *
 * Mudar o pacote NAO mexe em venda ja feita: a compra virou linha de extrato
 * com a quantidade e a descricao daquele dia, e o pacote so diz quanto vale a
 * PROXIMA venda. E a mesma regra do custo do mapa.
 */
export async function atualizarPacote(id: string, dados: unknown, updatedAtOriginal: Date) {
  const sessao = await exigirSessao("atualizar");
  const validado = pacoteSchema.parse(dados);

  return db.transaction(async (tx) => {
    const [anterior] = await tx
      .select()
      .from(precosPacotes)
      .where(and(eq(precosPacotes.id, id), eq(precosPacotes.is_deleted, false)))
      .limit(1);

    if (!anterior) throw new RecusaDeRegra("Pacote nao encontrado");

    const resultado = await tx
      .update(precosPacotes)
      .set({
        nome: validado.nome,
        creditos: validado.creditos,
        preco: validado.preco,
        publico: validado.publico,
        updated_at: new Date(),
        modified_by: sessao.userId,
      })
      .where(
        and(
          eq(precosPacotes.id, id),
          eq(precosPacotes.updated_at, updatedAtOriginal),
          eq(precosPacotes.is_deleted, false),
        ),
      )
      .returning();

    if (resultado.length === 0) {
      throw new RecusaDeRegra(
        "Este pacote foi alterado por outra aba. Recarregue a pagina e tente de novo.",
      );
    }

    await registrarAuditoria(
      {
        userId: sessao.userId,
        acao: "atualizar",
        tabela: "precos_pacotes",
        registroId: id,
        detalhes: `Alterou o pacote ${anterior.nome}: ${anterior.creditos} creditos por R$ ${anterior.preco} -> ${resultado[0]!.creditos} por R$ ${resultado[0]!.preco}`,
        dadosAnteriores: anterior,
        dadosNovos: resultado[0],
      },
      tx,
    );

    return resultado[0]!;
  });
}

/**
 * Descontinua um pacote. Delete logico, nunca apaga a linha.
 *
 * As vendas antigas continuam validas e explicadas pelo extrato — o que muda e
 * que o pacote some da vitrine e a venda deixa de aceitar o nome
 * (`lib/precos.ts:pacotePorNome` so enxerga linha ativa).
 *
 * O ultimo pacote ativo nao sai: sem nenhum pacote, `criar` facilitador e
 * `venderCreditos` ficam sem entrada valida e o admin perde a unica porta de
 * creditar alguem — inclusive a de desfazer isto.
 */
export async function excluirPacote(id: string) {
  const sessao = await exigirSessao("deletar");

  return db.transaction(async (tx) => {
    const ativos = await tx
      .select({ id: precosPacotes.id })
      .from(precosPacotes)
      .where(eq(precosPacotes.is_deleted, false));

    const [anterior] = await tx
      .select()
      .from(precosPacotes)
      .where(and(eq(precosPacotes.id, id), eq(precosPacotes.is_deleted, false)))
      .limit(1);

    if (!anterior) throw new RecusaDeRegra("Pacote nao encontrado");
    if (ativos.length <= 1) {
      throw new RecusaDeRegra(
        "Este e o unico pacote ativo. Sem nenhum pacote nao ha como vender credito nem cadastrar parceiro — crie o substituto antes de descontinuar este.",
      );
    }

    const [excluido] = await tx
      .update(precosPacotes)
      .set({
        is_deleted: true,
        deleted_at: new Date(),
        updated_at: new Date(),
        modified_by: sessao.userId,
      })
      .where(and(eq(precosPacotes.id, id), eq(precosPacotes.is_deleted, false)))
      .returning();

    await registrarAuditoria(
      {
        userId: sessao.userId,
        acao: "excluir",
        tabela: "precos_pacotes",
        registroId: id,
        detalhes: `Descontinuou (logico) o pacote ${anterior.nome}`,
        dadosAnteriores: anterior,
      },
      tx,
    );

    return excluido!;
  });
}

// ---------------------------------------------------------------------------
// Portas de tela
// ---------------------------------------------------------------------------
//
// Recusa de regra e erro de validacao voltam como objeto; falha de verdade
// continua subindo. Mesmo contrato de `actions/recusa.ts:paraTela`, e pelo
// mesmo motivo: uma Server Action que lanca entrega ao navegador um digest
// opaco em producao, e "revenda minima maior que a maxima" chegaria a tela com
// a mesma cara de "o banco caiu".

export async function atualizarRelatorioPelaTela(
  id: string,
  dados: unknown,
  updatedAtOriginal: Date,
) {
  return paraTela(TELA, () => atualizarRelatorio(id, dados, updatedAtOriginal));
}

export async function criarPacotePelaTela(dados: unknown) {
  return paraTela(TELA, () => criarPacote(dados));
}

export async function atualizarPacotePelaTela(
  id: string,
  dados: unknown,
  updatedAtOriginal: Date,
) {
  return paraTela(TELA, () => atualizarPacote(id, dados, updatedAtOriginal));
}

export async function excluirPacotePelaTela(id: string) {
  return paraTela(TELA, () => excluirPacote(id));
}
