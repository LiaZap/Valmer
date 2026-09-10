/**
 * O video da aula: assinar o envio e confirmar que ele chegou.
 *
 * POR QUE O ARQUIVO NAO PASSA POR AQUI
 * ------------------------------------
 * `enviarImagem` recebe o `File` dentro da Server Action porque foto de rosto
 * cabe em 2 MB. Aula nao cabe: o corpo de uma Server Action tem teto (1 MB por
 * padrao no Next) e um arquivo de centenas de MB seria recusado antes de o
 * upload comecar. Passar o video por dentro do Node ainda transformaria a app
 * em servidor de streaming — o gargalo deixaria de ser o banco.
 *
 * Entao sao DOIS passos, e o arquivo nao toca no servidor em nenhum deles:
 *
 *   1. `assinar` — o servidor confere a sessao, escolhe a chave e devolve uma
 *      URL de PUT com prazo curto;
 *   2. o navegador manda o arquivo direto para o bucket;
 *   3. `confirmar` — o servidor confere que o objeto ESTA la e so entao grava a
 *      chave na linha da aula.
 *
 * A ALTERNATIVA DESCARTADA foi guardar o endereco de um video hospedado fora
 * (o dado antigo dizia "Vimeo"). Ela e menos codigo, mas nao entrega o pedido:
 * o cliente pediu "colocar para subir os videos", e colar link de Vimeo nao e
 * subir video. Alem disso `docs/infra.md`, Etapa 6b, ja provisionou o prefixo
 * `cursos/videos/` no bucket e ja decidiu que "o video sai do MinIO direto para
 * o navegador" — escolher o link seria contrariar infra que ja esta de pe.
 *
 * O RISCO DE DEPLOY FICA CONTIDO porque nada do build depende do MinIO: a
 * assinatura acontece no clique, e a LEITURA sai por `urlAssinadaOuNula`, que
 * devolve `null` quando o armazenamento nao responde. Ambiente sem MinIO
 * configurado mostra a aula como pendente em vez de derrubar a pagina — que e
 * exatamente o estado que a aula sem gravacao ja tem.
 *
 * URL assinada aceita requisicao por faixa, entao arrastar a barra do player
 * continua funcionando mesmo com o bucket privado.
 */
"use server";

import { and, eq } from "drizzle-orm";
import { ZodError } from "zod";

import { db } from "@/lib/db";
import { cursoAulas } from "@/lib/db/schema";
import { getSession, temPermissao, type Acao, type Sessao } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/audit/logger";
import {
  apagarObjeto,
  assinarEnvioDeVideo,
  tamanhoDoObjeto,
  TAMANHO_MAXIMO_VIDEO,
} from "@/lib/storage";
import { assinarVideoSchema, confirmarVideoSchema } from "@/lib/validators/ead";
import { paraTela, RecusaDeRegra } from "./recusa";

const TELA = "/admin/cursos";

async function exigirSessao(acao: Acao): Promise<Sessao> {
  const sessao = await getSession();
  if (!sessao) throw new Error("Nao autenticado");
  if (!temPermissao(sessao.papel, "cursos", acao)) {
    throw new Error(`Sem permissao para ${acao} cursos`);
  }
  return sessao;
}

/** A pasta do video de uma aula. E do codigo, nunca do formulario. */
function prefixoDaAula(aulaId: string): string {
  return `cursos/videos/${aulaId}`;
}

/**
 * Assina o envio de UMA aula.
 *
 * A sessao e exigida na PRIMEIRA linha, e nao depois: Server Action e um POST
 * publico, e uma que assina envio antes de saber quem pediu e um deposito
 * aberto na internet — qualquer um enche o bucket. Mesma nota de
 * `perfil.trocarFoto`.
 *
 * A aula precisa EXISTIR antes de assinar, porque a chave nasce debaixo do id
 * dela. Isso e o que garante, na hora de confirmar, que o objeto que vai virar
 * linha e o objeto que este envio criou.
 */
export async function assinarVideo(dados: unknown) {
  await exigirSessao("atualizar");
  const validado = assinarVideoSchema.parse(dados);

  const [aula] = await db
    .select({ id: cursoAulas.id })
    .from(cursoAulas)
    .where(and(eq(cursoAulas.id, validado.aula_id), eq(cursoAulas.is_deleted, false)))
    .limit(1);

  if (!aula) throw new RecusaDeRegra("Aula nao encontrada");

  // Quem recusa formato e tamanho e `lib/storage.ts`, com RecusaDeRegra
  // legivel: e la que mora a lista de tipos que o bucket aceita.
  const { chave, url } = await assinarEnvioDeVideo({
    prefixo: prefixoDaAula(validado.aula_id),
    tipo: validado.tipo,
    tamanho: validado.tamanho,
  });

  // Sem trilha aqui de proposito: assinar nao muda nada. O que a auditoria
  // precisa registrar e a aula ganhando video, e isso e `confirmar`. Uma linha
  // por clique em "escolher arquivo" so encheria a trilha de ruido.
  return { chave, url };
}

