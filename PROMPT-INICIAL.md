# Prompt inicial

Copie o bloco abaixo e cole como primeira mensagem numa sessão nova, em qualquer
assistente de código que tenha acesso a este repositório.

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
3. perfila/README.md, para a organização das pastas.
4. git log, para a sequência das decisões.

O QUE É O PRODUTO

Plataforma de Valmer Albuquerque (Impacto Academy) que substitui a
plataforma antiga, CIS Assessment. O negócio é venda de créditos: o dono
vende pacotes a parceiros, e cada avaliação aplicada consome créditos.

Três ambientes, cada um com navegação própria:
- /admin              administração, só o dono
- /facilitador        parceiro ou empresa de RH que compra créditos
- /avaliacao/<token>  quem responde, sem cadastro e sem login

STACK

Next.js 16 (App Router), TypeScript, CSS Modules. O código fica em
perfila/. Rode: cd perfila && npm install && npm run dev

REGRAS DO PROJETO

- Todo valor de cor, fonte, raio e espaçamento vem de um token em
  perfila/src/styles/tokens.css. Nunca escreva um hex solto.
- Interface e comentários em português do Brasil.
- Um arquivo .module.css por componente, ao lado dele.
- Comentário explica POR QUE, nunca o que o código já diz.
- Antes de dar por pronto: npm run build e npx tsc --noEmit.

ESTADO ATUAL

Pronto: design system, as 21 telas do portal do parceiro, as 6 do admin,
o assessment de 28 questões com progresso salvo, e o relatório de 13
seções que imprime em A4.

Não existe backend. Falta banco (PostgreSQL e Prisma), autenticação
(NextAuth, com 2FA no admin), pagamentos (Stripe), e-mail transacional
(Resend) e a geração do PDF no servidor (Puppeteer, renderizando a mesma
rota /relatorio/<token>). Os dados hoje são fixos, em perfila/src/data/.

COMECE ASSIM

Leia os arquivos acima, rode o projeto, navegue pelas três áreas e me
diga o que você entendeu do estado atual antes de propor qualquer
mudança. Se algo na especificação contradisser o código, me pergunte em
vez de escolher sozinho: já existe pelo menos um caso desses documentado
em CONTINUIDADE.md.
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
```

## Se for continuar pelo relatório

```
COMECE ASSIM

O relatório existe e imprime, mas a narrativa dele vem de um exemplo fixo
em perfila/src/data/narrativa-exemplo.ts. A geração real está escrita em
perfila/src/lib/relatorio/gerar.ts e nunca foi executada contra a API.
Configure ANTHROPIC_API_KEY, gere um relatório de verdade e compare o
resultado com o exemplo. Só então mexa no prompt.
```
