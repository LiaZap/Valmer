import { Pill } from '@/components/ui/Pill'
import { Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import type { TipoTransacao, Transacao } from '@/data/facilitadores'
import styles from './TabelaExtrato.module.css'

const ROTULO_TIPO: Record<TipoTransacao, string> = {
  compra: 'Compra',
  uso: 'Uso',
  estorno: 'Estorno',
  bonus: 'Bônus',
}

const TOM_TIPO: Record<TipoTransacao, 'success' | 'neutral' | 'warning'> = {
  compra: 'success',
  uso: 'neutral',
  estorno: 'warning',
  bonus: 'success',
}

/**
 * Extrato de créditos, compartilhado pelos dois ambientes.
 *
 * O admin vê de quem é cada movimento; o parceiro vê só os dele, então a
 * coluna some. Os rótulos de tipo moram aqui e em nenhum outro lugar: com uma
 * cópia por tela, um tipo novo de movimento apareceria nomeado numa e cru na
 * outra.
 *
 * Não é client component: não há estado nenhum aqui, e as duas telas que a
 * usam são renderizadas no servidor.
 */
export function TabelaExtrato({
  itens,
  nomes,
}: {
  itens: Transacao[]
  /**
   * Nome de exibição por id de facilitador. Quando informado, a coluna
   * "Facilitador" aparece — é o que distingue o extrato do admin do extrato
   * de uma conta só.
   */
  nomes?: Record<string, string>
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Data</Th>
          {nomes ? <Th>Facilitador</Th> : null}
          <Th>Movimento</Th>
          <Th>Descrição</Th>
          <Th align="right">Créditos</Th>
        </tr>
      </thead>
      <tbody>
        {itens.map((transacao) => (
          <Tr key={transacao.id}>
            <Td muted>{transacao.data}</Td>

            {nomes ? (
              <Td>
                <span className={tableStyles.primary}>
                  {nomes[transacao.facilitadorId] ?? transacao.facilitadorId}
                </span>
              </Td>
            ) : null}

            <Td>
              <Pill tone={TOM_TIPO[transacao.tipo]}>{ROTULO_TIPO[transacao.tipo]}</Pill>
            </Td>
            <Td muted>{transacao.descricao}</Td>
            <Td align="right">
              {/* O sinal é o dado: sem ele, "2" tanto pode ser compra quanto
                  consumo, e o extrato deixa de explicar o saldo. */}
              <span className={transacao.quantidade < 0 ? styles.saida : styles.entrada}>
                {transacao.quantidade > 0 ? `+${transacao.quantidade}` : transacao.quantidade}
              </span>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
