# REBRAND · Item 4 · NOMENCLATURA

Este arquivo responde ao item que faltava. Ele é para ser lido inteiro, e é
suficiente para executar sozinho: traz a decisão, onde cada nome entra, os
arquivos exatos e o que não pode ser tocado.

Ele trata **só de nomenclatura**. A parte visual (promover o tema, os tokens, o
anel de foco) é dos itens anteriores e não é redecidida aqui.

---

## 1. A decisão

Dois nomes, com papéis diferentes. Nenhum dos dois é "Perfila".

| Nome | O que é | Onde assina |
| --- | --- | --- |
| **Impacto Academy** | a empresa | o relatório, que é o que chega ao cliente final do parceiro |
| **Impacto DISC** | o produto | o software: login, painéis, assessment, abas |

**"Perfila" sai de tudo que o usuário vê.** Sobrevive apenas como caminho: a
pasta `perfila/`, o endereço do repositório e o que já está em commit antigo.

Escrita do nome, sem variação:

- `Impacto DISC`, com DISC sempre em caixa alta. Nunca "Impacto Disc",
  "Impacto disc" nem "IMPACTO DISC" fora de rótulo que já é todo em caixa alta.
- `Impacto Academy`, sem "by", sem "®", sem hífen.
- Os dois juntos aparecem apenas no relatório, e em linhas separadas. Nunca
  "Impacto DISC by Impacto Academy" nem "Impacto Academy Impacto DISC".

---

## 2. O risco que precisa ser lido antes de qualquer edição

Não faça localizar e substituir de "Perfil" para "Impacto DISC". Medido no
código de hoje:

| Padrão | Ocorrências | O que é |
| --- | --- | --- |
| `Perfila` | 21 | a marca. É isto que sai. |
| `perfil` / `Perfil` sem o "a" final | 171 | vocabulário do domínio. Não toque. |

Os 171 incluem `PerfilEstatico`, `perfilPrimario`, `perfilSecundario`,
`perfisEstaticos`, `getPerfilEstatico`, `perfilNatural`, `perfilAdaptado`, e a
palavra "perfil" no texto de cada uma das 13 seções do relatório, que é o assunto
do produto e continua sendo escrita assim.

A busca segura é a palavra inteira `Perfila`, com P maiúsculo e o "a" final.

---

## 3. Onde cada nome entra, superfície por superfície

### O software passa a ser Impacto DISC

| Arquivo | Linha | Hoje | Passa a ser |
| --- | --- | --- | --- |
| `src/app/layout.tsx` | 26 | `title: 'Perfila'` | `title: 'Impacto DISC'` |
| `src/app/page.tsx` | 47 | `Perfila` (login) | `Impacto DISC` |
| `src/app/admin/layout.tsx` | 6 | `'Perfila · Administração'` | `'Impacto DISC · Administração'` |
| `src/app/facilitador/layout.tsx` | 7 | `'Perfila · Portal do Parceiro'` | `'Impacto DISC · Portal do Parceiro'` |
| `src/app/avaliacao/layout.tsx` | 6 | `'Perfila · Assessment'` | `'Impacto DISC · Assessment'` |
| `src/app/avaliacao/layout.tsx` | 24 | `Perfila` (cabeçalho) | `Impacto DISC` |
| `src/components/layout/Sidebar.tsx` | 42 | `Perfila` | `Impacto DISC` |
| `src/components/layout/AppShell.tsx` | 66 | `© {ano} Perfila` | `© {ano} Impacto Academy` |

O rodapé do AppShell é a exceção da lista: copyright é da **empresa**, não do
produto.

### Três textos de conteúdo, que pedem redação e não troca de palavra

| Arquivo | Linha | Hoje | Passa a ser |
| --- | --- | --- | --- |
| `src/app/facilitador/ead/page.tsx` | 19 | "Capacitação oficial para analistas Perfila." | "Capacitação oficial para analistas Impacto DISC." |
| `src/app/facilitador/ead/page.tsx` | 37 | "Apresentação da plataforma Perfila" | "Apresentação da plataforma Impacto DISC" |
| `src/app/facilitador/configuracoes/page.tsx` | 106 | "Comunicações da Perfila" | "Comunicações da Impacto Academy" |

O de configurações troca para a empresa: quem manda e-mail para o parceiro é a
Impacto Academy, não o produto.

### Um texto herdado da plataforma antiga

`src/data/respondente.ts`, linha 196: *"A Perfila e {analista} agradecem a sua
disponibilidade..."*

Este texto veio do sistema original e hoje só é consumido por
`RodaAutoavaliacao.tsx`, que nenhum componente do relatório importa. Troque para
"A Impacto Academy e {analista} agradecem", e não para o nome do produto: quem
agradece ao lado do analista é a empresa.

