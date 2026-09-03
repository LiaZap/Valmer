'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '@/components/ui/Icon'
import { logout } from '@/lib/actions/auth'
import styles from './Topbar.module.css'

/**
 * Encerra a sessão e volta ao login.
 *
 * Cliente por precisar do `router`: depois do logout é preciso descartar o
 * cache de rotas do Next, senão as telas já visitadas continuam aparecendo
 * do cache mesmo sem sessão.
 */
export function BotaoSair() {
  const router = useRouter()

  async function sair() {
    await logout()
    router.replace('/')
    router.refresh()
  }

  return (
    <button type="button" className={styles.sair} onClick={sair} title="Sair" aria-label="Sair">
      <Icon name="logout" size={16} />
    </button>
  )
}
