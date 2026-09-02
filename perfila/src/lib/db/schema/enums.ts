/**
 * Enums do dominio, no banco.
 *
 * Ficam como tipo do Postgres, e nao como texto validado so na aplicacao:
 * a restricao vale para qualquer caminho de escrita, inclusive um INSERT
 * manual no psql.
 */
import { pgEnum } from "drizzle-orm/pg-core";

/** Quem entra na plataforma. O admin e um so: o dono. */
export const papelUsuario = pgEnum("papel_usuario", ["admin", "facilitador"]);

/** Fatores DISC. Espelha FatorDisc em src/data/dna.ts. */
export const fatorDisc = pgEnum("fator_disc", ["D", "I", "S", "C"]);

/** Niveis de relatorio. Cada um consome uma quantidade de creditos. */
export const tipoRelatorio = pgEnum("tipo_relatorio", ["S1", "S2", "S3", "S4"]);

/** Ciclo de vida do link de avaliacao. */
export const situacaoAssessment = pgEnum("situacao_assessment", [
  "pendente",
  "em_andamento",
  "concluido",
  "expirado",
]);

/** Movimentos do saldo de creditos do facilitador. */
export const tipoTransacao = pgEnum("tipo_transacao", ["compra", "uso", "estorno", "bonus"]);
