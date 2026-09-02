/**
 * Inventário comportamental
 * -------------------------
 * São 10 grupos de 4 adjetivos. O respondente ordena cada grupo do
 * adjetivo com que MAIS se identifica (topo) ao que MENOS se
 * identifica (base).
 *
 * O mesmo conjunto é respondido três vezes, com enquadramentos
 * diferentes — daí as três etapas.
 *
 * ⚠️ As descrições dos adjetivos abaixo são provisórias, escritas para
 * o protótipo funcionar. Substitua pelos textos oficiais do
 * instrumento antes de usar com respondentes reais.
 */

export type Adjetivo = {
  termo: string
  descricao: string
}

export type GrupoInventario = {
  numero: number
  adjetivos: Adjetivo[]
}

export const gruposInventario: GrupoInventario[] = [
  {
    numero: 1,
    adjetivos: [
      { termo: 'Consistente', descricao: 'Mantém o mesmo padrão de conduta e entrega ao longo do tempo.' },
      { termo: 'Confiante', descricao: 'Acredita na própria capacidade e age com segurança.' },
      { termo: 'Preciso(a)', descricao: 'Trabalha com exatidão e evita margem de erro.' },
      { termo: 'Determinado(a)', descricao: 'Persegue o objetivo até concluí-lo, apesar dos obstáculos.' },
    ],
  },
  {
    numero: 2,
    adjetivos: [
      { termo: 'Persuasivo(a)', descricao: 'Convence pelo argumento e pelo entusiasmo.' },
      { termo: 'Direto(a)', descricao: 'Vai ao ponto, sem rodeios.' },
      { termo: 'Cuidadoso(a)', descricao: 'Avalia riscos e detalhes antes de agir.' },
      { termo: 'Compreensivo(a)', descricao: 'Considera o ponto de vista e o momento do outro.' },
    ],
  },
  {
    numero: 3,
    adjetivos: [
      { termo: 'Otimista', descricao: 'Enxerga primeiro a possibilidade, não o obstáculo.' },
      { termo: 'Paciente', descricao: 'Sustenta o ritmo sem se irritar com a demora.' },
      { termo: 'Lógico(a)', descricao: 'Decide por raciocínio e evidência, não por impulso.' },
      { termo: 'Assertivo(a)', descricao: 'Diz o que pensa com clareza, sem agredir.' },
    ],
  },
  {
    numero: 4,
    adjetivos: [
      { termo: 'Organizado(a)', descricao: 'Mantém método, ordem e rastreabilidade no trabalho.' },
      { termo: 'Executor(a)', descricao: 'Transforma decisão em ação rapidamente.' },
      { termo: 'Persistente', descricao: 'Insiste mesmo quando o resultado demora a aparecer.' },
      { termo: 'Inspirador(a)', descricao: 'Mobiliza pessoas pelo exemplo e pela energia.' },
    ],
  },
  {
    numero: 5,
    adjetivos: [
      { termo: 'Exato(a)', descricao: 'Busca o resultado correto, com rigor de medida.' },
      { termo: 'Flexível', descricao: 'Adapta-se a mudanças de rota sem perder o foco.' },
      { termo: 'Decidido(a)', descricao: 'Escolhe com rapidez e assume a consequência.' },
      { termo: 'Estável', descricao: 'Mantém equilíbrio emocional sob pressão.' },
    ],
  },
  {
    numero: 6,
    adjetivos: [
      { termo: 'Disciplinado(a)', descricao: 'Cumpre o combinado e respeita processos.' },
      { termo: 'Enérgico(a)', descricao: 'Imprime ritmo forte às próprias atividades.' },
      { termo: 'Calmo(a)', descricao: 'Reage com serenidade em situações tensas.' },
      { termo: 'Entusiasmado(a)', descricao: 'Contagia o grupo com empolgação genuína.' },
    ],
  },
  {
    numero: 7,
    adjetivos: [
      { termo: 'Expressivo(a)', descricao: 'Comunica ideias e emoções com facilidade.' },
      { termo: 'Firme', descricao: 'Sustenta a posição diante de pressão contrária.' },
      { termo: 'Formal', descricao: 'Preza pelo protocolo e pela conduta adequada.' },
      { termo: 'Amável', descricao: 'Trata as pessoas com gentileza e consideração.' },
    ],
  },
  {
    numero: 8,
    adjetivos: [
      { termo: 'Criativo(a)', descricao: 'Encontra soluções fora do caminho óbvio.' },
      { termo: 'Detalhista', descricao: 'Percebe o que passa despercebido aos outros.' },
      { termo: 'Visionário(a)', descricao: 'Antecipa cenários e enxerga longe.' },
      { termo: 'Ponderado(a)', descricao: 'Pesa prós e contras antes de se posicionar.' },
    ],
  },
  {
    numero: 9,
    adjetivos: [
      { termo: 'Convincente', descricao: 'Conquista adesão para as próprias ideias.' },
      { termo: 'Audacioso(a)', descricao: 'Assume riscos calculados em busca de resultado.' },
      { termo: 'Planejador(a)', descricao: 'Antecipa etapas e organiza o caminho até a meta.' },
      { termo: 'Cauteloso(a)', descricao: 'Avança com prudência, evitando exposição desnecessária.' },
    ],
  },
  {
    numero: 10,
    adjetivos: [
      { termo: 'Leal', descricao: 'Mantém compromisso com pessoas e com a organização.' },
      { termo: 'Sociável', descricao: 'Aproxima-se das pessoas com naturalidade.' },
      { termo: 'Exigente', descricao: 'Estabelece padrão alto para si e para o time.' },
      { termo: 'Conservador(a)', descricao: 'Prefere o caminho testado ao experimento.' },
    ],
  },
]

