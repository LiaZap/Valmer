'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { removerPendentesPelaTela } from '@/lib/actions/envio-lote'

/**
 * Remover pendentes: a única ação desta tela que grava, e por isso a única
 * parte dela que precisa do cliente.
 *
 * A confirmação diz os DOIS números antes de qualquer coisa acontecer —
 * quantos passaportes somem e quantos créditos voltam. Sem eles a pergunta
 * seria "tem certeza?", que ninguém consegue responder: a diferença entre
 * remover 2 e remover 40 é toda a decisão.
 *
 * Confirmação nativa de propósito: a exclusão é lógica, a linha continua no
 * banco, o crédito volta, e o projeto não tem componente de diálogo. Mesmo
 * critério da carteira de clientes — um modal só para esta pergunta seria mais
 * código que a regra que ele protege.
 *
 * Os números vêm da página, que já carregou os mapas; quem manda de verdade é
 * a action, que reconta com a linha do dono travada dentro da transação. Por
 * isso o botão pode ser recusado mesmo com a tela mostrando pendentes: outra
 * aba pode ter removido antes.
 */
export function AcoesTurma({
  turmaId,
  nome,
  pendentes,
  creditos,
}: {
  turmaId: string
  nome: string
  pendentes: number
  creditos: number
}) {
  const { toast } = useToast()
  const [removendo, remover] = useTransition()

  function confirmar() {
    const pergunta =
      `Remover ${pendentes} passaporte(s) ainda não respondido(s) da turma "${nome}"?\n\n` +
      `Voltam ${creditos} crédito(s) para o seu saldo. Quem já respondeu não é tocado.`

    if (!window.confirm(pergunta)) return

    remover(async () => {
      const resposta = await removerPendentesPelaTela(turmaId)

      if (!resposta.ok) {
        toast(resposta.erro)
        return
      }

      toast(
        `${resposta.dado.removidos} passaporte(s) removido(s). ${resposta.dado.creditos} crédito(s) voltaram ao saldo.`,
      )
    })
  }

  return (
    <Button
      variant="danger"
      icon={<Icon name="trash" />}
      onClick={confirmar}
      // Sem pendente não há o que remover, e a action recusaria com uma
      // mensagem que o botão já poderia ter evitado.
      disabled={pendentes === 0 || removendo}
    >
      {removendo ? 'Removendo…' : 'Remover pendentes'}
    </Button>
  )
}
