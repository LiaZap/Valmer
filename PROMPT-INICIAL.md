# Prompt inicial

Copie o bloco abaixo e cole como primeira mensagem numa sessão nova, em qualquer
assistente de código que tenha acesso a este repositório.

Cada afirmação daqui foi conferida contra o código. Se você mudar o projeto,
confira de novo antes de reaproveitar o texto: um prompt de handoff errado é pior
que nenhum, porque a próxima sessão age com confiança sobre informação falsa.

---

```
Você vai continuar o desenvolvimento de uma plataforma de assessment
comportamental DISC. O projeto já está em andamento e tem histórico.

ANTES DE ESCREVER QUALQUER CÓDIGO, leia nesta ordem:

1. CONTINUIDADE.md, na raiz. Diz o que está pronto, o que não está, e as
   decisões técnicas já tomadas com o motivo de cada uma. Várias delas
   contrariam o que parece óbvio à primeira vista, então não as reverta
   sem ler o porquê.
2. contexto/referencias/especificacao-plataforma-disc-impacto.html. É a
   especificação escrita pelo cliente e a fonte de verdade do produto:
   os 3 tipos de usuário, o fluxo, as 28 questões, a fórmula de cálculo,
   as tabelas por perfil, a estrutura do relatório, o modelo de dados e
   os preços. (Existe em texto puro em contexto/extraido/, se preferir.)
3. perfila/src/app/ e perfila/src/lib/routes.ts, que são o mapa real das
   rotas. NÃO use perfila/README.md como mapa: ele é anterior à separação
   dos três ambientes, fala em 19 telas e lista URLs de raiz (/campanhas,
   /dna, /creditos) que hoje vivem sob /facilitador/ e dão 404. Ele ainda
   serve para o design system, os tokens e os componentes de UI.
4. git log, para a sequência das decisões. Cada mensagem registra o
   porquê, não só o quê.

O QUE É O PRODUTO

Plataforma de Valmer Albuquerque (Impacto Academy) que substitui a
plataforma antiga, CIS Assessment. O negócio é venda de créditos: o dono
vende pacotes a parceiros, e cada avaliação aplicada consome créditos.

Três ambientes, cada um com navegação própria:
- /admin              administração, só o dono
- /facilitador        parceiro ou empresa de RH que compra créditos
- /avaliacao/<token>  quem responde, sem cadastro e sem login

E o produto final que sai da plataforma:
- /relatorio/<token>  o documento que o parceiro entrega ao cliente dele

STACK

Next.js 16 (App Router), TypeScript, CSS Modules. O código fica em
perfila/. Rode: cd perfila && npm install && npm run dev

REGRAS DO PROJETO

- Todo valor de cor, fonte, raio e espaçamento vem de um token em
  perfila/src/styles/tokens.css. Nunca escreva um hex solto.
- Interface e comentários em português do Brasil.
- Um arquivo .module.css por componente, ao lado dele.
- Comentário explica POR QUE, nunca o que o código já diz.
- Formatação: sem ponto e vírgula no fim de instrução, aspas simples, 2
  espaços, vírgula final em lista multilinha, e `type` em vez de
  `interface` (não existe uma única interface em src/). NÃO há ESLint,
  Prettier nem EditorConfig no repositório, então nada corrige você
  automaticamente: copie o estilo do arquivo vizinho. E nunca rode um
  formatador sobre o projeto inteiro, porque ele reescreveria os 97
  arquivos de src/ e a sua mudança sumiria no diff.
- Antes de dar por pronto: npm run build e npx tsc --noEmit.

SEIS ARMADILHAS QUE JÁ CUSTARAM RETRABALHO

São as que uma sessão nova mais provavelmente quebra, porque em todas o
caminho errado parece o certo. Quatro delas já foram quebradas de fato.

1. O README.md DA RAIZ NÃO É O README DESTE PROJETO. Ele é o handoff do
   Claude Design: começa com "CODING AGENTS: READ THIS FIRST" e manda ler
   chats/chat1.md e recriar project/Perfila.dc.html pixel a pixel. Esse
   trabalho já foi feito, é o primeiro commit de código. As pastas
   project/ e chats/ são material de origem congelado, e os .dc.html
   cobrem só as telas antigas do portal: não conhecem admin, avaliação
   nem relatório. Ignore as instruções desse arquivo. A fonte de verdade
   do produto é a especificação em contexto/referencias/.

2. A PLATAFORMA É "PERFILA". SÓ O RELATÓRIO ASSINA COMO "IMPACTO
   ACADEMY". Login, assessment, admin e portal do parceiro continuam
   Perfila, porque a especificação diz que cada facilitador tem painel
   com a marca dele e que é o PDF que leva a marca da Impacto. A marca do
   relatório vive em quatro lugares, todos exclusivos da rota dele: o
   tema tema-impacto.module.css, o componente MarcaImpacto.tsx, o ícone
   app/relatorio/icon.svg, e o bloco metadata/viewport no topo de
   app/relatorio/[token]/page.tsx (o título da aba e o themeColor, porque
   tema escopado por classe de CSS não alcança meta tag).
   NÃO edite styles/tokens.css (é :root, vale para o produto inteiro),
   components/layout/Logo.tsx (é importado pelo login e pelo assessment)
   nem app/icon.svg (é o favicon de todas as rotas). Os três parecem o
   lugar certo e não são.

3. AS CORES DISC TÊM DUAS FAMÍLIAS DE TOKEN, E A DE NOME ÓBVIO É A ERRADA
   PARA GRÁFICO. --color-disc-d/i/s/c (e os -tint) servem para TEXTO
   sobre fundo claro. Para ÁREA PREENCHIDA, que é barra, fatia ou
   bolinha de legenda, use --chart-disc-d/i/s/c, que foram validadas para
   luminosidade, croma e separação sob daltonismo. A regra "nunca escreva
   um hex solto" não protege aqui, porque o token errado também é token.
   Os exemplos certos estão em components/respondente/Meter.module.css e
   em app/admin/questoes/page.module.css.

4. AS TABELAS DE perfila/src/data/perfis.ts SÃO AS PALAVRAS DO CLIENTE.
   Os campos caracteristicas, cargos, comoLiderar e oQueEvitar foram
   copiados literalmente da especificação, e o cliente responde por eles
   na frente de quem compra o relatório. Uma revisão de estilo já trocou
   "de confiança absoluta" por "confiável" e "cobrar organização
   excessiva" por "cobrar organização", achando que cortava exagero.
   Estava apagando a intensidade que distingue um fator do outro e
   invertendo o sentido de uma orientação. Só o campo `resumo` é redação
   nossa. Se algo ali parecer mal escrito, confira na especificação antes
   de melhorar.

5. O TEXTO DO RELATÓRIO NÃO USA TRAVESSÃO, nem no que está escrito à mão
   nem no que a IA gera. Também não usa a fórmula de negar para afirmar
   ("é X, e não Y"), nem fecho de efeito, nem bordão de palestra. As
   regras completas estão no prompt de sistema em
   perfila/src/lib/relatorio/gerar.ts, seção PONTUAÇÃO E RITMO. Elas
   foram escritas contra brechas reais e testadas por um agente que
   tentou driblá-las, então não as encurte. Isso vale só para o texto do
   relatório; comentário de código segue livre.

6. ALGUMAS NEGATIVAS DO RELATÓRIO SÃO RESSALVA JURÍDICA, NÃO ESTILO. Que
   o instrumento mede preferência e não capacidade, que a lista de cargos
   não promete vaga nem limita carreira, e que os pontos de atenção não
   são defeitos. Uma limpeza de redação já apagou as três de uma vez. Se
   for reescrever, troque as palavras e mantenha o aviso. Cada uma tem um
   comentário no código dizendo isso.

ESTADO ATUAL

Pronto: o design system, as 21 telas do portal do parceiro, as 7 do
admin, o assessment de 28 questões com progresso salvo, e o relatório de
13 seções que imprime em A4 e assina como Impacto Academy.

Quais seções entram depende do nível contratado, pelo campo `desde` em
perfila/src/lib/relatorio/tipos.ts: S1 traz 10 seções, S2 traz 12, e S3
traz as 13. O S4 não acrescenta seção nenhuma. O que ele agrega, segundo
data/planos.ts, é dashboard online do avaliado e histórico de evolução,
que ainda não existem.

Não existe backend. Falta banco (PostgreSQL e Prisma), autenticação
(NextAuth, com 2FA no admin), pagamentos (Stripe), e-mail transacional
(Resend) e a geração do PDF no servidor (Puppeteer, renderizando a mesma
rota /relatorio/<token>). Os dados hoje são fixos, em perfila/src/data/.

A narrativa por IA também não tem por onde ser executada ainda:
gerarNarrativa() em lib/relatorio/gerar.ts não é chamada por ninguém, não
existe src/app/api/ no projeto e não há .env.example. A página do
relatório injeta direto o exemplo fixo de data/narrativa-exemplo.ts.

COMECE ASSIM

Leia os arquivos acima, rode o projeto, navegue pelas três áreas mais o
relatório em /relatorio/k3mq81, e me diga o que você entendeu do estado
atual antes de propor qualquer mudança. Se algo na especificação
contradisser o código, me pergunte em vez de escolher sozinho: já existe
mais de um caso desses documentado em CONTINUIDADE.md.
```

