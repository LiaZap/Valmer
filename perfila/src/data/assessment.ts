/**
 * Assessment DISC — 28 questões situacionais
 * ------------------------------------------
 * Conteúdo extraído da especificação da plataforma escrita pelo
 * cliente. Cada questão tem 4 opções, uma por fator DISC, e o
 * avaliado escolhe apenas uma.
 *
 * Substitui o inventário longo de 30 ordenações: aquele levava de
 * 18 a 25 minutos, este responde em 6 a 8.
 */

import type { FatorDisc } from './dna'

export type OpcaoQuestao = {
  fator: FatorDisc
  texto: string
}

export type Questao = {
  /** Código da especificação: Q01 … Q28. */
  codigo: string
  /** Bloco temático a que a questão pertence. */
  bloco: number
  enunciado: string
  opcoes: OpcaoQuestao[]
}

export type BlocoAssessment = {
  numero: number
  nome: string
  descricao: string
}

export const blocosAssessment: BlocoAssessment[] = [
  { numero: 1, nome: 'Comportamento no Trabalho', descricao: 'Situações do dia a dia' },
  { numero: 2, nome: 'Liderança e Relacionamentos', descricao: 'Como você se relaciona e conduz' },
  { numero: 3, nome: 'Tomada de Decisão', descricao: 'Como você escolhe e decide' },
  { numero: 4, nome: 'Autoconhecimento', descricao: 'Como você se enxerga' },
]

