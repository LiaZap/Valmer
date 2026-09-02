# ADR-0002: Sentinela para as gravacoes do respondente

- **Status**: Aceito
- **Data**: 2026-09-02
- **Decisores**: Prumo (arquiteto)

## Contexto

`modified_by` e coluna de auditoria obrigatoria e `NOT NULL` em toda tabela do
projeto (ADR-0001, docs/back.md). A rota `/avaliacao/<token>` grava respostas e
fecha o assessment, mas quem responde nao e usuario da plataforma: nao tem
cadastro, nao tem login, nao tem linha em `usuarios`. O token e a credencial
inteira (RN-103). Ainda assim, cada INSERT e UPDATE precisa dizer quem alterou
a linha.

## Decisao

As linhas gravadas pelo respondente sao assinadas com a sentinela
`00000000-0000-0000-0000-000000000000`, na constante `RESPONDENTE` de
`src/lib/actions/avaliacao.ts`. `modified_by` nao tem FK, entao o valor nao
precisa existir em `usuarios`.

## Alternativas Consideradas

- **Gravar o id do facilitador**: afirmaria na trilha que ele proprio respondeu
  o assessment que aplicou. E falso, e e exatamente a mentira que uma coluna de
  auditoria nao pode contar. Rejeitado.
- **Tornar `modified_by` nullable nestas tabelas**: exigiria migracao e quebraria
  a regra de colunas de auditoria obrigatorias, para resolver com schema o que
  uma constante resolve. Rejeitado.
- **Criar um usuario "sistema" real em `usuarios`**: uma linha fantasma que
  aparece em listagens, contagens e telas de admin, e que alguem um dia edita ou
  desativa sem saber o que ela e. Rejeitado.

## Consequencias

### Positivas
- A trilha distingue "o respondente gravou" de "o facilitador gravou", sem
  inventar um usuario.
- Custa uma constante local: nenhuma migracao, nenhum dado novo.

### Negativas / Trade-offs
- O relatorio de auditoria precisa saber traduzir a sentinela para
  "respondente"; exibida crua, ela e um UUID de zeros sem significado.
- Um JOIN ingenuo de `auditoria` com `usuarios` nao encontra o autor destas
  linhas.

### Neutras
- O mesmo UUID aparece em `tests/` como valor de fixture, com outra semantica.
  Sao dois usos, em camadas diferentes, e por isso a constante NAO foi extraida
  para um modulo compartilhado. Quando surgir um terceiro ator nao humano — o
  job que gera a narrativa, por exemplo — vale criar um modulo de sentinelas.