/**
 * Grava a chave na aula, depois de conferir que o objeto chegou.
 *
 * TRES CONFERIDAS, e nenhuma delas confia no navegador:
 *
 * 1. a chave tem que estar debaixo da pasta DESTA aula. Sem isso, um pedido
 *    montado a mao apontaria a aula para qualquer objeto do bucket;
 * 2. o objeto tem que EXISTIR. Um PUT interrompido no meio deixaria a linha
 *    apontando para uma chave que nunca existiu, e a aula apareceria publicada
 *    com um video que da 404;
 * 3. o tamanho REAL tem que caber no teto. URL assinada de PUT nao impoe
 *    limite — o teto declarado em `assinar` e so o primeiro filtro —, entao o
 *    que passou e apagado aqui em vez de virar linha.
 *
 * A ORDEM e a mesma de `perfil.trocarFoto`: sobe a nova, grava a chave, e so
 * depois do COMMIT apaga a antiga. Apagar antes deixaria a aula sem video
 * nenhum se a gravacao falhasse no meio. O preco e um objeto orfao quando o
 * UPDATE falha depois do envio — barato perto de perder a gravacao.
 */
export async function confirmarVideo(dados: unknown, updatedAtOriginal: Date) {
  const sessao = await exigirSessao("atualizar");
  const validado = confirmarVideoSchema.parse(dados);

  if (!validado.chave.startsWith(`${prefixoDaAula(validado.aula_id)}/`)) {
    throw new RecusaDeRegra("Envio nao confere com a aula. Recarregue a pagina e tente de novo.");
  }

  const tamanho = await tamanhoDoObjeto(validado.chave);
  if (tamanho === null) {
    throw new RecusaDeRegra(
      "O envio nao chegou ao armazenamento. Confira a conexao e envie o video de novo.",
    );
  }

  if (tamanho > TAMANHO_MAXIMO_VIDEO) {
    await apagarObjeto(validado.chave);
    const gb = (TAMANHO_MAXIMO_VIDEO / 1024 / 1024 / 1024).toFixed(0);
    throw new RecusaDeRegra(`Arquivo maior que ${gb} GB. Comprima o video antes de enviar.`);
  }

  const { anterior, atualizada } = await db.transaction(async (tx) => {
    const [aula] = await tx
      .select()
      .from(cursoAulas)
      .where(and(eq(cursoAulas.id, validado.aula_id), eq(cursoAulas.is_deleted, false)))
      .limit(1);

    if (!aula) throw new RecusaDeRegra("Aula nao encontrada");

    const resultado = await tx
      .update(cursoAulas)
      .set({
        video_chave: validado.chave,
        duracao_segundos: validado.duracao_segundos ?? null,
        updated_at: new Date(),
        modified_by: sessao.userId,
      })
      .where(
        and(
          eq(cursoAulas.id, validado.aula_id),
          eq(cursoAulas.updated_at, updatedAtOriginal),
          eq(cursoAulas.is_deleted, false),
        ),
      )
      .returning();

    if (resultado.length === 0) {
      throw new RecusaDeRegra(
        "Esta aula foi alterada por outra aba. Recarregue a pagina e tente de novo.",
      );
    }

    await registrarAuditoria(
      {
        userId: sessao.userId,
        acao: "atualizar",
        tabela: "curso_aulas",
        registroId: validado.aula_id,
        detalhes:
          `${aula.video_chave ? "Trocou" : "Enviou"} o video da aula "${aula.titulo}" ` +
          `(${(tamanho / 1024 / 1024).toFixed(1)} MB)`,
        dadosAnteriores: aula,
        dadosNovos: resultado[0],
      },
      tx,
    );

    return { anterior: aula, atualizada: resultado[0]! };
  });

  // Fora da transacao: `apagarObjeto` fala com o bucket, e o bucket nao volta
  // atras num ROLLBACK. Se falhar, ele so registra no log — a aula ja esta com
  // o video novo, e a tela nao pode dizer "nao deu" para uma troca que deu.
  await apagarObjeto(anterior.video_chave);

  return atualizada;
}

// ---------------------------------------------------------------------------
// Portas de tela
// ---------------------------------------------------------------------------

/**
 * A assinatura NAO passa por `paraTela`.
 *
 * `paraTela` devolve `{ ok }` e revalida o caminho — e aqui nada mudou ainda,
 * entao revalidar seria um render inteiro a toa no meio do fluxo de envio. A
 * recusa e traduzida a mao, no mesmo contrato, para a tela mostrar "formato nao
 * aceito" em vez do digest opaco de producao.
 */
export async function assinarVideoPelaTela(
  dados: unknown,
): Promise<{ ok: true; chave: string; url: string } | { ok: false; erro: string }> {
  try {
    const { chave, url } = await assinarVideo(dados);
    return { ok: true, chave, url };
  } catch (erro) {
    if (erro instanceof RecusaDeRegra) return { ok: false, erro: erro.message };
    if (erro instanceof ZodError) {
      return { ok: false, erro: erro.issues[0]?.message ?? "Dados invalidos" };
    }
    throw erro;
  }
}

export async function confirmarVideoPelaTela(dados: unknown, updatedAt: Date) {
  return paraTela(TELA, () => confirmarVideo(dados, updatedAt));
}
