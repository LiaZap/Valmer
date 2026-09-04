/**
 * Marca Impacto
 * -------------
 * Símbolo único do produto. Vive em `components/layout/` porque vale
 * para o produto inteiro: login, assessment, admin, portal do parceiro
 * e relatório. Até 03/09/2026 era exclusiva do relatório e as telas
 * usavam `LogoMark`, a marca da Perfila — o Paulo decidiu marca única
 * e `LogoMark` foi aposentada.
 *
 * O nome escrito ao lado do símbolo muda conforme quem assina: o
 * software assina "Impacto DISC" (o produto) e o relatório assina
 * "Impacto Academy" (a empresa, que é quem responde perante o cliente
 * final do parceiro). O símbolo é o mesmo nos dois.
 *
 * O desenho são duas massas cheias: um disco (o ponto de impacto) e
 * uma onda logo à direita dele, separados por um canal de largura
 * constante. O canal é paralelo à borda do disco, então o olho lê as
 * duas formas como uma peça só que se abriu.
 *
 * Três decisões que parecem detalhe e não são:
 *
 * - As pontas da onda são CORTADAS RETAS, e não afiladas até sumir.
 *   Afilando, duas coisas quebravam: a ponta descia abaixo do que a
 *   impressora resolve, e o conjunto virava lua crescente em vez de
 *   onda. Arco interrompido lê como propagação; lâmina inteiriça lê
 *   como corpo celeste.
 * - A caixa é 24×16, e não quadrada. A composição é horizontal, e num
 *   quadrado ela ocupava só a faixa do meio: ao lado do nome em fonte
 *   display, o símbolo parecia pequeno demais. Aqui `size` é a ALTURA.
 * - O laranja fica no disco, que é a maior área sólida do desenho, e o
 *   azul fica na onda, que é a forma que afina. Isso não é gosto: o
 *   Laranja Impacto dá 2,56:1 sobre a Areia, abaixo do piso de 3:1 até
 *   para elemento de interface. Como área grande ele é decoração e o
 *   contraste não governa; como traço fino ele sumiria.
 *   Impresso em preto e branco o disco cai para 2,73:1 contra o papel
 *   enquanto a onda fica em 16,57:1: numa fotocópia a onda sai preta e
 *   o disco desbota. O `@media print` de `globals.css` já passa
 *   `--color-marca-disco` para o azul, e aí o símbolo sai de uma cor só.
 *
 * Nunca espelhe o símbolo nem o coloque à direita do nome: a onda
 * aponta para dentro do nome, e invertida ela joga a energia para fora
 * da página.
 */

type MarcaImpactoProps = {
  /** Altura em px. A largura sai da proporção 24:16. */
  size?: number
  /**
   * Cor da onda. O padrão vem do acento do tema, que é o Azul Impacto.
   * Sobre o quadrado azul da marca a onda precisa virar Areia
   * (`--color-marca-onda`), senão ela some no fundo.
   */
  onda?: string
}

export function MarcaImpacto({ size = 16, onda = 'var(--color-accent)' }: MarcaImpactoProps) {
  return (
    <svg
      width={(size * 24) / 16}
      height={size}
      viewBox="0 0 24 16"
      fill="none"
      aria-hidden
      style={{ flex: 'none' }}
    >
      <circle cx="9" cy="8" r="6.6" fill="var(--color-marca-disco)" />
      <path
        d="M16.59 2.8H19.19A6.81 6.81 0 0 1 19.19 13.2H16.59A9.2 9.2 0 0 0 16.59 2.8Z"
        fill={onda}
      />
    </svg>
  )
}

/** O nome por extenso, do jeito que ele assina em todo o documento. */
export const NOME_MARCA = 'Impacto Academy'

/**
 * Linha de crédito do rodapé, exigida pela especificação do cliente
 * (seção "Estrutura do Relatório", rodapé). O site e o telefone são da
 * Impacto Academy, e não do facilitador que emitiu: quem emitiu já está
 * nomeado no bloco ao lado.
 */
export const CREDITO_MARCA = {
  site: 'impactoacademy.com.br',
  telefone: '(44) 99159-5998',
}
