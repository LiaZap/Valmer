# Onde paramos

Documento de continuidade. Serve para retomar o trabalho sem depender do
histórico da conversa que o produziu.

Repositório: https://github.com/LiaZap/Valmer

---

## O produto

Plataforma de assessment comportamental DISC, de Valmer Albuquerque
(Impacto Academy). Substitui a plataforma antiga, CIS Assessment.

O modelo de negócio é venda de créditos: o dono da plataforma vende pacotes a
parceiros, e cada avaliação aplicada consome créditos do parceiro.

### Três ambientes

| Ambiente | Quem usa | Rota | Acesso |
| --- | --- | --- | --- |
| Administração | Valmer, único admin | `/admin` | e-mail, senha e 2FA |
| Portal do Parceiro | consultor ou empresa de RH | `/facilitador` | e-mail e senha |
| Assessment | quem responde | `/avaliacao/<token>` | link único, sem cadastro |

A raiz `/` é o login, com atalhos de protótipo para os três.

---

## Stack

Next.js 16 (App Router), TypeScript, CSS Modules. É a stack que a especificação
do cliente recomenda.

```bash
cd perfila
npm install
npm run dev      # http://localhost:3000
npm run build
npm run typecheck
```

Rotas para conferir rápido: `/`, `/admin`, `/facilitador`, `/avaliacao/demo`,
`/avaliacao/expirado`, `/relatorio/k3mq81`.

---

## O que está pronto

**Design system** em `perfila/src/styles/tokens.css`. Toda cor, fonte, raio e
espaçamento sai de token. Desde 04/09/2026 os tokens carregam a paleta oficial
da Impacto Academy: Areia `#F5F2EC` de fundo, Azul Impacto `#0A1F44` de acento,
Preto Impacto `#0B0B0D` no texto forte e Laranja Impacto `#FF6B00` só como
realce. Sentient nos títulos e o stack da Nimbus Sans no texto.

**Portal do Parceiro**, 21 telas. Dashboard, assessments (lista e criação), envio
rápido, campanhas (lista e criação), DNA organizacional (lista, criação e
detalhe), arquitetura de cargos, devolutiva, benefícios, créditos, degustação,
clientes, cursos, mentores, EAD, integrações, configurações e suporte.

**Administração**, 7 telas. Visão geral com métricas derivadas dos dados,
facilitadores (lista e criação com pacote inicial), assessments de todos os
parceiros, créditos e pacotes com extrato, tabela de preços e o banco das 28
questões.

**Assessment**, 28 questões situacionais de escolha única. Sem cadastro, progresso
salvo a cada resposta, retomada pelo mesmo link, tela de link expirado e prévia do
resultado ao final.

**Relatório**, 13 seções em `/relatorio/<token>`. Renderiza na tela e imprime em
A4 com margens de 20mm. Assina como Impacto Academy, com símbolo, nome, cores e a
linha de crédito que a especificação pede. O resto do produto ainda diz Perfila,
mas isso é estado de transição, e não regra — ver "Marca única" mais abaixo.

**Geração da narrativa por IA** em `perfila/src/lib/relatorio/gerar.ts`. Chamada à
API da Anthropic com saída estruturada validada por esquema.

---

## O que ficou pronto depois do protótipo

O backend saiu do papel. Ver `git log` a partir de `98de0f8`.

- **Banco de dados.** PostgreSQL com **Drizzle**, e não Prisma: o `CLAUDE.md`
  da equipe proíbe Prisma, e a recomendação da especificação foi vencida por
  ela. Sobe com `docker compose up -d db` (porta 5439). Schema em
  `perfila/src/lib/db/schema/`, seed em `npm run db:seed`.
- **Assessment gravando de verdade.** `/avaliacao/<token>` carrega do banco,
  grava cada resposta e fecha calculando os contadores no servidor.
- **Relatório lendo do banco.** `/relatorio/<token>` sai da linha do
  assessment; a narrativa vem de `assessments_relatorios`, na última versão.
- **Geração da narrativa** com `npm run relatorio:gerar -- <token>`. Falta só a
  `ANTHROPIC_API_KEY`; sem ela o relatório usa a narrativa de exemplo.
- **Autenticação com Better Auth**, mapeado sobre as tabelas que já existiam:
  `usuarios` continua sendo o usuário do produto, e a senha mora em `contas`.
  `/admin` e `/facilitador` exigem sessão válida, e cada papel só entra no
  ambiente dele. Precisa de `BETTER_AUTH_SECRET` no `.env.local`. Ver ADR-0004.

