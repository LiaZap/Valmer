import type { CSSProperties, ReactNode } from 'react'
import styles from './Table.module.css'

export { styles as tableStyles }

type Align = 'left' | 'right' | 'center'

const ALIGN_CLASS: Record<Align, string | null> = {
  left: null,
  right: styles.alignRight,
  center: styles.alignCenter,
}

/**
 * Tabela de dados do sistema.
 *
 * Acima de 720px é tabela: o card em volta é quem rola horizontalmente
 * (`<Card scrollX>`), então a página nunca ganha barra horizontal.
 *
 * Abaixo de 720px ela para de ser tabela — cada linha vira um cartão
 * empilhado e o cabeçalho some, porque uma tabela de 720px num telefone de
 * 390px obriga a arrastar para ler a última coluna, e as primeiras somem.
 *
 * Trocar o `display` apaga a semântica que o leitor de tela usa para anunciar
 * linha e coluna. Por isso cada parte declara o `role` à mão: no desktop eles
 * repetem o que o elemento já diz, no telefone são a única coisa que sobra.
 * O `<tbody>` não passa por aqui — quem o escreve é a tela, e é lá que ele
 * leva `role="rowgroup"`.
 */
export function Table({
  children,
  compact,
}: {
  children: ReactNode
  /** Dispensa a largura mínima — para tabelas resumo em coluna estreita. */
  compact?: boolean
}) {
  return (
    <table
      role="table"
      className={[styles.table, compact ? styles.compact : null].filter(Boolean).join(' ')}
    >
      {children}
    </table>
  )
}

export function Th({
  children,
  align = 'left',
  style,
}: {
  children?: ReactNode
  align?: Align
  /** Larguras de coluna (min-width / width) quando necessário. */
  style?: CSSProperties
}) {
  return (
    <th
      scope="col"
      role="columnheader"
      className={[styles.th, ALIGN_CLASS[align]].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  align = 'left',
  dense,
  muted,
  rotulo,
  className,
}: {
  children?: ReactNode
  align?: Align
  /** Reduz o espaçamento vertical (linhas com avatar). */
  dense?: boolean
  /** Texto secundário em cinza. */
  muted?: boolean
  /**
   * Nome da coluna, repetido aqui porque no cartão do telefone o cabeçalho da
   * tabela não existe e "12" sozinho não diz se é saldo ou mapa. Vira
   * `data-rotulo` e o CSS o imprime acima do valor abaixo de 720px.
   *
   * Fica de fora na célula que ABRE o cartão (o nome, que é o título) e na que
   * o FECHA (os botões, cada um já com o próprio `label`).
   *
   * Não dá para deduzir do `<Th>`: três tabelas escondem coluna por condição,
   * e o `createContext` que levaria a lista do cabeçalho até aqui não existe
   * em Server Component — que é o que `TabelaExtrato` e a lista de DNA são.
   */
  rotulo?: string
  className?: string
}) {
  return (
    <td
      role="cell"
      data-rotulo={rotulo}
      className={[
        styles.td,
        ALIGN_CLASS[align],
        dense ? styles.dense : null,
        muted ? styles.muted : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </td>
  )
}

export function Tr({ children }: { children: ReactNode }) {
  return (
    <tr role="row" className={styles.row}>
      {children}
    </tr>
  )
}

/** Agrupa os botões de ação no fim da linha. */
export function RowActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}

/** Barra de filtros acima da tabela. */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className={styles.filters}>{children}</div>
}

/**
 * Rodapé com contagem e, opcionalmente, paginação.
 *
 * A contagem é uma região viva PERMANENTE. Quando um filtro muda o número de
 * linhas, a tabela se altera longe do foco e um leitor de tela não teria como
 * saber. O elemento precisa existir desde o primeiro render: criado junto com o
 * texto novo, o anúncio não sai. Numa tabela sem filtro o texto nunca muda,
 * então nada é anunciado.
 */
export function TableFooter({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className={styles.footer}>
      <span role="status" aria-live="polite">
        {children}
      </span>
      {actions ? <div className={styles.pagination}>{actions}</div> : null}
    </div>
  )
}