export type Etapa = {
  numero: number
  /** Rótulo exibido no cabeçalho do card. */
  titulo: string
  /** O que o respondente deve considerar ao ordenar nesta etapa. */
  instrucoes: string[]
  /** Etapas 1 e 2 aplicam os 10 grupos; a 3 tem formato próprio. */
  usaGrupos: boolean
}

export const etapas: Etapa[] = [
  {
    numero: 1,
    titulo: 'Etapa 01',
    instrucoes: [
      'Ordene os adjetivos retratando a forma como você verdadeiramente é — e não como gostaria de ser.',
    ],
    usaGrupos: true,
  },
  {
    numero: 2,
    titulo: 'Etapa 02',
    instrucoes: [
      'Seguindo a mesma lógica, preencha novamente o inventário, agora retratando a forma como você acredita que as pessoas de seu convívio pessoal e profissional esperam que você seja para ter um melhor desempenho.',
      'Desta vez, o objetivo é posicionar os adjetivos na ordem retratando como os outros desejam que você seja e não como você verdadeiramente é.',
    ],
    usaGrupos: true,
  },
  {
    numero: 3,
    titulo: 'Etapa 03',
    instrucoes: ['Última etapa do inventário.'],
    usaGrupos: true,
  },
]

/** Passos da tela de instruções da Etapa 01. */
export const instrucoesEtapa1 = [
  'Ao clicar em Iniciar você encontrará 10 grupos com quatro adjetivos cada um;',
  'Leia atentamente um grupo de cada vez e defina quais são os adjetivos com os quais você mais se identifica;',
  'Clique sobre cada um dos adjetivos, arraste-os e ordene seguindo os critérios abaixo:',
  'Você pode arrastar ou usar as setas para alterar a ordem. O botão de ajuda mostra a descrição do adjetivo.',
  'Procure ser sincero e intuitivo, não pense muito. O objetivo é retratar a forma como você verdadeiramente é — e não como gostaria de ser.',
]

export const criteriosOrdenacao = [
  'O adjetivo na primeira posição é aquele com o qual você mais se identifica;',
  'O segundo, logo abaixo, é o que você mais se identifica em seguida;',
  'Continue até o quarto e último, na parte inferior, que representa aquele com o qual você menos se identifica.',
]

/** Idiomas oferecidos ao respondente. */
export const idiomasInventario = [
  { codigo: 'pt-BR', nome: 'Português (Brasil)', bandeira: '🇧🇷' },
  { codigo: 'en-US', nome: 'English (United States)', bandeira: '🇺🇸' },
  { codigo: 'es-ES', nome: 'Español', bandeira: '🇪🇸' },
]