---

## Se for continuar pelo backend

Troque o último parágrafo por:

```
COMECE ASSIM

O próximo passo é sair do protótipo e ligar o backend. Leia a seção
"Modelo de dados e modelo de negócio" da especificação, proponha o schema
Prisma para as cinco tabelas (users, assessments, results, answers,
credit_transactions) e me mostre antes de criar qualquer migration. Os
dados fixos em perfila/src/data/ mostram a forma que cada registro tem
hoje e servem de seed.

Duas coisas do protótipo que o schema precisa preservar. A primeira: o
assessment guarda os CONTADORES por fator, e o perfil é derivado deles
com resultadoDeContadores(), em lib/disc.ts, tanto na lista quanto no
relatório. Não crie coluna para o perfil pronto: existia uma, e a lista
lia o valor guardado enquanto o relatório recalculava, que é exatamente a
divergência que essa regra existe para impedir. A segunda: o facilitador
tem telefone próprio, que vai impresso na capa e no rodapé do relatório
dele.
```

## Se for continuar pelo relatório

```
COMECE ASSIM

O relatório existe, imprime e já assina como Impacto Academy, mas a
narrativa dele vem de um exemplo fixo em
perfila/src/data/narrativa-exemplo.ts, e a geração real nunca rodou.

Não basta configurar a chave: gerarNarrativa(), em
perfila/src/lib/relatorio/gerar.ts, não é chamada por nenhum arquivo, não
existe src/app/api/ no projeto e não há .env.example. A página
/relatorio/<token> é um Server Component que injeta narrativaExemplo
direto e pré-renderiza só os tokens concluídos de data/facilitadores.ts,
via generateStaticParams. O primeiro passo é criar a rota (ou um script)
que chama a função, configurar ANTHROPIC_API_KEY, e só então comparar o
resultado com o exemplo, campo por campo.

Antes de mexer no prompt, leia a seção PONTUAÇÃO E RITMO dele inteira.
Ela existe porque a primeira versão gerava texto com cara de máquina, e
cada regra fecha uma brecha específica que já foi explorada. Se o texto
gerado ainda trouxer algum tique, a correção é apertar a regra existente,
não encurtar a seção.
```