### O relatório: o que muda e o que não muda

O relatório continua assinando **Impacto Academy**, nos três lugares onde assina
hoje. Isso não muda. O que entra é o nome do instrumento, onde hoje está a
descrição genérica:

| Arquivo | Linha | Hoje | Passa a ser |
| --- | --- | --- | --- |
| `src/components/relatorio/CapaResumo.tsx` | 64 | `Inventário comportamental` | `Impacto DISC` |
| `src/components/relatorio/PlanoFecho.tsx` | 190 | `Inventário comportamental · {tipo}` | `Impacto DISC · {tipo}` |

`NOME_MARCA` e `CREDITO_MARCA`, em `MarcaImpacto.tsx`, ficam como estão.

---

## 4. Os dois símbolos viram um

Hoje existem duas marcas visuais, e a decisão de nome resolve as duas:

- `src/components/layout/Logo.tsx` (`LogoMark`), quatro barras verdes, era a
  marca da Perfila. **É aposentada.** Importada hoje por `Sidebar.tsx`,
  `app/page.tsx` e `app/avaliacao/layout.tsx`.
- `src/components/relatorio/MarcaImpacto.tsx`, disco e onda em laranja e navy,
  era exclusiva do relatório. **Passa a ser a marca do produto inteiro.**

Isso implica mover `MarcaImpacto.tsx` de `components/relatorio/` para
`components/layout/`, porque ela deixa de ser exclusiva do relatório. Ao mover,
o comentário de cabeçalho dela precisa ser reescrito: ele hoje afirma
explicitamente que login, assessment, admin e portal continuam sendo Perfila e
continuam usando `LogoMark`. Essa frase passa a ser falsa.

`src/app/icon.svg`, o favicon de todas as rotas, é quadrado verde com as quatro
barras. Passa a ser o mesmo desenho de `src/app/relatorio/icon.svg`, que já
existe pronto: navy com disco laranja e onda creme. Com os dois iguais,
`src/app/relatorio/icon.svg` deixa de ter razão de existir e pode sair.

Ressalva de impressão, medida e sem registro em outro lugar: no relatório em
preto e branco o disco laranja dá 2,73:1 contra o papel e a onda dá 16,57:1.
Numa fotocópia a onda sai preta e o disco desbota. Se o símbolo for usado em
algum material que só existe em P&B, use a versão de uma cor só.

---

## 5. O que NÃO muda

- **A pasta `perfila/`.** É caminho, não marca. Renomeá-la quebra todo import
  relativo do repositório, todo link deste documento e do `CONTINUIDADE.md`, e
  não muda uma linha do que o usuário vê.
- **O endereço do repositório**, `github.com/LiaZap/Valmer`.
- **`AGENTS.md` e `CLAUDE.md`**, que trazem "Valmer (Perfila)" no título. É
  identificador de repositório, não marca de produto. Podem ser ajustados
  depois, e não fazem parte deste item.
- **Os 171 usos de "perfil" como substantivo comum**, incluindo todos os
  identificadores de código listados na seção 2.
- **O histórico de commits.** Mensagens antigas dizem Perfila porque era verdade
  quando foram escritas.

---

## 6. Depois de executar

1. `npm run build` e `npx tsc --noEmit`, a partir de `perfila/`.
2. `grep -rn "Perfila" perfila/src/` precisa voltar apenas comentários de código
   que falam do passado, e nenhum texto visível nem metadata.
3. Abrir `/`, `/admin`, `/facilitador`, `/avaliacao/demo` e `/relatorio/k3mq81` e
   conferir o nome e o símbolo em cada um.
4. Atualizar `CONTINUIDADE.md` e `PROMPT-INICIAL.md`: as duas armadilhas que
   dizem "só o relatório assina como Impacto Academy" deixam de valer, e a que
   proíbe editar `tokens.css`, `Logo.tsx` e `app/icon.svg` inverte o veredito.
   O motivo dela continua verdadeiro, e é por isso que a edição agora é
   deliberada em vez de proibida.

---

## 7. O que este item não decide

- **O domínio.** `impactoacademy.com.br` está no rodapé do relatório e não
  resolveu quando foi testado. Se o produto tiver endereço próprio, ele entra
  aqui e no `CREDITO_MARCA`.
- **O logo oficial.** O símbolo em uso foi desenhado por falta de arquivo do
  cliente. Se chegar o SVG de verdade, ele substitui o desenho atual, e a troca
  passa a ser em um arquivo só depois que a unificação da seção 4 estiver feita.
- **Se "Impacto DISC" é registrável.** "DISC" é termo de domínio público, e o
  nome depende de "Impacto" na classe certa. É questão jurídica, não técnica.