## O que NÃO está pronto

- ~~**As sete telas de gestão ainda leem dados fixos.**~~ **Isso deixou de ser
  verdade e a linha ficou aqui errada por dias.** Conferido em 10/09/2026: a
  lista de mapas do portal e a do admin leem do banco, por `assessmentsVisiveis()`
  em `perfila/src/lib/painel.ts:106`, com sessão e escopo do dono no `WHERE`. Os
  arrays de `perfila/src/data/facilitadores.ts` têm um único consumidor hoje, o
  `seed.ts`; o resto do que se importa de lá são tipos e a constante
  `ROTULO_SITUACAO`. Se você veio consertar isso, já está consertado — confira
  antes de reescrever. A lição é a de sempre: parágrafo de continuidade envelhece
  mais rápido que código, e este mandou duas pessoas pelo caminho errado.
- **2FA do admin**, que a especificação pede. O login é de um fator só. Com o
  Better Auth isso virou configuração (plugin), não implementação.
- **Recuperação de senha e verificação de e-mail.** A biblioteca traz os dois,
  mas nenhum está ligado: falta o envio de e-mail. Definir senha hoje é
  `definirSenha()`, chamada pelo seed.
- **Pagamentos.** Stripe, para a venda de pacotes de crédito.
- **E-mail transacional.** Resend, para o convite com o link único e para o acesso
  do facilitador.
- **Geração do PDF no servidor.** Hoje o botão usa a impressão do navegador.
  Puppeteer deve renderizar exatamente a mesma rota `/relatorio/<token>`.
- **As ações de tela** (exportar, baixar, integrar) mostram uma confirmação em
  toast. Os pontos de ligação estão nos `onClick` de cada tela.

---

## Decisões que valem conhecer antes de mexer

**O inventário longo foi aposentado.** A plataforma antiga aplica 3 etapas de 10
ordenações por arrastar, e leva de 18 a 25 minutos. O cliente pediu explicitamente
para simplificar. As 28 questões de escolha única respondem em 6 a 8 minutos. Os
dados do inventário antigo continuam versionados em
`perfila/src/data/inventario.ts` e `valores.ts`, caso vire um nível premium.

**Os percentuais somam 100, não 200.** Cada uma das 28 respostas conta para um
único fator, então os contadores somam 28. A especificação afirma em um trecho que
os quatro somam 200; isso descreve o instrumento ANTIGO, onde cada fator era uma
escala independente de 0 a 100. O pseudocódigo da própria especificação confirma a
conta que está implementada.

**Os percentuais passam pelo método do maior resto.** Arredondar cada fator
isoladamente produzia somas como 100,1, e o relatório afirma ao leitor que os
quatro somam 100%.

**Cada assessment guarda os contadores por fator, não o perfil pronto.** Lista e
relatório derivam do mesmo número com `resultadoDeContadores`, então não podem
divergir. Existiu um campo `perfil` com o valor já calculado, e a lista lia esse
campo enquanto o relatório recalculava: os dois batiam só por coincidência dos
dados de exemplo. O campo foi removido. Ao criar o schema do banco, não o
reintroduza.

**As cores DISC têm duas versões.** As de `--color-disc-*` servem para texto sobre
tinta clara. Como área preenchida elas ficam claras demais, então existem
`--chart-disc-*`, validadas para faixa de luminosidade, piso de croma e separação
sob daltonismo.

Ressalva honesta sobre contraste: três das quatro passam o piso de 3:1 sobre a
Areia (D 5,85:1, S 4,19:1, C 4,41:1), e o âmbar do Influência fica em 2,85:1. Ele continua onde está porque escurecê-lo o aproxima do vermelho do
Dominância, e separação entre fatores vizinhos é o critério que não tem
compensação, enquanto contraste tem: cada barra carrega a letra do fator, o nome
por extenso e o percentual ao lado, então a cor nunca é o único portador do dado.
O validador de paleta trata esse caso como aviso e o considera resolvido
justamente por rótulo visível.

**O laranja da Impacto não entra no gráfico.** Vale no produto inteiro, não só no
relatório. Ele e o âmbar do fator Influência têm ΔE 5,2 em visão normal, medido em
OKLab ×100, contra um piso de 15: lado a lado ninguém distingue os dois. E sobre a
Areia o Laranja Impacto `#FF6B00` dá 2,56:1, abaixo do piso de 3:1 até para
elemento de interface. Onde ele entra é sobre o Azul Impacto, que lhe dá 5,69:1, e
como forma decorativa sólida. Quem carrega texto de acento é o azul.

