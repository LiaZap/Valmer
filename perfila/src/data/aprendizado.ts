/** Cursos, mentores e a trilha de EAD. */

/**
 * Paleta de capas. São tons do próprio sistema (nunca cores avulsas),
 * aplicados em rodízio para diferenciar os cards sem poluir a tela.
 */
const CAPAS = [
  'var(--color-ink)',
  'var(--color-accent)',
  'var(--color-text-secondary)',
  'var(--color-accent-hover)',
  'var(--color-text-muted)',
  'var(--color-info)',
]

export type Curso = {
  title: string
  desc: string
  /** Sigla exibida na miniatura do dashboard. */
  abbr: string
  capa: string
}

const cursosBase: Omit<Curso, 'capa'>[] = [
  {
    title: 'Masterclass Anual',
    desc: 'Imersão online com Iane Parente e convidados, que vai impulsionar a sua carreira como analista.',
    abbr: 'MA',
  },
  {
    title: 'Curso de Relacionamentos',
    desc: 'Descubra, na prática, como lidar com as diferenças e tornar a comunicação mais eficaz.',
    abbr: 'CR',
  },
  {
    title: 'Curso de Liderança',
    desc: 'Treinamento baseado no best-seller Decifre e Influencie Pessoas, para extrair o máximo do seu time.',
    abbr: 'CL',
  },
  {
    title: 'Manual do Vendedor',
    desc: 'Método prático para vender mais com base no perfil comportamental do cliente.',
    abbr: 'MV',
  },
  {
    title: 'Contratação Estratégica',
    desc: 'Como usar o DISC para contratar as pessoas certas para os cargos certos.',
    abbr: 'CE',
  },
  {
    title: 'Coach de Carreira',
    desc: 'Entenda o comportamento do seu coachee e crie novas oportunidades de negócios.',
    abbr: 'CC',
  },
]

export const cursos: Curso[] = cursosBase.map((curso, index) => ({
  ...curso,
  capa: CAPAS[index % CAPAS.length]!,
}))

/** Os três primeiros cursos aparecem resumidos no Dashboard. */
export const cursosDestaque = cursos.slice(0, 3)

export type Mentor = {
  name: string
  role: string
}

export const mentores: Mentor[] = [
  { name: 'Iane Parente', role: 'Especializada em Perfil Comportamental' },
  { name: 'Elyano Veras', role: 'Especializado em treinamentos e conselheiro de negócios' },
  { name: 'Dani Pires', role: 'Especializada em treinamentos e perfis comportamentais' },
]

export type AulaEad = {
  /** Título já com o prefixo do módulo, quando houver. */
  title: string
  /** Marcador do círculo: número da aula (ou check, quando concluída). */
  marcador: string
  concluida: boolean
}

const AULAS = [
  'Apresentação',
  'Introdução à Teoria DISC',
  'Gráficos DISC',
  'Tipos Psicológicos',
  'Teoria de Valores',
  'Encerramento',
  'Vendas',
]

export const aulasEad: AulaEad[] = AULAS.map((title, index) => ({
  // As seis primeiras pertencem a módulos numerados; a última é avulsa.
  title: index < 6 ? `Módulo 0${index + 1} · ${title}` : title,
  marcador: index === 0 ? '✓' : String(index + 1),
  concluida: index === 0,
}))

export const eadProgresso = {
  concluidas: aulasEad.filter((aula) => aula.concluida).length,
  total: aulasEad.length,
}