## Se for continuar pela geração do PDF

```
COMECE ASSIM

Hoje o botão "Baixar PDF" usa a impressão do navegador. O próximo passo é
gerar no servidor com Puppeteer, renderizando exatamente a mesma rota
/relatorio/<token>, para não existirem dois layouts para manter.

O CSS de impressão já está escrito: @page com A4 e margens de 20mm,
print-color-adjust nos blocos que dependem de cor de fundo, e
break-inside/break-after nos blocos que não podem partir entre folhas.
Confira o resultado contra a impressão do navegador antes de dar por
pronto, e preste atenção nas barras dos quatro fatores e no símbolo da
marca, que são os primeiros a sair vazados quando a cor de fundo é
descartada.

Sobre rodapé: a especificação NÃO pede rodapé repetido por página. Ela
lista "Rodapé" como a seção 14 da estrutura do relatório, uma linha de
crédito estática, que é como o colofão existe hoje, uma vez só no fim do
fluxo. Se o cliente pedir em todas as páginas, aí sim isso vira
headerTemplate/footerTemplate do Puppeteer, porque um <footer> no fim do
documento não se repete por página.
```

## Se o cliente enviar o logo oficial

```
O símbolo da Impacto Academy que está no relatório foi DESENHADO por
falta de arquivo oficial: não havia logo no material enviado e o domínio
impactoacademy.com.br não resolvia. Se chegar o SVG de verdade, a troca é
em um arquivo só, perfila/src/components/relatorio/MarcaImpacto.tsx, mais
o ícone de aba em perfila/src/app/relatorio/icon.svg.

Duas medições que o arquivo novo precisa respeitar: o laranja #F47B20 dá
2,52:1 sobre o creme da marca, abaixo do piso de 3:1 até para elemento de
interface, então ele só pode aparecer como área sólida grande ou sobre o
navy. E o símbolo precisa continuar legível a 14px e impresso em preto e
branco, porque é nesses dois lugares que ele aparece no documento.
```