export const questoes: Questao[] = [
  {
    codigo: 'Q01',
    bloco: 1,
    enunciado: 'Quando você recebe um projeto novo com prazo curto, sua reação mais natural é:',
    opcoes: [
      { fator: 'D', texto: 'Partir para a ação imediatamente, definindo o que precisa ser feito' },
      { fator: 'I', texto: 'Reunir a equipe para alinhar e criar entusiasmo coletivo' },
      { fator: 'S', texto: 'Entender bem o escopo antes de começar, para não ter retrabalho' },
      { fator: 'C', texto: 'Mapear todos os riscos e montar um plano detalhado antes de executar' },
    ],
  },
  {
    codigo: 'Q02',
    bloco: 1,
    enunciado: 'Em uma reunião de equipe com opiniões divergentes, você geralmente:',
    opcoes: [
      { fator: 'D', texto: 'Toma uma posição clara e defende seu ponto de vista com firmeza' },
      { fator: 'I', texto: 'Tenta aproximar os lados e criar um ambiente mais leve para o debate' },
      { fator: 'S', texto: 'Ouve todos com atenção antes de emitir qualquer opinião' },
      { fator: 'C', texto: 'Apresenta dados e fatos para embasar a discussão tecnicamente' },
    ],
  },
  {
    codigo: 'Q03',
    bloco: 1,
    enunciado: 'Quando você precisa delegar uma tarefa importante para alguém, você:',
    opcoes: [
      { fator: 'D', texto: 'Define claramente o resultado esperado e deixa a pessoa descobrir o caminho' },
      { fator: 'I', texto: 'Conversa com entusiasmo sobre a tarefa e motiva a pessoa a assumir o desafio' },
      { fator: 'S', texto: 'Explica o passo a passo com calma e se coloca à disposição para apoiar' },
      { fator: 'C', texto: 'Fornece todas as informações, checklists e padrões de qualidade esperados' },
    ],
  },
  {
    codigo: 'Q04',
    bloco: 1,
    enunciado: 'Diante de um problema inesperado que precisa de solução rápida, você:',
    opcoes: [
      { fator: 'D', texto: 'Decide rapidamente e age — prefere errar e corrigir do que esperar' },
      { fator: 'I', texto: 'Chama as pessoas envolvidas e busca uma saída criativa em conjunto' },
      { fator: 'S', texto: 'Busca entender a causa raiz antes de propor qualquer solução' },
      { fator: 'C', texto: 'Analisa as alternativas com critério antes de escolher o melhor caminho' },
    ],
  },
  {
    codigo: 'Q05',
    bloco: 1,
    enunciado: 'Quanto à sua forma de dar feedback para alguém da equipe, você costuma:',
    opcoes: [
      { fator: 'D', texto: 'Ser direto e objetivo, mesmo que o feedback seja difícil de ouvir' },
      { fator: 'I', texto: 'Começar valorizando os pontos positivos e usar uma abordagem empática' },
      { fator: 'S', texto: 'Esperar o momento certo, num ambiente seguro e de confiança' },
      { fator: 'C', texto: 'Estruturar o feedback com exemplos concretos e dados antes de conversar' },
    ],
  },
  {
    codigo: 'Q06',
    bloco: 1,
    enunciado: 'Quando você está sob pressão e com muitas demandas simultâneas, você tende a:',
    opcoes: [
      { fator: 'D', texto: 'Focar nas tarefas de maior impacto e cortar o que não é prioritário' },
      { fator: 'I', texto: 'Pedir ajuda ao time e dividir as tarefas com energia positiva' },
      { fator: 'S', texto: 'Manter a calma e seguir a rotina — não gosta de quebrar processos' },
      { fator: 'C', texto: 'Reorganizar as prioridades de forma lógica e sistemática' },
    ],
  },
  {
    codigo: 'Q07',
    bloco: 1,
    enunciado: 'Ao iniciar um novo trabalho em uma empresa ou equipe nova, você normalmente:',
    opcoes: [
      { fator: 'D', texto: 'Já começa mostrando resultados rapidamente para demonstrar competência' },
      { fator: 'I', texto: 'Investe tempo em conhecer e criar vínculos com todos da equipe primeiro' },
      { fator: 'S', texto: 'Observa a cultura e os processos antes de propor qualquer mudança' },
      { fator: 'C', texto: 'Estuda a fundo os processos, dados e histórico da empresa' },
    ],
  },
  {
    codigo: 'Q08',
    bloco: 2,
    enunciado: 'Seu estilo natural ao liderar uma equipe é:',
    opcoes: [
      { fator: 'D', texto: 'Definir metas claras, cobrar resultados e empoderar quem entrega' },
      { fator: 'I', texto: 'Inspirar, engajar e criar um ambiente de alta energia e colaboração' },
      { fator: 'S', texto: 'Dar suporte constante, ouvir as necessidades individuais e construir confiança' },
      { fator: 'C', texto: 'Estabelecer processos claros, métricas de qualidade e padrões de excelência' },
    ],
  },
  {
    codigo: 'Q09',
    bloco: 2,
    enunciado: 'Quando um membro da sua equipe comete um erro sério, você:',
    opcoes: [
      { fator: 'D', texto: 'Aponta o erro diretamente e cobra a solução imediata' },
      { fator: 'I', texto: 'Conversa de forma positiva, focando no aprendizado e no próximo passo' },
      { fator: 'S', texto: 'Entende o que aconteceu com empatia antes de qualquer cobrança' },
      { fator: 'C', texto: 'Analisa as causas do erro e propõe um processo para que não se repita' },
    ],
  },
  {
    codigo: 'Q10',
    bloco: 2,
    enunciado: 'Na hora de motivar alguém que está desmotivado, você prefere:',
    opcoes: [
      { fator: 'D', texto: 'Dar um desafio novo e estimulante para a pessoa se reinventar' },
      { fator: 'I', texto: 'Conversar, elogiar o potencial da pessoa e criar entusiasmo pelo futuro' },
      { fator: 'S', texto: 'Ouvir com atenção o que a pessoa está sentindo e oferecer apoio genuíno' },
      { fator: 'C', texto: 'Apresentar dados que mostrem a evolução da pessoa e um plano de desenvolvimento' },
    ],
  },
  {
    codigo: 'Q11',
    bloco: 2,
    enunciado: 'Quando há conflito entre dois membros da equipe, você normalmente:',
    opcoes: [
      { fator: 'D', texto: 'Toma uma posição clara e define o que vai acontecer para resolver logo' },
      { fator: 'I', texto: 'Reúne os dois, cria um clima de conversa positiva e busca reconciliação' },
      { fator: 'S', texto: 'Ouve cada lado separadamente com paciência antes de qualquer intervenção' },
      { fator: 'C', texto: 'Investiga os fatos, identifica a causa raiz e propõe uma solução justa e estruturada' },
    ],
  },
  {
    codigo: 'Q12',
    bloco: 2,
    enunciado: 'Sua maior fonte de satisfação profissional vem de:',
    opcoes: [
      { fator: 'D', texto: 'Superar metas desafiadoras e ver resultados concretos' },
      { fator: 'I', texto: 'Influenciar pessoas e ser reconhecido pelo impacto que gera' },
      { fator: 'S', texto: 'Ver sua equipe crescendo e se sentir útil para o sucesso coletivo' },
      { fator: 'C', texto: 'Entregar trabalhos de alta qualidade e resolver problemas complexos' },
    ],
  },
  {
    codigo: 'Q13',
    bloco: 2,
    enunciado: 'Quando você precisa comunicar uma decisão difícil para sua equipe, você:',
    opcoes: [
      { fator: 'D', texto: 'Vai direto ao ponto — comunica a decisão e o racional de forma objetiva' },
      { fator: 'I', texto: 'Cria um contexto positivo, trata o impacto emocional antes de comunicar' },
      { fator: 'S', texto: 'Conversa individualmente com os mais impactados antes do anúncio geral' },
      { fator: 'C', texto: 'Prepara uma apresentação completa com dados, contexto e próximos passos' },
    ],
  },
  {
    codigo: 'Q14',
    bloco: 2,
    enunciado: 'Na construção de uma equipe, você prioriza contratar pessoas que:',
    opcoes: [
      { fator: 'D', texto: 'São altamente orientadas a resultados e não têm medo de desafios' },
      { fator: 'I', texto: 'Têm boa comunicação, energia positiva e fit cultural com o time' },
      { fator: 'S', texto: 'São confiáveis, leais e comprometidas com o trabalho em equipe' },
      { fator: 'C', texto: 'Têm competência técnica comprovada e alto nível de organização' },
    ],
  },
  {
    codigo: 'Q15',
    bloco: 3,
    enunciado: 'Quando precisa tomar uma decisão importante, você geralmente:',
    opcoes: [
      { fator: 'D', texto: 'Decide com agilidade — acredita que uma decisão feita agora vale mais que a perfeita amanhã' },
      { fator: 'I', texto: 'Consulta pessoas de confiança para sentir as perspectivas antes de decidir' },
      { fator: 'S', texto: 'Pensa bem e considera o impacto da decisão nas pessoas envolvidas' },
      { fator: 'C', texto: 'Pesquisa profundamente, coleta dados e só decide quando tem segurança suficiente' },
    ],
  },
  {
    codigo: 'Q16',
    bloco: 3,
    enunciado: 'Quando seu projeto enfrenta um obstáculo sério no meio do caminho, você:',
    opcoes: [
      { fator: 'D', texto: 'Enfrenta de frente — o obstáculo não vai te parar' },
      { fator: 'I', texto: 'Busca alternativas criativas e engaja o time para encontrar uma saída' },
      { fator: 'S', texto: 'Reavalia o plano com cuidado e busca uma solução que minimize os impactos' },
      { fator: 'C', texto: 'Analisa as causas do obstáculo e cria um plano alternativo bem estruturado' },
    ],
  },
  {
    codigo: 'Q17',
    bloco: 3,
    enunciado: 'Sua postura diante de regras e processos estabelecidos é:',
    opcoes: [
      { fator: 'D', texto: 'Seguir quando fazem sentido — mas não hesita em questionar os que travam o resultado' },
      { fator: 'I', texto: 'Adaptar conforme a situação — as pessoas importam mais que os processos' },
      { fator: 'S', texto: 'Respeitar e seguir — acredita que processos criam estabilidade e previsibilidade' },
      { fator: 'C', texto: 'Seguir rigorosamente — regras existem por uma razão e precisam ser cumpridas' },
    ],
  },
  {
    codigo: 'Q18',
    bloco: 3,
    enunciado: 'Ao apresentar uma ideia nova para alguém, você costuma:',
    opcoes: [
      { fator: 'D', texto: 'Ir direto ao ponto — qual é o resultado e por que vale a pena' },
      { fator: 'I', texto: 'Criar entusiasmo e contar a história da ideia de forma envolvente' },
      { fator: 'S', texto: 'Explicar como a ideia vai impactar positivamente as pessoas envolvidas' },
      { fator: 'C', texto: 'Apresentar dados, pesquisas e uma análise completa que sustente a ideia' },
    ],
  },
  {
    codigo: 'Q19',
    bloco: 3,
    enunciado: 'Quando você recebe uma crítica ao seu trabalho, sua primeira reação é:',
    opcoes: [
      { fator: 'D', texto: 'Responder com firmeza — defende seu ponto se acredita que está certo' },
      { fator: 'I', texto: 'Sentir o impacto emocional primeiro — críticas te afetam mais do que você gostaria' },
      { fator: 'S', texto: 'Ouvir com atenção e avaliar com cuidado antes de responder' },
      { fator: 'C', texto: 'Analisar friamente se a crítica tem base — e só então aceitar ou refutar' },
    ],
  },
  {
    codigo: 'Q20',
    bloco: 3,
    enunciado: 'Em um projeto de longo prazo, o que mais te preocupa é:',
    opcoes: [
      { fator: 'D', texto: 'Que as coisas fiquem lentas demais e percam o ritmo' },
      { fator: 'I', texto: 'Que o time perca o engajamento e a energia ao longo do tempo' },
      { fator: 'S', texto: 'Que mudanças inesperadas desestabilizem a equipe e os processos' },
      { fator: 'C', texto: 'Que a qualidade caia por causa da pressão de tempo' },
    ],
  },
  {
    codigo: 'Q21',
    bloco: 3,
    enunciado: 'Diante de uma mudança significativa na organização, sua postura natural é:',
    opcoes: [
      { fator: 'D', texto: 'Ver como oportunidade — gosta de ambientes em transformação' },
      { fator: 'I', texto: 'Engajar as pessoas na mudança e ajudar a criar adesão coletiva' },
      { fator: 'S', texto: 'Precisar de tempo para assimilar — mudanças precisam de um ritmo respeitoso' },
      { fator: 'C', texto: 'Questionar o porquê, entender os dados por trás e só depois apoiar' },
    ],
  },
  {
    codigo: 'Q22',
    bloco: 4,
    enunciado: 'As pessoas que convivem com você profissionalmente mais te descrevem como:',
    opcoes: [
      { fator: 'D', texto: 'Determinado, focado e que sempre entrega o que promete' },
      { fator: 'I', texto: 'Animado, comunicativo e que motiva todo mundo ao redor' },
      { fator: 'S', texto: 'Confiável, paciente e que sempre apoia o time nos momentos difíceis' },
      { fator: 'C', texto: 'Criterioso, organizado e que mantém a qualidade em tudo que faz' },
    ],
  },
  {
    codigo: 'Q23',
    bloco: 4,
    enunciado: 'Qual das situações abaixo mais te gera desconforto no trabalho?',
    opcoes: [
      { fator: 'D', texto: 'Ser controlado ou ter sua autonomia limitada' },
      { fator: 'I', texto: 'Trabalhar sozinho por longos períodos sem interação social' },
      { fator: 'S', texto: 'Conviver com conflitos constantes e ambiente de alta pressão' },
      { fator: 'C', texto: 'Ter que entregar algo sem ter o tempo necessário para fazer bem feito' },
    ],
  },
  {
    codigo: 'Q24',
    bloco: 4,
    enunciado: 'Quando você está no seu melhor, as pessoas ao redor percebem que você:',
    opcoes: [
      { fator: 'D', texto: 'Está no modo de alta performance — foco total em resultados e eficiência' },
      { fator: 'I', texto: 'Está irradiando energia positiva e movendo o ambiente ao redor' },
      { fator: 'S', texto: 'Está sendo o porto seguro de todos — apoio, equilíbrio e generosidade' },
      { fator: 'C', texto: 'Está no estado de maestria — cada detalhe no lugar, padrão mais alto' },
    ],
  },
  {
    codigo: 'Q25',
    bloco: 4,
    enunciado: 'Qual habilidade você acredita ser seu maior diferencial profissional?',
    opcoes: [
      { fator: 'D', texto: 'A capacidade de tomar decisões rápidas e mover as coisas com velocidade' },
      { fator: 'I', texto: 'A habilidade de engajar, persuadir e conectar pessoas a uma causa' },
      { fator: 'S', texto: 'A consistência, lealdade e capacidade de construir relações duradouras' },
      { fator: 'C', texto: 'A capacidade de análise, planejamento e execução com alta qualidade' },
    ],
  },
  {
    codigo: 'Q26',
    bloco: 4,
    enunciado: 'No ambiente ideal de trabalho, você prefere:',
    opcoes: [
      { fator: 'D', texto: 'Alta autonomia, metas claras e liberdade para executar do seu jeito' },
      { fator: 'I', texto: 'Ambiente colaborativo, descontraído e com muito espaço para criatividade' },
      { fator: 'S', texto: 'Equipe unida, processos claros e clima de confiança e estabilidade' },
      { fator: 'C', texto: 'Expectativas claras, padrões de qualidade definidos e espaço para aprofundamento' },
    ],
  },
  {
    codigo: 'Q27',
    bloco: 4,
    enunciado: 'Quando você pensa no seu desenvolvimento profissional, você mais deseja:',
    opcoes: [
      { fator: 'D', texto: 'Crescer em posições de liderança com mais poder e responsabilidade' },
      { fator: 'I', texto: 'Ampliar seu impacto — influenciar mais pessoas e ter mais visibilidade' },
      { fator: 'S', texto: 'Construir uma carreira sólida em uma empresa onde se sinta valorizado' },
      { fator: 'C', texto: 'Tornar-se referência técnica na sua área de atuação' },
    ],
  },
  {
    codigo: 'Q28',
    bloco: 4,
    enunciado: 'Qual frase mais representa a forma como você enxerga liderança?',
    opcoes: [
      { fator: 'D', texto: '"Liderar é ter a coragem de tomar decisões difíceis e aceitar a responsabilidade pelos resultados"' },
      { fator: 'I', texto: '"Liderar é inspirar pessoas a acreditarem no impossível e mover-se juntas em direção a ele"' },
      { fator: 'S', texto: '"Liderar é servir — colocar as pessoas à frente e criar o ambiente para que elas floresçam"' },
      { fator: 'C', texto: '"Liderar é construir sistemas excelentes onde as pessoas encontram clareza para dar o seu melhor"' },
    ],
  },
]

/** Ordem fixa em que os fatores aparecem em gráficos e legendas. */
export const ORDEM_FATORES: FatorDisc[] = ['D', 'I', 'S', 'C']

export const NOMES_FATORES: Record<FatorDisc, string> = {
  D: 'Dominância',
  I: 'Influência',
  S: 'Estabilidade',
  C: 'Conformidade',
}
