# Perfila · Portal do Analista

Implementação em **Next.js (App Router) + TypeScript + CSS Modules** do protótipo
`Perfila.dc.html`, exportado do Claude Design.

São **19 telas**, cada uma com sua própria URL, montadas sobre um design system
com tokens — nenhum valor de cor, fonte ou espaçamento é escrito solto no código.

---

## Como rodar

Você precisa do [Node.js](https://nodejs.org) 20 ou superior instalado.

```bash
npm install     # instala as dependências (só na primeira vez)
npm run dev     # sobe o ambiente de desenvolvimento
```

Depois abra <http://localhost:3000> no navegador.

Outros comandos:

| Comando             | O que faz                                              |
| ------------------- | ------------------------------------------------------ |
| `npm run dev`       | Ambiente de desenvolvimento, com recarga automática     |
| `npm run build`     | Gera a versão otimizada para produção                   |
| `npm start`         | Sobe a versão de produção (rode `build` antes)          |
| `npm run typecheck` | Confere os tipos do TypeScript sem gerar arquivos       |

---

## As 19 telas

| Grupo           | Tela                    | URL                    |
| --------------- | ----------------------- | ---------------------- |
| **Operação**    | Dashboard               | `/`                    |
|                 | Envio Rápido            | `/envio-rapido`        |
|                 | Campanhas               | `/campanhas`           |
|                 | Criar campanha          | `/campanhas/nova`      |
|                 | DNA Organizacional      | `/dna`                 |
|                 | Novo DNA                | `/dna/novo`            |
|                 | DNA aberto              | `/dna/[slug]`          |
|                 | Arquitetura de Cargos   | `/arquitetura`         |
|                 | Devolutiva              | `/devolutiva`          |
| **Conta**       | Programa de Benefícios  | `/beneficios`          |
|                 | Créditos                | `/creditos`            |
|                 | Degustação              | `/degustacao`          |
|                 | Clientes                | `/clientes`            |
| **Aprendizado** | Cursos                  | `/cursos`              |
|                 | Mentores Especialistas  | `/mentores`            |
|                 | EAD                     | `/ead`                 |
| **Sistema**     | Integrações             | `/integracoes`         |
|                 | Configurações           | `/configuracoes`       |
|                 | Suporte                 | `/suporte`             |

O item da sidebar continua destacado nas telas filhas: `/campanhas/nova` mantém
"Campanhas" aceso, e `/dna/novo` mantém "DNA Organizacional".

---

## Organização das pastas

```
src/
├── app/                    Uma pasta por rota (padrão do App Router)
│   ├── layout.tsx          Fontes, metadados e a moldura da aplicação
│   ├── globals.css         Reset, foco, scrollbar e checkbox do sistema
│   ├── page.tsx            Dashboard
│   ├── icon.svg            Favicon (a marca Perfila)
│   └── <rota>/
│       ├── page.tsx        A tela
│       └── page.module.css O CSS exclusivo dela
│
├── components/
│   ├── layout/             AppShell, Sidebar, Topbar, marca
│   └── ui/                 Biblioteca de componentes reutilizáveis
│
├── data/                   Dados de exemplo, tipados e separados da interface
├── lib/                    Rotas, formatação de data e utilitários de texto
└── styles/
    ├── tokens.css          ★ O design system (cores, tipografia, medidas)
    └── common.module.css   Classes de texto repetidas em várias telas
```

A regra é simples: **nada de valor mágico**. Se você precisar de um verde, ele
vem de `var(--color-accent)`; se precisar de um raio de 12px, vem de
`var(--radius-2xl)`. Para mudar a identidade da plataforma inteira, mexa em
`src/styles/tokens.css` — e só nele.

---

## O design system em uma página

### Cores

Neutros quentes ("stone") e **um único acento** verde-floresta. Foi uma decisão
de projeto: um acento só mantém a tela calma e faz a ação principal saltar.

| Papel                | Token                    | Valor     |
| -------------------- | ------------------------ | --------- |
| Fundo da aplicação   | `--color-bg`             | `#F5F3EF` |
| Superfície (cards)   | `--color-surface`        | `#FFFFFF` |
| Borda padrão         | `--color-border`         | `#E6E2DA` |
| Divisória interna    | `--color-border-soft`    | `#EFECE6` |
| Texto principal      | `--color-text`           | `#1C1A17` |
| Texto de apoio       | `--color-text-muted`     | `#6B655C` |
| Metadados            | `--color-text-subtle`    | `#9A938A` |
| **Acento**           | `--color-accent`         | `#2F6B4F` |
| Acento (hover)       | `--color-accent-hover`   | `#24543E` |
| Acento (fundo claro) | `--color-accent-tint`    | `#E8F3EC` |

Status: vermelho `#B3261E` (destrutivo), âmbar `#B45309` (atenção) e azul
`#1F4B8E` (informação) — cada um com sua versão clara de fundo.

Os quatro fatores DISC têm cor fixa no produto inteiro: **D** vermelho,
**I** âmbar, **S** verde e **C** azul.

### Tipografia

- **Sora** nos títulos e números grandes — dá personalidade.
- **Figtree** no texto corrido — legível em 12–13px, que é onde a plataforma vive.

A escala usa nomes numéricos (`--fs-135` = 13,5px) porque o protótipo foi
ajustado no meio-pixel; nomes como "small" ou "medium" perderiam essa precisão.

### Medidas

Raios de 5 a 12px (`--radius-*`), alturas de controle padronizadas
(`--control-md` 36px para botões, `--control-lg` 38px para campos) e a
grade de layout (sidebar 248px, recolhida 68px, topo 64px).

---

## Componentes

Em `src/components/ui/`:

| Componente        | Para quê                                                        |
| ----------------- | --------------------------------------------------------------- |
| `Button`          | Toda ação. Com `href` vira link; sem, vira botão                 |
| `IconButton`      | Ação só com ícone (linhas de tabela). `label` é obrigatório      |
| `Card`            | A superfície branca. Tons: padrão, escuro e verde                |
| `Select`          | **Dropdown próprio**, com teclado e leitor de tela               |
| `Toggle`          | Interruptor 40×22 (`role="switch"`)                              |
| `Field` / `Input` | Campo com rótulo ligado por `id`                                 |
| `Table` e afins   | Tabela, filtros, ações de linha e rodapé                         |
| `Pill`            | Etiqueta de status, escopo e perfil DISC                          |
| `Progress`        | Barra fina de progresso                                          |
| `Toast`           | Confirmação na base da tela — `useToast()` em qualquer página    |
| `PageHeader`      | Título, subtítulo e ações no topo da tela                        |
| `AutoGrid`        | Grade responsiva (`repeat(auto-fit, minmax(...)))`)              |

### Detalhes que são do sistema, não do navegador

O protótipo foi explícito nisso — *"cada detalhe tem que ser feito pro sistema"*:

- **Scrollbar** fina, com polegar arredondado em stone e sem trilho.
- **Dropdown** próprio no lugar do `<select>` nativo: painel flutuante,
  item ativo com check, fecha ao clicar fora ou com `Esc`.
- **Checkbox** desenhado em CSS (`clip-path`), não o do navegador.
- **Toggle** próprio, com transição no botão deslizante.
- A **sidebar não rola**: os itens cabem inteiros e ela acompanha a altura da
  página. Quem rola é só a página.
- **Tabela larga rola dentro do card**, nunca na página.

---

## Acessibilidade

A implementação vai além do protótipo em alguns pontos, sem mudar o visual:

- O `Select` segue o padrão *combobox*: setas, `Home`/`End`, `Enter` e `Esc`,
  com `aria-activedescendant` e `role="listbox"`.
- Toggles usam `role="switch"` — o leitor de tela anuncia "ligado/desligado".
- Todo botão de ícone tem nome acessível (`aria-label` + tooltip).
- O item de menu atual é marcado com `aria-current="page"`.
- O toast fica numa região `aria-live="polite"`.
- Foco visível por teclado em qualquer elemento interativo.

---

## Dados

Tudo em `src/data/`, tipado e **separado da interface**. Os valores são os mesmos
do protótipo (campanhas, DNAs, respondentes, clientes, benefícios…).

Quando existir uma API de verdade, o caminho é trocar o conteúdo desses módulos
por chamadas ao backend — as telas continuam iguais, porque só consomem os tipos.

---

## Observações

- **Ações são de protótipo.** Botões como *Exportar*, *Baixar PDF* ou *Integrar*
  exibem uma confirmação (toast) em vez de executar de fato. Os pontos de ligação
  com o backend estão isolados nos `onClick` de cada tela.
- **Fotos de cursos e mentores** seguem como espaço reservado, como no protótipo.
  Para usar imagens reais, troque `capa` em `src/data/aprendizado.ts` e o bloco
  `.foto` na tela de mentores.
- **A saudação do Dashboard é dinâmica** ("Bom dia/Boa tarde/Boa noite" e a data
  por extenso), calculada no fuso de Brasília em `src/lib/data-extenso.ts`.