**A tipografia é a do manual.** Sentient nos títulos, Nimbus Sans no corpo. Saíram
Sora e Figtree, que eram escolha nossa de quando não havia manual. Sentient é da
Indian Type Foundry e a Fontshare distribui de graça: os três pesos (400, 500, 700)
estão em `perfila/src/styles/fonts/` e são servidos por `next/font/local`, do nosso
próprio servidor e não de um CDN de terceiro. Nimbus Sans é da URW e não tem
distribuição web livre; o próprio manual autoriza Helvetica Neue ou Arial como
substituta, então o corpo sai pelo stack `"Nimbus Sans","Helvetica Neue",Helvetica,
"Liberation Sans",Arial,sans-serif`, sem webfont. Quem tem a Nimbus instalada vê a
Nimbus. Entrelinha 1,1 em título e 1,6 em corpo, caixa alta curta com 0,18em a
0,22em de espaçamento — tudo do manual.

**Uma marca só: "Impacto Academy", em todo lugar.** Decisão do Paulo em
10/09/2026. REVOGA a regra de dois nomes de 03/09, que separava "Impacto DISC" (o
produto) de "Impacto Academy" (a empresa). **Se o código disser Impacto Academy em
qualquer tela, está certo. Não reverta para Impacto DISC.**

Títulos de aba, login, sidebar, cabeçalho do assessment, assinatura do relatório,
`© {ano}` e comunicações ao parceiro: tudo Impacto Academy. A fonte do nome é
`NOME_MARCA`, em `components/layout/MarcaImpacto.tsx`. Quem escrever o nome à mão
num lugar novo repete o problema que fez esta troca custar 10 arquivos: use a
constante.

**"Mapa Comportamental" é o INSTRUMENTO, e continua existindo.** Ele aparece no
cabeçalho do assessment, no olho da capa do relatório e na linha de crédito do
rodapé. Nesses dois pontos do relatório ele entrou no lugar de "Impacto DISC" por
um motivo concreto: a capa já mostra `NOME_MARCA` no cabeçalho, cinco linhas
acima, e trocar a literal imprimiria a marca duas vezes na mesma dobra. Se o
Valmer quiser outro nome para o instrumento, muda nesses dois lugares.

"Perfila" sobrevive apenas como caminho — a pasta `perfila/`, o endereço do
repositório e os commits antigos.

Ao mexer em nome, NÃO faça localizar-e-substituir de "Perfil": há 132 usos de
"perfil" como substantivo comum e como identificador (`PerfilEstatico`,
`perfilPrimario`, `perfilNatural`…) que são o vocabulário do domínio e continuam.
A busca segura é a palavra inteira `Perfila`.

**Um símbolo só.** `LogoMark` (quatro barras verdes, a marca da Perfila) foi
aposentada e o arquivo `components/layout/Logo.tsx` saiu. `MarcaImpacto` mudou de
`components/relatorio/` para `components/layout/` e vale para o produto inteiro;
`app/relatorio/icon.svg` saiu e sobrou só `app/icon.svg`.

**O símbolo deixou de ser desenhado aqui.** Em 04/09/2026 o Valmer entregou o
arquivo oficial, e o disco com a onda — que tinha sido desenhado neste repositório
por falta dele — foi apagado. O que está no produto agora é o escudo com as duas
espadas da Impacto Academy.

O arquivo que ele mandou (`impacto academy.svg`) tinha a extensão de vetor mas não
era vetor: dentro dele havia ZERO `<path>` e dois PNG de 2160×2160 embutidos em
base64 (um cinza servindo de máscara de luminância, outro RGB com a arte), 269 KB,
que empastavam a 14px. Aqui ele virou path de verdade: seis contornos medidos
linha a linha sobre o raster, em caixa `0 0 505 655`, com IoU de 0,9976 contra o
original e 1,07% de erro de simetria no eixo vertical. Os mesmos seis path estão
em `MarcaImpacto.tsx` e em `app/icon.svg`. Não os redesenhe no olho: qualquer
retoque tem que voltar a bater com o original.

