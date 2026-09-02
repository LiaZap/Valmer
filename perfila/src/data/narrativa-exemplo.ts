/**
 * Narrativa de exemplo
 * --------------------
 * Escrita para o perfil do relatório de referência (predominância de
 * Influência com apoio de Dominância). Existe para que a página do
 * relatório renderize sem chave de API — desenvolver layout não
 * deveria custar uma chamada paga a cada recarga.
 *
 * Em produção este objeto vem de gerarNarrativa().
 */

import type { NarrativaRelatorio } from '@/lib/relatorio/tipos'

export const narrativaExemplo: NarrativaRelatorio = {
  resumoPerfil:
    'Paulo, existe em você uma combinação pouco comum: o calor de quem cria vínculo com quase qualquer pessoa somado à impaciência de quem não se contenta em só conversar sobre o que poderia ser feito. Você entra nos ambientes com energia, conquista espaço rápido e usa essa proximidade para mover coisas — ideias, projetos, pessoas. Sua força não está em mandar nem em insistir, mas em fazer com que os outros queiram ir junto, e isso vem acompanhado de coragem para decidir antes que a certeza chegue. O resultado é alguém que costuma tirar o grupo da paralisia e dar o primeiro passo quando todo mundo ainda está pesando os prós e contras.',
  pontosFortes: [
    'Poder de mobilizar pessoas. Você não apresenta uma ideia, você a contagia. Consegue transformar um assunto abstrato em algo que os outros sentem vontade de fazer acontecer, e isso é raro: a maioria consegue explicar, poucos conseguem entusiasmar.',
    'Coragem para começar. Você não precisa de todas as garantias para dar o primeiro passo. Onde outros pedem mais uma análise, você testa, ajusta no caminho e descobre respostas que nenhuma reunião teria dado.',
    'Presença em situações de tensão. Negociações difíceis, apresentações importantes, conversas em que é preciso defender uma posição diante de gente experiente: são justamente esses os momentos em que você fica mais lúcido, não menos.',
    'Leitura rápida de pessoas e construção de rede. Você percebe em poucos minutos quem está do seu lado, quem está resistindo e o que cada um precisa ouvir. Com o tempo, isso vira um patrimônio de relações que abre portas que nenhuma competência técnica abriria sozinha.',
    'Recuperação rápida diante do não. Rejeição e obstáculo não derrubam você por muito tempo; você reorganiza o ânimo e volta. Para quem trabalha ao seu lado, essa capacidade de renovar o clima depois de um revés é um alívio concreto.',
  ],
  desafios: [
    'Impaciência com o que é lento e detalhado. A parte final dos projetos — a revisão, o acabamento, a documentação — raramente disputa sua atenção com a novidade que acabou de aparecer. Existe um risco real de você acumular coisas iniciadas com brilho e terminadas por outra pessoa, ou não terminadas.',
    'Ocupar mais espaço do que percebe. Você pensa falando, e isso é legítimo, mas em reuniões pode preencher o silêncio antes que os mais reservados formulem o que iam dizer. Muita gente vai concordar com você por conforto, não por convicção — e você só descobrirá isso quando a execução não acontecer.',
    'Decidir por leitura pessoal quando os números diziam outra coisa. Sua intuição sobre pessoas é boa o bastante para te dar confiança demais nela. O ponto de atenção não é confiar na intuição, é usá-la sem o contraponto de um dado ou de alguém que enxergue o risco que você já descartou.',
    'Assumir mais frentes do que o dia comporta. Seu otimismo com prazos é sincero e por isso mesmo perigoso: você diz sim com verdade no momento em que diz, e a conta chega semanas depois, em compromissos atrasados que arranham justamente a confiança que você constrói tão bem.',
  ],
  motivadores:
    'O que move você é ter impacto visível sobre pessoas: ver alguém mudar de ideia, um time se animar, um cliente dizer sim. Reconhecimento importa — não por vaidade, mas porque é assim que você mede que sua influência foi real. E há um combustível igualmente forte na liberdade: você rende quando lhe entregam o resultado esperado e o espaço para chegar lá do seu jeito, e murcha quando o caminho vem pronto e fechado.',
  ambienteIdeal:
    'Você performa melhor onde há movimento, contato humano frequente e metas claras que possam ser vistas avançando. Ambientes com autonomia real, variedade de assuntos e permissão para experimentar tiram o seu melhor; rotinas longas, repetitivas e sem interlocução consomem sua energia mais rápido do que você imagina. O ponto de equilíbrio é ter, por perto, alguém organizado que cuide da continuidade enquanto você abre as frentes — não como controle sobre você, mas como parceria que faz suas ideias chegarem inteiras ao fim.',
  estiloComunicacao:
    'Você se comunica de forma expressiva e calorosa, com histórias, exemplos e uma dose de franqueza que vai direto ao ponto quando o assunto pede. Prefere conversas vivas a documentos longos, e absorve muito mais quando alguém te diz o porquê e o impacto de algo do que quando recebe uma lista de instruções. Com você funciona bem o retorno direto, dito de frente e sem rodeios — desde que venha com respeito e reconhecendo o que já foi bem feito, porque a crítica seca e impessoal você tende a descartar antes de considerar.',
  liderancaNatural:
    'Você lidera pelo entusiasmo e pela presença, não pelo cargo: as pessoas te seguem porque acreditam em você e gostam do clima que você cria, e isso constrói lealdade que nenhuma hierarquia compra. É especialmente forte em momentos de virada, lançamento e recuperação de moral, quando o time precisa de alguém que devolva a sensação de que é possível. Seu ponto de crescimento como líder está no depois: acompanhar, cobrar com método e sustentar a atenção nas fases em que já não há novidade, mas ainda há trabalho.',
  planoDesenvolvimento: [
    'Nas próximas quatro semanas, escolha duas reuniões por semana para ser o último a dar opinião. Antes de apresentar sua leitura, faça três perguntas abertas e anote as respostas. O objetivo não é falar menos, é descobrir o que as pessoas deixam de dizer quando você fala primeiro.',
    'Reserve trinta minutos toda sexta-feira para revisar tudo o que você prometeu na semana e marcar o que ficou inacabado. Estabeleça um teto de três frentes ativas ao mesmo tempo: para abrir uma quarta, uma das três precisa ser concluída ou repassada formalmente a alguém.',
    'Antes de assumir qualquer novo compromisso relevante, dê a si mesmo 24 horas e converse com uma pessoa de perfil analítico do seu convívio, pedindo especificamente o que ela vê de risco. Faça disso um hábito fixo, não uma consulta ocasional — é o contrapeso que vai transformar sua velocidade em vantagem duradoura em vez de retrabalho.',
  ],
  fraseDoPerfil:
    'Você é alguém que acende a sala e, no mesmo gesto, aponta a direção — sua força é fazer as pessoas quererem caminhar, e seu maior aprendizado é permanecer tempo suficiente para ver a caminhada terminar.',
}
