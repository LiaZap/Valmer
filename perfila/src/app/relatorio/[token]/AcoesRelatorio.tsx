'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { copiarTexto } from '@/lib/copiar'

/**
 * As duas ações que existem só na tela.
 *
 * O botão de impressão diz o que ele faz de verdade: abre a caixa de
 * impressão do navegador, onde a pessoa escolhe "Salvar como PDF". Não
 * existe PDF de servidor nesta rota, e prometer "Baixar PDF" fazia o
 * clique parecer quebrado quando o que abria era o diálogo de imprimir.
 * A folha sai apresentável porque as regras de `@media print` deste
 * relatório já cuidam disso — é a mesma página que o Puppeteer do CLI
 * renderiza, então um caminho só.
 *
 * Copiar não usa `navigator.clipboard` direto: fora de HTTPS ele não
 * existe. Quem resolve é `lib/copiar.ts`, para todos os botões de copiar
 * do produto de uma vez.
 *
 * `imprimir` chega por `?imprimir=1` e é o que faz o botão de download da
 * lista de mapas funcionar sem existir PDF de servidor: a linha abre esta
 * página em aba nova e ela mesma dispara a impressão.
 */
export function AcoesRelatorio({ imprimir = false }: { imprimir?: boolean }) {
  const [copiado, setCopiado] = useState(false)

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

  // O rótulo volta sozinho: sem isto o botão fica "Link copiado" para
  // sempre e a segunda cópia não dá sinal nenhum de ter acontecido.
  useEffect(() => {
    if (!copiado) return
    const volta = setTimeout(() => setCopiado(false), 2500)
    return () => clearTimeout(volta)
  }, [copiado])

  return (
    <>
      <Button
        size="sm"
        icon={<Icon name={copiado ? 'check' : 'link'} size={14} />}
        onClick={async () => {
          // Só anuncia "copiado" quando copiou mesmo. Quando não deu,
          // `copiarTexto` já mostrou o endereço para copiar à mão.
          setCopiado(await copiarTexto(window.location.href))
        }}
      >
        {copiado ? 'Link copiado' : 'Copiar link'}
      </Button>
      <Button
        size="sm"
        variant="primary"
        icon={<Icon name="printer" size={14} />}
        onClick={() => window.print()}
      >
        Imprimir ou salvar PDF
      </Button>
    </>
  )
}
