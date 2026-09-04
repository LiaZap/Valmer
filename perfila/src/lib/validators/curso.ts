import { z } from "zod";

/**
 * Curso criado pelo admin.
 *
 * O titulo e a descricao vao para a vitrine que o aluno le em outra
 * plataforma, entao os limites sao de tela, e nao do banco: titulo que nao
 * cabe no card e cortado no meio de uma palavra.
 */
export const criarCursoSchema = z.object({
  titulo: z.string().trim().min(3, "Titulo muito curto").max(120, "Titulo muito longo"),
  descricao: z
    .string()
    .trim()
    .min(10, "Descreva o curso em pelo menos uma frase")
    .max(400, "Descricao muito longa"),
  conteudo: z
    .string()
    .trim()
    .min(10, "O conteudo do curso nao pode ficar vazio")
    .max(20000, "Conteudo muito longo"),
});

export type CriarCurso = z.infer<typeof criarCursoSchema>;
