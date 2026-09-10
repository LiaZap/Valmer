'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/Field'
import { IconButton } from '@/components/ui/IconButton'
import { Row } from '@/components/ui/Layout'

/**
 * O título de um módulo ou de uma aula, corrigível no lugar.
 *
 * Existe porque o programa nasceu sem renomear, com o argumento de que "título
 * errado se resolve excluindo e recriando". Não se resolve: excluir módulo com
 * aula dentro é recusado, e excluir aula leva o vídeo junto. Sem esta porta,
 * corrigir um acento custava reenviar as gravações.
 *
 * Um componente para os dois, e não um editor em cada: o gesto é o mesmo, e a
 * segunda cópia é a que fica com o `Escape` quebrado.
 *
 * `Escape` desfaz e `Enter` grava porque é o que se espera de um campo que
 * abriu em cima de um texto. Sem o desfazer, quem clicou no lápis por engano
 * não tem saída a não ser recarregar a página.
 */
export function TituloEditavel({
  titulo,
  rotulo,
  prefixo,
  className,
  gravando,
  onGravar,
}: {
  titulo: string
  /** Nome acessível do campo. Sem texto visível, é a única pista do que se edita. */
  rotulo: string
  /** Texto fixo antes do título, como "Módulo 01 · ". Não entra na edição. */
  prefixo?: string
  className?: string
  gravando: boolean
  onGravar: (titulo: string) => void
}) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(titulo)

  function gravar() {
    const limpo = rascunho.trim()
    setEditando(false)
    // Título igual ao que já está lá não vira gravação: seria uma linha de
    // auditoria dizendo que alguém renomeou algo para o mesmo nome.
    if (limpo.length > 0 && limpo !== titulo) onGravar(limpo)
    else setRascunho(titulo)
  }

  if (!editando) {
    return (
      <Row gap={4}>
        <span className={className}>
          {prefixo}
          {titulo}
        </span>
        <IconButton
          icon="edit"
          label={`Renomear ${rotulo}`}
          iconSize={13}
          disabled={gravando}
          onClick={() => {
            setRascunho(titulo)
            setEditando(true)
          }}
        />
      </Row>
    )
  }

  return (
    <Row gap={4}>
      <Input
        autoFocus
        value={rascunho}
        aria-label={`Renomear ${rotulo}`}
        disabled={gravando}
        onChange={(evento) => setRascunho(evento.target.value)}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter') gravar()
          if (evento.key === 'Escape') {
            setRascunho(titulo)
            setEditando(false)
          }
        }}
      />
      <IconButton icon="check" label="Gravar título" disabled={gravando} onClick={gravar} />
      <IconButton
        icon="fechar"
        label="Cancelar"
        disabled={gravando}
        onClick={() => {
          setRascunho(titulo)
          setEditando(false)
        }}
      />
    </Row>
  )
}
