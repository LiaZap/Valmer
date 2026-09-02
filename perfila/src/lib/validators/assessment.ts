import { z } from "zod";

/**
 * Formatos criticos por regex.
 *
 * O nome e o e-mail do avaliado vao impressos na capa do relatorio e no
 * convite por e-mail. Errar aqui manda o link para o vazio e queima credito
 * do facilitador, entao os dois passam por regex antes de qualquer gravacao.
 */
const NOME_RE = /^\p{L}[\p{L}\s.'-]{2,}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

const nome = z
  .string()
  .trim()
  .min(3, "Nome muito curto")
  .max(120, "Nome muito longo")
  .regex(NOME_RE, "Nome deve conter apenas letras, espacos, ponto, hifen e apostrofo");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .max(160, "E-mail muito longo")
  .regex(EMAIL_RE, "E-mail invalido");

/** Criacao: o tipo de relatorio define quantos creditos a conta consome. */
export const criarAssessmentSchema = z.object({
  avaliado_nome: nome,
  avaliado_email: email,
  tipo_relatorio: z.enum(["S1", "S2", "S3", "S4"]),
  /** Opcional: o admin aplica em nome de um facilitador. */
  facilitador_id: z.string().uuid().optional(),
});

/**
 * Edicao: so nome e e-mail.
 *
 * O tipo de relatorio nao entra. Ele ja consumiu credito na criacao, e
 * troca-lo exigiria estornar e cobrar de novo. Para mudar de nivel, cancele
 * o assessment e crie outro.
 */
export const atualizarAssessmentSchema = z.object({
  avaliado_nome: nome,
  avaliado_email: email,
});

export type CriarAssessment = z.infer<typeof criarAssessmentSchema>;
export type AtualizarAssessment = z.infer<typeof atualizarAssessmentSchema>;
