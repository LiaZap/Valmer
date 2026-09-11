'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { logout } from '@/lib/actions/auth'
import { isNavItemActive, navRapida, type NavGroup } from '@/lib/routes'
import styles from './BarraInferior.module.css'

type BarraInferiorProps = {
  grupos: NavGroup[]
  /** Raiz do ambiente — âncora do item ativo. */
  base: string
}

/**
 * BarraInferior
 * -------------
 * A navegação do telefone. Abaixo de 720px a lateral sai da tela — recolhida
 * ela custa 68px de 390, 17% da largura gasta com ícone — e a navegação desce
 * para a base, onde o polegar alcança.
 *
 * São quatro destinos fixos mais o "Mais". Quatro slots não cobrem quinze
 * telas, então a folha do "Mais" é o ÚNICO caminho para as outras onze: se ela
 * falhar, o telefone perde dois terços do produto. Por isso ela é diálogo de
 * verdade — fecha no Escape, no toque fora e ao navegar, prende o foco
 * enquanto está aberta e o devolve ao botão que a abriu.
 */
export function BarraInferior({ grupos, base }: BarraInferiorProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [aberta, setAberta] = useState(false)
  const botaoMais = useRef<HTMLButtonElement>(null)
  const folha = useRef<HTMLDivElement>(null)

  const atalhos = navRapida(grupos)

  // Quem não está em nenhum dos quatro está, por definição, numa tela que só o
  // "Mais" alcança. Sem isto a barra inteira fica apagada nas outras onze
  // telas e parece quebrada.
  const emMais = !atalhos.some((item) => isNavItemActive(item.href, pathname, base))

  function fechar() {
    setAberta(false)
    botaoMais.current?.focus()
  }

  useEffect(() => {
    if (!aberta) return
    const caixa = folha.current
    if (!caixa) return

    const focaveis = () => Array.from(caixa.querySelectorAll<HTMLElement>('a[href], button'))
    focaveis()[0]?.focus()

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setAberta(false)
        botaoMais.current?.focus()
        return
      }
      if (evento.key !== 'Tab' || !caixa) return

      // Foco preso: fora da folha o Tab levaria para a página de trás, que
      // está coberta pelo fundo e não recebe mais comando nenhum.
      const itens = focaveis()
      const primeiro = itens[0]
      const ultimo = itens[itens.length - 1]
      if (!primeiro || !ultimo) return

      const ativo = document.activeElement
      if (evento.shiftKey && (ativo === primeiro || !caixa.contains(ativo))) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && ativo === ultimo) {
        evento.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberta])

  async function sair() {
    await logout()
    router.replace('/')
    router.refresh()
  }

  return (
    <>
      <nav className={styles.barra} aria-label="Navegação do telefone">
        {atalhos.map((item) => {
          const ativo = isNavItemActive(item.href, pathname, base)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? 'page' : undefined}
              className={[styles.item, ativo ? styles.itemAtivo : null].filter(Boolean).join(' ')}
            >
              <span className={styles.itemIcone}>
                <Icon name={item.icon} size={20} />
              </span>
              <span className={styles.rotulo}>{item.label}</span>
            </Link>
          )
        })}

        <button
          type="button"
          ref={botaoMais}
          onClick={() => setAberta(true)}
          aria-haspopup="dialog"
          aria-expanded={aberta}
          className={[styles.item, emMais ? styles.itemAtivo : null].filter(Boolean).join(' ')}
        >
          <span className={styles.itemIcone}>
            <Icon name="menu" size={20} />
          </span>
          <span className={styles.rotulo}>Mais</span>
        </button>
      </nav>

      {aberta ? (
        <>
          {/* Botão, e não `div` com clique: o toque fora fecha para o dedo, e
              quem está no teclado precisa do Escape — que o efeito acima trata
              — sem um alvo invisível e mudo no meio do caminho. */}
          <button
            type="button"
            className={styles.fundo}
            aria-label="Fechar menu"
            onClick={fechar}
          />

          <div
            className={styles.folha}
            ref={folha}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
          >
            <div className={styles.puxador} aria-hidden />

            {grupos.map((grupo) => (
              <div className={styles.folhaGrupo} key={grupo.label}>
                <div className={styles.folhaGrupoRotulo}>{grupo.label}</div>
                {grupo.items.map((item) => {
                  const ativo = isNavItemActive(item.href, pathname, base)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={fechar}
                      aria-current={ativo ? 'page' : undefined}
                      className={[styles.folhaItem, ativo ? styles.folhaItemAtivo : null]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <Icon name={item.icon} size={18} />
                      <span className={styles.folhaRotulo}>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}

            {/* O sair mora aqui porque saiu da barra superior: em 390px ele
                disputava espaço com a busca, e sair é o que menos se faz. */}
            <button type="button" className={styles.folhaSair} onClick={sair}>
              <Icon name="logout" size={18} />
              <span className={styles.folhaRotulo}>Sair</span>
            </button>
          </div>
        </>
      ) : null}
    </>
  )
}
