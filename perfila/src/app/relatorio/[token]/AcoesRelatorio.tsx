'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

/**
 * As duas ações que existem só na tela.
 *
 * "Baixar PDF" abre a impressão do navegador em vez de gerar o arquivo
 * no servidor: a mesma página, com as regras de @media print, é o que o
 * Puppeteer vai renderizar em produção. Manter um caminho só evita o
 * clássico de o PDF sair diferente do que a pessoa viu na tela.
 *
 * `imprimir` chega por `?imprimir=1` e é o que faz o botão de download da
 * lista de mapas funcionar sem existir PDF de servidor: a linha abre esta
 * página em aba nova e ela mesma dispara a impressão.
 */
export function AcoesRelatorio({ imprimir = false }: { imprimir?: boolean }) {
  useEffect(() => {
    if (!imprimir) return

    // Esperar as fontes é o que separa um PDF certo de um PDF com o texto
    // remontado. A Sentient é servida por `next/font/local`, e imprimir
    // antes de ela chegar pagina o documento com a fonte substituta e
    // depois troca — a quebra de página sai onde não deveria.
    let cancelado = false
    void document.fonts.ready.then(() => {
      if (!cancelado) window.print()
    })

    return () => {
      cancelado = true
    }
  }, [imprimir])

  return (
    <>
      <Button
        size="sm"
        icon={<Icon name="link" size={14} />}
        onClick={() => {
          void navigator.clipboard?.writeText(window.location.href)
        }}
      >
        Copiar link
      </Button>
      <Button
        size="sm"
        variant="primary"
        icon={<Icon name="download" size={14} />}
        onClick={() => window.print()}
      >
        Baixar PDF
      </Button>
    </>
  )
}