A caixa é RETRATO, 505×655, e a antiga era paisagem, 24×16. `size` continua sendo
a ALTURA, mas a largura caiu de 1,5× para 0,77× dela: com o mesmo número o símbolo
perde metade da área, então os seis chamadores subiram. Dentro dos quadrados
escuros o escudo é dimensionado pela altura da caixa menos o respiro (sidebar 32px
→ 20, login 36px → 22, assessment 26px → 16); ao lado do nome ele fica em cerca de
1,35× o corpo do texto (relatório 18, capa 26, fecho 20).

As cores do símbolo são tokens próprios — `--color-marca-fundo` (`#0A1F44`, o
quadrado atrás), `--color-marca` (`#0A1F44`, a monocromática em azul) e
`--color-marca-sobre-escuro` (`#FFBD59`, o ouro) — e NÃO o acento da interface. O
manual fixa cinco versões na seção 02 e o produto usa duas: sobre fundo escuro o
ouro (9,81:1 sobre o Azul Impacto, 11,87:1 sobre o Preto Impacto) e sobre fundo
claro a monocromática em azul (14,54:1 sobre a Areia). O ouro sobre a Areia dá
1,48:1 e sobre o branco 1,66:1, então ele nunca sai do escuro. Quem escolhe é a
prop `cor` do componente, e o padrão é o azul porque fundo claro é o caso comum.
Quem editar o símbolo mexe nestes tokens, nunca em `--color-accent`.
`--color-marca-disco` e `--color-marca-onda` não existem mais: os nomes descreviam
um desenho que deixou de existir.

**A paleta oficial está no produto inteiro.** Feita em 04/09/2026, quando o cliente
entregou o manual da marca (`manual-marca-impacto-academy.html`, v1.0). O manual
revoga os hexadecimais que tinham sido desenhados aqui por falta dele: navy
`#0B1E3D` virou `#0A1F44`, laranja `#F47B20` virou `#FF6B00`, creme `#F8F6F1` virou
Areia `#F5F2EC` e preto `#080D14` virou `#0B0B0D`. O tema saiu da classe escopada
de `tema-impacto.module.css`, que foi apagado, e subiu para `:root` em
`styles/tokens.css`, então vale no login, no assessment, no admin, no portal do
parceiro e no relatório.

O acento da interface é o **azul**, não o laranja, e isso não é gosto: o laranja
sobre a Areia dá 2,56:1, abaixo do piso de 3:1 até para elemento de interface, e
branco sobre laranja dá 2,86:1, que o próprio manual reprova. O azul dá 14,54:1.
`--color-accent-ring` — o anel de foco, 89 usos em mais de 20 arquivos — é azul
pelo mesmo motivo: em laranja o foco de teclado sumiria no produto inteiro.
O laranja vive em `--color-realce` (massa sólida decorativa) e em
`--color-accent-on-dark` (5,69:1 sobre o azul). Se um dia ele precisar carregar
texto, vira Laranja Brasa `#D95100`, e mesmo assim só acima de 24px.

Contrastes medidos sobre a Areia, anotados também em comentário no `tokens.css`:
texto 17,60 · secundário 14,54 · apoio 7,61 · sutil 5,85 · placeholder 4,54 ·
acento 14,54 · hover 10,08. Sobre o azul escuro: branco 16,25 · laranja 5,69.
Os cinco níveis de texto passam o piso de 4,5:1 — o placeholder antigo ficava em
1,98:1. `--chart-disc-*` não mudou; a rampa sequencial `--chart-seq-*` foi
reancorada no `#0A1F44`.

O Cinza Neutro `#8A94A6` do manual não virou cor de texto da interface clara:
sobre a Areia ele dá 2,74:1. Ele só vale sobre azul ou preto, e nesse papel já
estava coberto pelos `--color-on-ink-*`, que resolvem `#919AAB` sobre o azul.

**A régua laranja do fecho fica em `#FF6B00`, e 2,56:1 não a reprova.** Ela dá
2,56:1 sobre a Areia, e a pergunta de trocar por Laranja Brasa `#D95100` (3,67:1)
já foi feita e respondida: a WCAG 1.4.11 cobre componente de interface e objeto
gráfico necessário ao conteúdo, e a régua não é nenhum dos dois. O próprio código
declara isso em `PlanoFecho.tsx:153`, com `aria-hidden`: 44×2px, sem texto, sem
alvo de clique, sem dado. Decoração é exceção explícita do critério, e o manual
pede o Laranja Impacto nesse filete. A ressalva: isso vale enquanto for decoração.
Se a régua virar separador que organiza leitura, ou ganhar `aria`, o piso passa a
valer e o Brasa entra.

