'use client'

import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

/**
 * As duas ações que existem só na tela.
 *
 * "Baixar PDF" abre a impressão do navegador em vez de gerar o arquivo
 * no servidor: a mesma página, com as regras de @media print, é o que o
 * Puppeteer vai renderizar em produção. Manter um caminho só evita o
 * clássico de o PDF sair diferente do que a pessoa viu na tela.
 */
export function AcoesRelatorio() {
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
