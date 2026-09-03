/**
 * Leituras das telas de gestao: portal do parceiro e painel do admin.
 *
 * Devolve os dados no MESMO formato que `src/data/facilitadores.ts` entregava
 * ao prototipo (`Facilitador`, `Assessment`, `Transacao`), entao as tabelas e
 * os cartoes continuam iguais — o que muda e de onde os numeros vem. Enquanto
 * o formato for o mesmo, trocar a fonte nao arrasta a interface junto.
 *
 * Nao e "use server": quem chama sao Server Components, que ja rodam no
 * servidor. Transformar leitura de tela em endpoint POST publico so aumentaria
 * a superficie exposta.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { assessments, creditosTransacoes, usuarios } from "@/lib/db/schema";
import { getSession, temPermissao, type Sessao } from "@/lib/auth";
import { initials } from "@/lib/text";
import type { Assessment, Facilitador, Transacao } from "@/data/facilitadores";
import type { FatorDisc } from "@/data/dna";

const DATA_BR = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
});

function data(valor: Date): string {
  return DATA_BR.format(valor);
}

async function exigirSessao(recurso: string): Promise<Sessao> {
  const sessao = await getSession();
  if (!sessao) throw new Error("Nao autenticado");
  if (!temPermissao(sessao.papel, recurso, "ler")) {
    throw new Error(`Sem permissao para ler ${recurso}`);
  }
  return sessao;
}

type LinhaAssessment = typeof assessments.$inferSelect;

/**
 * Converte a linha do banco no formato que as telas esperam.
 *
 * Os contadores so entram quando os quatro existem: um assessment em andamento
 * tem os quatro nulos, e montar `{D: 0, I: 0, S: 0, C: 0}` faria a lista exibir
 * "Perfil DI" para quem ainda nao respondeu nada.
 */
function paraAssessment(linha: LinhaAssessment): Assessment {
  const { contador_d, contador_i, contador_s, contador_c } = linha;
  const completo =
    contador_d !== null && contador_i !== null && contador_s !== null && contador_c !== null;

  const contadores: Record<FatorDisc, number> | undefined = completo
    ? { D: contador_d, I: contador_i, S: contador_s, C: contador_c }
    : undefined;

  // Expiracao e DERIVADA de `expira_em`, nunca lida de um campo gravado, e
  // concluido tem precedencia sobre vencido: quem respondeu no prazo nao pode
  // aparecer como "expirado" no dia seguinte. Mesma regra de
  // `actions/avaliacao.ts` — la ela nao da para importar, porque aquele modulo
  // e "use server" e so exporta actions.
  const situacao: Assessment["situacao"] =
    linha.situacao !== "concluido" && linha.expira_em.getTime() < Date.now()
      ? "expirado"
      : linha.situacao;

  return {
    id: linha.id,
    token: linha.token,
    facilitadorId: linha.facilitador_id,
    avaliadoNome: linha.avaliado_nome,
    avaliadoEmail: linha.avaliado_email,
    tipoRelatorio: linha.tipo_relatorio,
    situacao,
    creditosUsados: linha.creditos_usados,
    criadoEm: data(linha.created_at),
    expiraEm: data(linha.expira_em),
    concluidoEm: linha.concluido_em ? data(linha.concluido_em) : undefined,
    contadores,
  };
}

function paraFacilitador(linha: typeof usuarios.$inferSelect): Facilitador {
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    empresa: linha.empresa ?? "",
    telefone: linha.telefone ?? "",
    creditos: linha.creditos,
    ativo: linha.ativo,
    criadoEm: data(linha.created_at),
    iniciais: initials(linha.nome),
  };
}

/**
 * Assessments visiveis para quem esta logado.
 *
 * O recorte por dono e o mesmo de `actions/assessments.ts`: o facilitador ve
 * os dele, o admin ve os de todos os parceiros. A regra fica no WHERE, e nao
 * numa filtragem depois da consulta, para nao existir caminho em que a linha
 * de outro chegue a ser carregada.
 */
export async function assessmentsVisiveis(): Promise<Assessment[]> {
  const sessao = await exigirSessao("assessments");

  const linhas = await db
    .select()
    .from(assessments)
    .where(
      and(
        eq(assessments.is_deleted, false),
        sessao.papel === "admin" ? undefined : eq(assessments.facilitador_id, sessao.userId),
      ),
    )
    .orderBy(desc(assessments.created_at));

  return linhas.map(paraAssessment);
}

/** Os facilitadores, para o painel do admin. */
export async function listarFacilitadores(): Promise<Facilitador[]> {
  await exigirSessao("usuarios");

  const linhas = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.is_deleted, false), eq(usuarios.papel, "facilitador")))
    .orderBy(desc(usuarios.created_at));

  return linhas.map(paraFacilitador);
}

/** Extrato de creditos de todos os parceiros, do mais novo ao mais antigo. */
export async function listarTransacoes(): Promise<Transacao[]> {
  await exigirSessao("usuarios");

  const linhas = await db
    .select()
    .from(creditosTransacoes)
    .where(eq(creditosTransacoes.is_deleted, false))
    .orderBy(desc(creditosTransacoes.created_at));

  return linhas.map((linha) => ({
    id: linha.id,
    facilitadorId: linha.usuario_id,
    tipo: linha.tipo,
    quantidade: linha.quantidade,
    descricao: linha.descricao,
    data: data(linha.created_at),
  }));
}

/** A conta de quem esta logado: saldo e dados do cabecalho das telas. */
export async function contaAtual(): Promise<Facilitador> {
  const sessao = await getSession();
  if (!sessao) throw new Error("Nao autenticado");

  const [linha] = await db
    .select()
    .from(usuarios)
    .where(and(eq(usuarios.id, sessao.userId), eq(usuarios.is_deleted, false)))
    .limit(1);

  if (!linha) throw new Error("Usuario da sessao nao encontrado");

  return paraFacilitador(linha);
}

/**
 * Nome de exibicao por id de facilitador, para a coluna do painel do admin.
 *
 * Uma consulta so para a lista inteira: buscar um por linha faria a tela do
 * admin disparar uma consulta por assessment exibido.
 */
export async function empresasPorId(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const linhas = await db
    .select({ id: usuarios.id, empresa: usuarios.empresa, nome: usuarios.nome })
    .from(usuarios)
    .where(and(inArray(usuarios.id, ids), eq(usuarios.is_deleted, false)));

  return Object.fromEntries(linhas.map((linha) => [linha.id, linha.empresa ?? linha.nome]));
}
