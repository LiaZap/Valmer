'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { venderPelaTela } from '@/lib/actions/facilitadores'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

export type ParceiroOpcao = { id: string; rotulo: string }

/**
 * Venda de um pacote, dentro do card do pacote.
 *
 * O rótulo do parceiro carrega o e-mail junto porque é ele que é único: dois
 * parceiros homônimos deixariam a escolha ambígua justamente na tela que move
 * crédito. O que viaja para a action é o id, nunca o rótulo.
 *
 * Sem `router.refresh()`: a action invalida o layout de /admin, e o extrato
 * logo abaixo é renderizado no servidor — ele volta atualizado na resposta da
 * própria Server Action.
 */
export function VenderPacote({
  pacote,
  parceiros,
}: {
  pacote: string
  parceiros: ParceiroOpcao[]
}) {
  const { toast } = useToast()
  const [id, setId] = useState(parceiros[0]?.id ?? '')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, iniciarEnvio] = useTransition()

  const rotulo = parceiros.find((parceiro) => parceiro.id === id)?.rotulo ?? ''

  function vender() {
    setErro(null)

    iniciarEnvio(async () => {
      const resposta = await venderPelaTela({ facilitador_id: id, pacote })

      if (!resposta.ok) {
        setErro(resposta.erro)
        return
      }

      toast(
        `${resposta.creditos} créditos para ${resposta.nome}. Saldo agora: ${resposta.saldo}.`,
      )
    })
  }

  // Sem parceiro cadastrado não há a quem vender, e um botão que só sabe
  // recusar é pior que um botão desligado.
  if (parceiros.length === 0) {
    return (
      <div className={styles.venda}>
        <Button disabled>Vender</Button>
        <span className={ui.note}>Nenhum parceiro cadastrado ainda.</span>
      </div>
    )
  }

  return (
    <div className={styles.venda}>
      <Select
        label={`Parceiro que recebe o pacote ${pacote}`}
        size="sm"
        options={parceiros.map((parceiro) => parceiro.rotulo)}
        value={rotulo}
        onChange={(escolhido) => {
          const parceiro = parceiros.find((item) => item.rotulo === escolhido)
          if (parceiro) setId(parceiro.id)
        }}
      />
      <Button onClick={vender} disabled={enviando}>
        {enviando ? 'Vendendo…' : 'Vender'}
      </Button>
      {/* A recusa chega depois do clique, longe de onde se olha. */}
      <div role="status" aria-live="polite">
        {erro ? <span className={ui.note}>{erro}</span> : null}
      </div>
    </div>
  )
}
