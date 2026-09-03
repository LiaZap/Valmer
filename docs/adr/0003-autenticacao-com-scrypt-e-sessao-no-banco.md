# ADR-0003: Autenticacao com scrypt e sessao no banco

- **Status**: Substituido por [ADR-0004](0004-better-auth-sobre-o-schema-existente.md)
- **Data**: 2026-09-03
- **Decisores**: lead

## Contexto

Ate aqui o login era fachada: `getSession()` lia `SESSAO_DEV_USUARIO_ID` e
devolvia `null` em producao, entao nenhuma action funcionava fora de
desenvolvimento e as sete telas de gestao mostravam dados fixos. As actions de
assessment ja exigiam sessao (`exigirSessao`), so faltava quem a produzisse.

`docs/oauth.md` define a estrategia — sessao em cookie HTTP-only, sem JWT
exposto, expiracao de 24h, mensagem de erro que nao revela se o e-mail existe —
mas foi escrito como template generico: fala de `organizacoes` e do papel
`operador`, que nao existem neste projeto, e pede bcrypt.

## Decisao

Tres pontos, sendo o primeiro um desvio do `docs/oauth.md`:

1. **Hash com `scrypt` do `node:crypto`, e nao bcrypt.** Mesma familia de
   funcao (derivacao lenta, com sal, resistente a hardware dedicado), na lista
   do OWASP ao lado de bcrypt e argon2, e sem acrescentar dependencia a uma
   arvore que hoje tem sete pacotes. O formato guardado carrega o algoritmo
   (`scrypt$sal$hash`), entao trocar de funcao depois nao invalida as senhas
   existentes.
2. **Sessao no banco (`sessoes`), com o cookie carregando so o token.** A
   tabela guarda o `sha256` do token, nunca o token: quem le o banco nao monta
   um cookie valido. Revogar um acesso vira uma linha marcada como apagada, em
   vez de esperar um JWT expirar sozinho.
3. **`proxy.ts` nao decide autenticacao.** Ele so confere que o cookie existe,
   porque roda no runtime de borda e nao alcanca o banco — a propria
   documentacao do Next diz para nao usa-lo como solucao de sessao. Quem valida
   e `exigirSessaoNaTela`, nos layouts de `/admin` e `/facilitador`.

## Alternativas Consideradas

- **bcryptjs, como o docs/oauth.md pede**: seguro e conhecido, mas e uma
  dependencia a mais para o que o Node ja entrega. Se o time preferir bcrypt, a
  troca fica contida em `src/lib/auth/senha.ts` e o formato do hash ja anuncia
  qual algoritmo gerou cada linha.
- **NextAuth.js, como a especificacao do cliente sugere**: resolve OAuth de
  terceiros, que este produto nao tem — sao e-mail e senha, dois papeis, um
  admin so. Traria configuracao e conceitos proprios para substituir cerca de
  cem linhas.
- **JWT assinado, sem tabela**: dispensaria a consulta por requisicao, mas
  desativar um facilitador so teria efeito quando o token vencesse. Num produto
  que vende credito e corta acesso por inadimplencia, revogacao imediata vale
  mais que a consulta poupada.
- **Validar a sessao apenas no proxy**: seria uma consulta a menos por tela,
  mas o runtime de borda nao alcanca o banco, e conferir so a presenca do
  cookie deixava um cookie inventado a mao abrir o portal inteiro — medido
  antes da correcao: `/facilitador` respondia 200 com a tela completa.

## Consequencias

- O login existe de verdade: `/admin` e `/facilitador` exigem sessao valida, e
  cada papel so entra no seu ambiente.
- Toda tela protegida faz uma consulta a mais por requisicao (a linha do
  usuario, para o cabecalho). E o preco da revogacao imediata.
- **2FA do admin, que a especificacao pede, ainda nao existe.** O login e de um
  fator so. Fica registrado como pendencia.
- **Nao ha recuperacao de senha.** O link "esqueci minha senha" saiu da tela,
  porque um link que nao faz nada e pior que a ausencia dele. Definir senha e,
  hoje, `definirSenha()` chamado pelo seed.
- O seed grava a mesma senha para todos os usuarios de exemplo
  (`perfila-dev-2026`), calculada pelo mesmo scrypt de producao.
