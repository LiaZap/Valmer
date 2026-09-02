# Onde paramos

Documento de continuidade. Serve para retomar o trabalho sem depender do
histórico da conversa que o produziu.

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

**Portal do Parceiro**, 21 telas. Dashboard, assessments (lista e criação),
campanhas, DNA organizacional, arquitetura de cargos, devolutiva, benefícios,
créditos, degustação, clientes, cursos, mentores, EAD, integrações, configurações
e suporte.

**Administração**, 6 telas. Visão geral com métricas derivadas dos dados,
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

## O que NÃO está pronto

Tudo isto é protótipo de interface. Não existe backend.

- **Banco de dados.** A especificação define as tabelas (`users`, `assessments`,
  `results`, `answers`, `credit_transactions`) e recomenda PostgreSQL com Prisma.
  Hoje os dados são fixos, em `perfila/src/data/`.
- **Autenticação.** O login é fachada. Não há sessão, senha nem o 2FA do admin.
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
relatório derivam do mesmo número, então não podem divergir.

**As cores DISC têm duas versões.** As de `--color-disc-*` servem para texto sobre
tinta clara. Como área preenchida elas falham em contraste, então existem
`--chart-disc-*`, validadas para luminosidade, croma, separação sob daltonismo e
contraste com a superfície.

**O laranja da Impacto não entra no gráfico.** Ele e o âmbar do fator Influência
têm ΔE 5,2 em visão normal, contra um piso de 15: lado a lado ninguém distingue os
dois. E sobre o creme da marca o laranja dá 2,52:1, abaixo do piso de 3:1 até para
elemento de interface. No relatório ele aparece sobre o navy, onde dá 6,08:1, e
como forma decorativa sólida. Quem carrega texto de acento é o navy.

**Só o relatório assina como Impacto Academy.** Login, assessment, admin e portal
do parceiro continuam Perfila, porque a especificação diz que cada facilitador tem
painel com a marca dele e que o PDF é que leva a marca da Impacto. A troca vive em
três lugares, todos exclusivos da rota do relatório: o tema escopado
`tema-impacto.module.css`, o componente `MarcaImpacto` e o ícone
`app/relatorio/icon.svg`. Não mexa em `styles/tokens.css`, em `components/layout/Logo.tsx`
nem em `app/icon.svg`: os três parecem o lugar certo e valem para o produto inteiro.

**O símbolo tem as pontas cortadas retas.** Afilando até sumir, ele virava lua
crescente acima de 60px e a ponta descia abaixo do que a impressora resolve. Arco
interrompido lê como propagação; lâmina inteiriça lê como corpo celeste. A caixa é
24×16 e não quadrada, porque num quadrado a composição ocupava só a faixa do meio e
o símbolo parecia pequeno ao lado do nome.

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
chamado por `fetch` cru. Esse identificador não existe mais. O código usa o SDK
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
3. **Os textos dos 10 pilares** do mapa de autoavaliação são provisórios. Só o
   pilar Espiritual veio do sistema original, com as perguntas de apoio.
4. **Fotos de cursos e mentores** seguem como espaço reservado.

---

## Material de origem

Está em `contexto/`. Comece pela especificação: ela é a fonte de verdade do
produto. Veja `contexto/README.md`.

---

## Histórico

Seis commits, do protótipo inicial ao relatório. `git log` conta a sequência, e
cada mensagem registra o porquê das decisões, não só o quê.
