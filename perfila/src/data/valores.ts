/**
 * Etapa 03 — Inventário de Valores
 * --------------------------------
 * 10 grupos de 6 frases. O respondente ordena cada grupo do valor
 * MAIS significativo para o MENOS relevante.
 *
 * Cada frase pertence a uma das seis dimensões de valor que aparecem
 * no painel do respondente ("Meus valores").
 *
 * Os 10 grupos são os do instrumento original. O mapeamento de cada
 * frase para a sua dimensão foi deduzido do texto — vale conferir
 * contra o gabarito oficial antes de calcular resultados de verdade.
 */

export type DimensaoValor =
  | 'teorico'
  | 'economico'
  | 'estetico'
  | 'social'
  | 'politico'
  | 'religioso'

export const dimensoesValor: { id: DimensaoValor; nome: string }[] = [
  { id: 'teorico', nome: 'Teórico / Conhecimento' },
  { id: 'economico', nome: 'Econômico / Utilidade' },
  { id: 'estetico', nome: 'Estético / Harmonia' },
  { id: 'social', nome: 'Social / Altruísmo' },
  { id: 'politico', nome: 'Político / Poder' },
  { id: 'religioso', nome: 'Religioso / Princípios' },
]

export type FraseValor = {
  texto: string
  dimensao: DimensaoValor
}

export type GrupoValores = {
  numero: number
  frases: FraseValor[]
}

export const gruposValores: GrupoValores[] = [
  {
    numero: 1,
    frases: [
      { texto: 'Liderar um time vencedor', dimensao: 'politico' },
      { texto: 'Colaborar com os menos favorecidos', dimensao: 'social' },
      { texto: 'Construir um negócio lucrativo', dimensao: 'economico' },
      { texto: 'Contribuir para um ambiente harmônico', dimensao: 'estetico' },
      { texto: 'Seguir tradições conservadoras', dimensao: 'religioso' },
      { texto: 'Desenvolver pesquisas relevantes', dimensao: 'teorico' },
    ],
  },
  {
    numero: 2,
    frases: [
      { texto: 'Crescer na carreira e na sociedade', dimensao: 'politico' },
      { texto: 'Expressar minhas crenças e convicções', dimensao: 'religioso' },
      { texto: 'Aumentar meus conhecimentos', dimensao: 'teorico' },
      { texto: 'Alcançar a independência financeira', dimensao: 'economico' },
      { texto: 'Vivenciar a arte em minha vida', dimensao: 'estetico' },
      { texto: 'Ajudar o próximo', dimensao: 'social' },
    ],
  },
  {
    numero: 3,
    frases: [
      { texto: 'Apreciar e viver o belo', dimensao: 'estetico' },
      { texto: 'Descobrir novas teorias e novos conhecimentos', dimensao: 'teorico' },
      { texto: 'Obter um bom retorno do que foi investido', dimensao: 'economico' },
      { texto: 'Contribuir com a sociedade', dimensao: 'social' },
      { texto: 'Direcionar/dirigir pessoas de uma equipe', dimensao: 'politico' },
      { texto: 'Participar de atividades ligadas às minhas crenças', dimensao: 'religioso' },
    ],
  },
  {
    numero: 4,
    frases: [
      { texto: 'Ser um líder prático que busca resultados', dimensao: 'economico' },
      { texto: 'Ser um líder com intelectualidade', dimensao: 'teorico' },
      { texto: 'Ser um líder com status e poder', dimensao: 'politico' },
      { texto: 'Ser um líder que valoriza o bem-estar', dimensao: 'estetico' },
      { texto: 'Ser um líder com princípios claros', dimensao: 'religioso' },
      { texto: 'Ser um líder que serve', dimensao: 'social' },
    ],
  },
  {
    numero: 5,
    frases: [
      { texto: 'Ter uma vida em equilíbrio', dimensao: 'estetico' },
      { texto: 'Auxiliar os mais necessitados', dimensao: 'social' },
      { texto: 'Estar sempre aprendendo algo novo', dimensao: 'teorico' },
      { texto: 'Seguir uma estratégia de sucesso', dimensao: 'politico' },
      { texto: 'Expandir minha produtividade', dimensao: 'economico' },
      { texto: 'Viver de acordo com princípios', dimensao: 'religioso' },
    ],
  },
  {
    numero: 6,
    frases: [
      { texto: 'Ter o reconhecimento e status merecido', dimensao: 'politico' },
      { texto: 'Participar de grupos com crenças iguais às minhas', dimensao: 'religioso' },
      { texto: 'Contribuir com instituições de caridade', dimensao: 'social' },
      { texto: 'Adquirir novos conhecimentos', dimensao: 'teorico' },
      { texto: 'Buscar a harmonia do meu ambiente', dimensao: 'estetico' },
      { texto: 'Potencializar recursos financeiros', dimensao: 'economico' },
    ],
  },
  {
    numero: 7,
    frases: [
      { texto: 'Expandir meu aprendizado', dimensao: 'teorico' },
      { texto: 'Exercer um papel de liderança', dimensao: 'politico' },
      { texto: 'Desfrutar do momento vivido', dimensao: 'estetico' },
      { texto: 'Seguir valores tradicionais', dimensao: 'religioso' },
      { texto: 'Ajudar pessoas carentes', dimensao: 'social' },
      { texto: 'Garantir recursos para o futuro', dimensao: 'economico' },
    ],
  },
  {
    numero: 8,
    frases: [
      { texto: 'Liderar pessoas no alcance de metas', dimensao: 'politico' },
      { texto: 'Vivenciar a arte', dimensao: 'estetico' },
      { texto: 'Investir e ganhar dinheiro', dimensao: 'economico' },
      { texto: 'Interagir com base em minhas crenças', dimensao: 'religioso' },
      { texto: 'Exercer um trabalho voluntário', dimensao: 'social' },
      { texto: 'Aprender novos conceitos', dimensao: 'teorico' },
    ],
  },
  {
    numero: 9,
    frases: [
      { texto: 'Aumentar meus conhecimentos', dimensao: 'teorico' },
      { texto: 'Usar meu tempo com eficácia', dimensao: 'economico' },
      { texto: 'Apreciar a natureza e viver o belo', dimensao: 'estetico' },
      { texto: 'Ser um grande líder', dimensao: 'politico' },
      { texto: 'Priorizar minhas crenças', dimensao: 'religioso' },
      { texto: 'Servir ao meu próximo', dimensao: 'social' },
    ],
  },
  {
    numero: 10,
    frases: [
      { texto: 'Busca por conhecimento', dimensao: 'teorico' },
      { texto: 'Busca pelo bem-estar do outro', dimensao: 'social' },
      { texto: 'Busca por recompensa financeira', dimensao: 'economico' },
      { texto: 'Busca pela harmonia', dimensao: 'estetico' },
      { texto: 'Busca por poder', dimensao: 'politico' },
      { texto: 'Busca por princípios', dimensao: 'religioso' },
    ],
  },
]

/** Quantos grupos o instrumento tem no total (os demais estão pendentes). */
export const TOTAL_GRUPOS_VALORES = 10

/** Passos da tela de instruções da Etapa 03. */
export const instrucoesEtapa3 = [
  'A seguir teremos 10 grupos com 6 frases que devem ser classificadas de acordo com a ordem que melhor identificam seus valores. Sempre do maior (mais significativo) para o menor (menos relevante).',
  'Pense exatamente no que é importante para você, nos princípios que você usa para tomar suas decisões e, por fim, nas coisas que motivam suas principais ações.',
  'É prioritário para mim:',
]
