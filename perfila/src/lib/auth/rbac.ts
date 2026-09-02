import type { Papel } from "./sessao";

export type Acao = "criar" | "ler" | "atualizar" | "deletar";

/**
 * Matriz de permissoes por papel.
 *
 * O facilitador pode tudo sobre os assessments DELE. O recorte por dono nao
 * mora aqui: e o WHERE de cada action que limita as linhas ao facilitador da
 * sessao. Esta tabela responde "pode a acao?", nao "pode nesta linha?".
 */
const permissoes: Record<string, Papel[]> = {
  "assessments:criar": ["admin", "facilitador"],
  "assessments:ler": ["admin", "facilitador"],
  "assessments:atualizar": ["admin", "facilitador"],
  "assessments:deletar": ["admin", "facilitador"],
  "auditoria:ler": ["admin"],
  "usuarios:criar": ["admin"],
  "usuarios:ler": ["admin"],
  "usuarios:atualizar": ["admin"],
  "usuarios:deletar": ["admin"],
};

export function temPermissao(papel: Papel, recurso: string, acao: Acao): boolean {
  return permissoes[`${recurso}:${acao}`]?.includes(papel) ?? false;
}
