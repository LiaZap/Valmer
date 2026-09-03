# ADR-0004: Better Auth sobre o schema existente

- **Status**: Aceito
- **Data**: 2026-09-03
- **Decisores**: Paulo (cliente do repositorio), lead
- **Substitui**: ADR-0003

## Contexto

O ADR-0003 implementou autenticacao a mao: scrypt do `node:crypto`, tabela
`sessoes` propria e `signIn`/`signOut` escritos aqui. Funcionava — 43 testes
verdes, matriz de rotas verificada — mas era codigo de seguranca mantido por
nos, sem recuperacao de senha, sem 2FA, sem OAuth e sem ninguem de fora
olhando.

Paulo pediu Better Auth. E biblioteca ativa, feita para TypeScript, com adapter
oficial de Drizzle, e traz de graca o que ficaria como pendencia nossa por
tempo indeterminado.

## Decisao

Better Auth 1.7 como camada de autenticacao, **mapeado sobre as tabelas que ja
existiam**, e nao sobre as tabelas padrao dele.

- `usuarios` continua sendo o modelo `user`. Ela ja tinha dados, FKs de
  `assessments` e `creditos_transacoes` apontando para ela, e as colunas de
  dominio do produto (papel, creditos, empresa, telefone). Duplicar pessoas em
  duas tabelas seria a pior das saidas.
- `papel`, `creditos`, `empresa`, `telefone` e `ativo` entram como
  `additionalFields`, todos com `input: false`: sao decisoes do negocio e
  nenhum deles pode chegar pelo corpo de um POST. Papel definido pelo proprio
  usuario seria escalonamento de privilegio; saldo, credito de graca.
- A senha saiu de `usuarios.senha_hash` e passou para `contas`, que e como a
  biblioteca organiza credenciais. Isso abre caminho para login por Google um
  dia sem mexer no usuario.
- `sessoes`, `contas` e `verificacoes` carregam as quatro colunas de auditoria
  do projeto, com default onde a biblioteca nao as preenche. Ela ignora coluna
  que nao conhece.
- `getSession()` mantem o formato de retorno anterior (`userId`, `papel`,
  `nome`). As actions de assessment ja dependiam dele, e trocar de biblioteca
  de autenticacao nao e motivo para mexer em regra de negocio.
- O que continua nosso: a mensagem unica de credencial invalida, o limite de
  tentativas e o destino por papel. Sao regras do produto, nao da biblioteca.

## Alternativas Consideradas

- **Manter a implementacao do ADR-0003**: menos dependencia e o token de sessao
  guardado como hash (ver Consequencias). Mas recuperacao de senha, 2FA e
  verificacao de e-mail continuariam sendo trabalho nosso, um por um.
- **Adotar as tabelas padrao do Better Auth**: seria a integracao mais direta,
  e teria criado uma segunda tabela de pessoas ao lado de `usuarios`, com as
  FKs do produto apontando para uma e a autenticacao para a outra.

## Consequencias

- **O token de sessao passa a ser guardado em claro.** A implementacao anterior
  gravava so o `sha256` dele; o Better Auth le a coluna `token` diretamente e
  nao ha como interpor um hash sem reescrever o adapter. Quem tiver leitura da
  tabela `sessoes` consegue se passar por qualquer sessao viva. E o custo real
  desta troca, e o que o mitiga e restringir acesso ao banco de producao.
- Uma dependencia nova, com o que ela traz junto.
- Recuperacao de senha, verificacao de e-mail e 2FA passam a ser configuracao,
  e nao implementacao. Nenhum deles esta ligado ainda: falta o envio de e-mail
  (Resend), e o 2FA do admin que a especificacao pede continua pendente.
- O emissor da credencial vem de `createLocalAccountIssuer("credential")`, e
  nao da string literal. Escrever `"credential"` a mao fazia a conta existir no
  banco e o login recusar assim mesmo, sem erro que explicasse — ha um teste
  fixando isso.
- O `senha.ts` que escrevemos foi removido. Se um dia a biblioteca sair, o
  ADR-0003 continua no historico com a implementacao que funcionava.
