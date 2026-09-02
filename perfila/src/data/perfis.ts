/**
 * Conteúdo fixo por fator DISC
 * ----------------------------
 * Estas tabelas não passam pela IA: são iguais para todo mundo que
 * tem o mesmo fator predominante. Extraídas da especificação escrita
 * pelo cliente.
 *
 * Os cargos são indicação de ENCAIXE comportamental, não recomendação
 * de carreira nem requisito de contratação. O relatório precisa dizer
 * isso ao leitor.
 */

import type { PerfilEstatico } from '@/lib/relatorio/tipos'
import type { FatorDisc } from './dna'

export const perfisEstaticos: Record<FatorDisc, PerfilEstatico> = {
  D: {
    fator: 'D',
    nome: 'Dominância',
    resumo:
      'Fator que descreve como a pessoa enfrenta problemas e assume o controle — o perfil Dominante é o executor e comandante, direto, decidido e ousado, movido por desafios e resultados concretos.',
    caracteristicas: [
      'Direto, assertivo e orientado a resultados',
      'Toma decisões rápidas, mesmo com informação incompleta',
      'Alta competitividade e necessidade de controle',
      'Prefere ambientes de desafio constante',
      'Pouca paciência para processos lentos',
      'Assume a liderança naturalmente em situações de crise',
    ],
    cargos: [
      'CEO e Diretor Executivo',
      'Diretor Comercial e Head de Vendas',
      'Gerente Geral de Operações',
      'Empreendedor e Fundador',
      'Gerente de Projetos Complexos',
      'Líder de Times de Alta Performance',
      'Gestor de Crise',
      'Militar e Segurança Pública em nível de gestão',
    ],
    comoLiderar: [
      'Dar autonomia real sobre a forma de executar',
      'Oferecer desafios que valham a pena',
      'Ser direto e objetivo na comunicação',
      'Não ocupar tempo com detalhes desnecessários',
      'Reconhecer conquistas pelo impacto gerado',
      'Nunca microgerir, dar feedback indireto ou convocar reuniões sem objetivo claro',
    ],
  },
  I: {
    fator: 'I',
    nome: 'Influência',
    resumo:
      'Fator que descreve como a pessoa influencia e se comunica com os outros — o perfil Influente é o comunicador e inspirador, entusiasta, sociável e persuasivo.',
    caracteristicas: [
      'Extrovertido, entusiasta e altamente comunicativo',
      'Excelente capacidade de persuasão e engajamento',
      'Facilidade natural para criar conexões',
      'Otimista e emocionalmente expressivo',
      'Criativo e gerador de ideias',
      'Cria clima positivo e motivador na equipe',
    ],
    cargos: [
      'Vendedor e Consultor Comercial',
      'Treinador e Facilitador',
      'Marketing e Comunicação',
      'Relações Públicas',
      'Recursos Humanos na área de Recrutamento',
      'Professor e Palestrante',
      'Influenciador Digital e Criador de Conteúdo',
      'Liderança de Comunidades',
    ],
    comoLiderar: [
      'Dar reconhecimento público com frequência',
      'Envolver em projetos com pessoas e comunicação',
      'Criar um ambiente social e colaborativo',
      'Deixar espaço para a criatividade',
      'Dar feedbacks positivos antes dos construtivos',
      'Nunca isolar em trabalho técnico solitário nem cobrar organização sem oferecer suporte',
    ],
  },
  S: {
    fator: 'S',
    nome: 'Estabilidade',
    resumo:
      'Fator que descreve como a pessoa responde ao ritmo e à consistência — o perfil Estável é o planejador e colaborador, paciente, leal e confiável.',
    caracteristicas: [
      'Paciente, leal e de confiança absoluta',
      'Excelente ouvinte e mediador natural',
      'Prefere ambientes estáveis e previsíveis',
      'Alta capacidade de manter relacionamentos longos',
      'Comprometido com o time antes de si mesmo',
      'Consistente e disciplinado na execução de processos',
    ],
    cargos: [
      'Psicólogo e Assistente Social',
      'Enfermagem e Cuidados em Saúde',
      'Recursos Humanos na Gestão de Pessoas',
      'Professor do Ensino Básico',
      'Coordenador de Projetos Colaborativos',
      'Atendimento ao Cliente Premium',
      'Mediador e Conselheiro',
      'Operações e Logística',
    ],
    comoLiderar: [
      'Dar estabilidade e previsibilidade na rotina',
      'Avisar as mudanças com antecedência',
      'Criar um espaço de confiança para que ele fale',
      'Valorizar a lealdade e o esforço demonstrados',
      'Atribuir tarefas com papel claro dentro da equipe',
      'Nunca mudar tudo de repente sem explicação nem cobrar resultados sem apoio emocional',
    ],
  },
  C: {
    fator: 'C',
    nome: 'Conformidade',
    resumo:
      'Fator que descreve como a pessoa segue regras e busca precisão — o perfil Conforme é o analista e estrategista, analítico, preciso e sistemático.',
    caracteristicas: [
      'Analítico, meticuloso e orientado à qualidade',
      'Exige dados e evidências antes de decidir',
      'Alta capacidade de planejamento e estruturação',
      'Introvertido e reservado emocionalmente',
      'Forte tendência perfeccionista',
      'Identifica erros e inconsistências com facilidade',
    ],
    cargos: [
      'Analista de Dados e BI',
      'Engenheiro e Arquiteto',
      'Contador e Auditor',
      'Desenvolvedor de Software',
      'Jurídico e Compliance',
      'Planejamento Estratégico',
      'Pesquisador e Cientista',
      'Gestor da Qualidade em ISO e processos',
    ],
    comoLiderar: [
      'Dar expectativas claras e métricas definidas',
      'Respeitar o ritmo de análise antes da decisão',
      'Dar acesso aos dados e às informações necessárias',
      'Reconhecer a qualidade e a precisão do trabalho',
      'Valorizar o expertise técnico acumulado',
      'Nunca pressionar por decisão sem dados nem criticar o perfeccionismo sem entender sua origem',
    ],
  },
}

export function getPerfilEstatico(fator: FatorDisc): PerfilEstatico {
  return perfisEstaticos[fator]
}
