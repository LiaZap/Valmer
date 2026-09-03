'use client'

import type { ComponentProps } from 'react'
import { Button } from './Button'
import { useToast } from './Toast'

/**
 * Botão de ação ainda não implementada: mostra o aviso e não faz mais nada.
 *
 * Existe por causa da fronteira servidor/cliente. As telas de gestão são
 * Server Components — é lá que a consulta acontece —, e um Server Component
 * não consegue passar `onClick` adiante, porque função não atravessa a
 * serialização. Sem este invólucro, cada tela precisaria virar cliente inteira
 * só para manter um botão de "Exportar" que hoje só emite um toast.
 *
 * Quando a ação existir de verdade, troque a chamada pelo componente próprio
 * dela; este some sozinho quando o último uso sair.
 */
export function BotaoAviso({
  aviso,
  ...props
}: Omit<ComponentProps<typeof Button>, 'onClick' | 'href'> & { aviso: string }) {
  const { toast } = useToast()
  return <Button {...props} onClick={() => toast(aviso)} />
}
