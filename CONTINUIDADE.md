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
espaçamento sai de token. Neutros quentes com um acento verde-floresta, Sora nos
títulos e Figtree no texto.

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
linha de crédito que a especificação pede. O resto do produto continua Perfila.

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

- **As sete telas de gestão ainda leem dados fixos.** Portal e admin importam
  de `perfila/src/data/facilitadores.ts`, então um assessment criado de verdade
  não aparece na lista. É o próximo fio: trocar as leituras pelas actions de
  `perfila/src/lib/actions/assessments.ts`, que já existem e já têm sessão.
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

Ressalva honesta sobre contraste: três das quatro passam o piso de 3:1 sobre o
creme do relatório (D 6,05:1, S 4,34:1, C 4,56:1), e o âmbar do Influência fica em
2,95:1. Ele continua onde está porque escurecê-lo o aproxima do vermelho do
Dominância, e separação entre fatores vizinhos é o critério que não tem
compensação, enquanto contraste tem: cada barra carrega a letra do fator, o nome
por extenso e o percentual ao lado, então a cor nunca é o único portador do dado.
O validador de paleta trata esse caso como aviso e o considera resolvido
justamente por rótulo visível.

**O laranja da Impacto não entra no gráfico.** Ele e o âmbar do fator Influência
têm ΔE 5,2 em visão normal, medido em OKLab ×100, contra um piso de 15: lado a
lado ninguém distingue os dois. E sobre o creme da marca o laranja dá 2,52:1,
abaixo do piso de 3:1 até para elemento de interface. No relatório ele aparece sobre o navy, onde dá 6,08:1, e
como forma decorativa sólida. Quem carrega texto de acento é o navy.

**Só o relatório assina como Impacto Academy.** Login, assessment, admin e portal
do parceiro continuam Perfila, porque a especificação diz que cada facilitador tem
painel com a marca dele e que o PDF é que leva a marca da Impacto. A marca vive em
quatro lugares, todos exclusivos da rota do relatório: o tema escopado
`tema-impacto.module.css`, o componente `MarcaImpacto`, o ícone
`app/relatorio/icon.svg` e o bloco `metadata`/`viewport` no topo de
`app/relatorio/[token]/page.tsx`, que carrega o título da aba e o creme da marca em
`themeColor`. Esse quarto existe porque tema escopado por classe de CSS não alcança
meta tag. Não mexa em `styles/tokens.css`, em `components/layout/Logo.tsx` nem em
`app/icon.svg`: os três parecem o lugar certo e valem para o produto inteiro.

**O corte por nível é por SEÇÃO, não por componente.** As três seções de
`Lideranca.tsx` entram em níveis diferentes: encaixe é S1, liderança e como liderar
são S2. Gatear o componente inteiro tirava "Onde você se encaixa" do S1, que a
tabela de preços vende como parte do S1. Hoje S1 rende 10 seções, S2 rende 12 e S3
rende as 13. O S4 não acrescenta seção nenhuma: o que ele agrega, segundo
`planos.ts`, é dashboard online e histórico de evolução, que ainda não existem.

**O símbolo tem as pontas cortadas retas.** Afilando até sumir, ele virava lua
crescente acima de 60px e a ponta descia abaixo do que a impressora resolve. Arco
interrompido lê como propagação; lâmina inteiriça lê como corpo celeste. A caixa é
24×16 e não quadrada, porque num quadrado a composição ocupava só a faixa do meio
e o símbolo parecia pequeno ao lado do nome.

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
5. **O símbolo da Impacto Academy foi desenhado aqui**, por falta de arquivo
   oficial: não havia logo no material enviado e `impactoacademy.com.br` não
   resolvia. Se o Valmer tiver o SVG de verdade, a troca é em
   `perfila/src/components/relatorio/MarcaImpacto.tsx` mais
   `perfila/src/app/relatorio/icon.svg`. O arquivo novo precisa continuar legível
   a 14px e impresso em preto e branco, e o laranja só pode entrar como área
   sólida grande ou sobre o navy.

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
