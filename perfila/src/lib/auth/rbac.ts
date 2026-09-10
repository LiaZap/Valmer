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
  "turmas:criar": ["admin", "facilitador"],
  "turmas:ler": ["admin", "facilitador"],
  "turmas:atualizar": ["admin", "facilitador"],
  "turmas:deletar": ["admin", "facilitador"],
  // Os tres cadastros do parceiro. Mesma linha de assessments e turmas: o
  // facilitador pode as quatro acoes sobre o que e DELE, e o recorte por dono
  // continua sendo o WHERE de cada action, nao esta tabela.
  "clientes:criar": ["admin", "facilitador"],
  "clientes:ler": ["admin", "facilitador"],
  "clientes:atualizar": ["admin", "facilitador"],
  "clientes:deletar": ["admin", "facilitador"],
  "cargos:criar": ["admin", "facilitador"],
  "cargos:ler": ["admin", "facilitador"],
  "cargos:atualizar": ["admin", "facilitador"],
  "cargos:deletar": ["admin", "facilitador"],
  "devolutivas:criar": ["admin", "facilitador"],
  "devolutivas:ler": ["admin", "facilitador"],
  "devolutivas:atualizar": ["admin", "facilitador"],
  "devolutivas:deletar": ["admin", "facilitador"],
  "auditoria:ler": ["admin"],
  // Perfil e a PROPRIA linha de quem esta logado, e nao o recurso "usuarios" —
  // que e o parceiro visto pelo admin, com papel, saldo e situacao. Os dois
  // papeis mudam o proprio cadastro; nenhum deles mexe no do outro, e quem
  // garante isso e o `id = sessao.userId` no WHERE da action, nao esta linha.
  "perfil:atualizar": ["admin", "facilitador"],
  // O curso e escrito e publicado pelo dono da plataforma. O facilitador ve a
  // vitrine em /facilitador/cursos, que nao passa por estas permissoes, e o
  // aluno entra por outra plataforma, com login proprio.
  "cursos:criar": ["admin"],
  "cursos:ler": ["admin"],
  "cursos:atualizar": ["admin"],
  "usuarios:criar": ["admin"],
  "usuarios:ler": ["admin"],
  "usuarios:atualizar": ["admin"],
  "usuarios:deletar": ["admin"],
};

export function temPermissao(papel: Papel, recurso: string, acao: Acao): boolean {
  return permissoes[`${recurso}:${acao}`]?.includes(papel) ?? false;
}