**A variante monocromática de impressão está feita.** O navegador não imprime o
quadrado azul de trás — nenhuma dessas telas pede `print-color-adjust: exact` —,
então na folha o escudo cai sobre papel branco. Em ouro isso dá 1,62:1 em escala
de cinza, um desenho que não aparece. O `@media print` de `app/globals.css` passa
`--color-marca-sobre-escuro` e `--color-realce` para o azul: todo símbolo impresso
sai do mesmo azul, 16,57:1 em cinza contra o papel, de uma cor só, que é a versão
monocromática que o manual já prevê.

**O corte por nível é por SEÇÃO, não por componente.** As três seções de
`Lideranca.tsx` entram em níveis diferentes: encaixe é S1, liderança e como liderar
são S2. Gatear o componente inteiro tirava "Onde você se encaixa" do S1, que a
tabela de preços vende como parte do S1. Hoje S1 rende 10 seções, S2 rende 12 e S3
rende as 13. O S4 não acrescenta seção nenhuma: o que ele agrega, segundo
`planos.ts`, é dashboard online e histórico de evolução, que ainda não existem.

**O escudo a 16px de favicon foi o que decidiu o recuo do ícone.** Dentro do
quadrado de 32 ele fica com 24px de altura e 4px de respiro em cima e embaixo. Com
6px de respiro, a 16px as duas espadas empastavam contra o escudo; com 3px o
desenho encostava no canto arredondado. Isso foi medido renderizando os três, e
não escolhido no olho.

**As tabelas de `perfis.ts` são as palavras do cliente.** `caracteristicas`,
`cargos`, `comoLiderar` e `oQueEvitar` vêm literalmente da especificação e ele
responde por elas na frente de quem compra. Uma revisão de estilo já trocou cinco
delas achando que cortava superlativo vazio, e estava apagando a intensidade que
distingue um fator do outro. Só o campo `resumo` é redação nossa.

**"O que nunca fazer" virou campo próprio.** Espremidas numa linha só dentro de
`comoLiderar`, três das cinco cláusulas do cliente eram descartadas em cada perfil,
e a especificação chama essa seção de o diferencial mais pedido por gestores. Além
disso, orientação que começa por "Nunca" atrás de um sinal de confirmação diz uma
coisa e mostra a contrária.

**O relatório não usa travessão.** Nem no texto escrito à mão, nem no que a IA
gera. O traço longo virou marca de texto de máquina, e o documento é assinado por
um profissional. O prompt de sistema em `gerar.ts` carrega a regra junto com o
resto do padrão de escrita: voz ativa, frase curta, sem jargão de consultoria e
sem a fórmula "não é X, é Y". Quem mexer no prompt precisa manter essa seção.

**O modelo da API foi trocado.** A especificação pede `claude-sonnet-4-20250514`
chamado por `fetch` cru. Esse modelo está depreciado e é de uma geração anterior.
O código usa o SDK
oficial com `claude-opus-5`, saída estruturada por esquema, cache do prompt de
sistema e substituição automática em caso de recusa.

**Só a narrativa passa pela IA.** Percentuais e tabelas por perfil são calculados
e fixos. Mandá-los ao modelo seria pagar para ele repetir o que já sabemos.

---

## Pendências que precisam de decisão do cliente

1. **O gabarito do inventário de valores.** As 60 frases da etapa 3 foram mapeadas
   para as seis dimensões pelo sentido do texto. Precisa bater com o gabarito
   oficial antes de calcular resultado de verdade.
2. **As descrições dos 40 adjetivos** do inventário antigo são provisórias.
3. **Os textos dos 11 pilares** do mapa de autoavaliação são provisórios. Só o
   pilar Espiritual veio do sistema original, com as perguntas de apoio.
4. **Fotos de cursos e mentores** seguem como espaço reservado.
5. **O lockup completo (símbolo + nome desenhado) ainda não chegou.** O símbolo
   já é o oficial, mas o manual da marca exibe o nome como reconstrução
   tipográfica e ele mesmo pede o arquivo original. Hoje o produto compõe o
   lockup com o escudo ao lado do nome em Sentient, que é a fonte do manual.

---

## Material de origem

Está em `contexto/`. Comece pela especificação: ela é a fonte de verdade do
produto. Veja `contexto/README.md`.

---

## Histórico

Onze commits: o handoff do Claude Design, que abriu o repositório, e mais dez, do
protótipo inicial ao relatório com a marca da Impacto Academy. `git log` conta a
sequência, e cada mensagem registra o porquê das decisões, não
só o quê.
