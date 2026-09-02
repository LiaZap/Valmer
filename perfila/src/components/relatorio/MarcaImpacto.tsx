/**
 * Marca Impacto Academy
 * ---------------------
 * Símbolo e assinatura do relatório. Vive em `components/relatorio/`
 * de propósito: o relatório é o único artefato que sai da plataforma e
 * chega ao cliente final do facilitador, então é o único lugar que
 * assina como Impacto Academy. Login, assessment, admin e portal do
 * parceiro continuam sendo Perfila, e continuam usando `LogoMark`.
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
 *   navy fica na onda, que é a forma que afina. Isso não é gosto: o
 *   laranja da marca dá 2,52:1 sobre o creme, abaixo do piso de 3:1
 *   até para elemento de interface. Como área grande ele é decoração e
 *   o contraste não governa; como traço fino ele sumiria.
 *
 * Nunca espelhe o símbolo nem o coloque à direita do nome: a onda
 * aponta para dentro do nome, e invertida ela joga a energia para fora
 * da página.
 */

type MarcaImpactoProps = {
  /** Altura em px. A largura sai da proporção 24:16. */
  size?: number
  /**
   * Cor da onda. O padrão vem do acento do tema (navy). Sobre o card
   * escuro a onda precisa virar creme, senão ela some no fundo.
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
      <circle cx="9" cy="8" r="6.6" fill="var(--color-realce)" />
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
