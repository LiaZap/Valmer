'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Toggle } from '@/components/ui/Toggle'
import { useToast } from '@/components/ui/Toast'
import { notificacoes } from '@/data/configuracoes'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

/** Estado dos canais por notificação: { [id]: { email, whatsapp } }. */
type EstadoCanais = Record<string, { email: boolean; whatsapp: boolean }>

const ESTADO_INICIAL: EstadoCanais = Object.fromEntries(
  notificacoes.map((notificacao) => [
    notificacao.id,
    { email: notificacao.email, whatsapp: notificacao.whatsapp },
  ]),
)

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const [canais, setCanais] = useState<EstadoCanais>(ESTADO_INICIAL)

  function alternar(id: string, canal: 'email' | 'whatsapp') {
    setCanais((atual) => ({
      ...atual,
      [id]: { ...atual[id]!, [canal]: !atual[id]![canal] },
    }))
  }

  function restaurarPadrao() {
    setCanais(ESTADO_INICIAL)
    toast('Atualizado')
  }

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Preferências de notificação e comunicação."
      />

      <div className={styles.coluna}>
        <div className={`${ui.callout} ${ui.calloutWarning}`}>
          <span className={ui.calloutIcon}>
            <Icon name="alert" />
          </span>
          <span className={styles.avisoTexto}>
            Você ainda não possui uma integração com o WhatsApp. As notificações por WhatsApp
            ficam desativadas até configurar.
          </span>
          <Button variant="warning" size="sm" onClick={() => toast('Abrindo WhatsApp')}>
            Configurar
          </Button>
        </div>

        <Card padding="none">
          <CardHeader
            title="Notificações"
            actions={
              <IconButton
                icon="refresh"
                label="Restaurar padrão"
                variant="outline"
                onClick={restaurarPadrao}
              />
            }
          />

          <div className={styles.cabecalho}>
            <span>Notificação</span>
            <span className={styles.centro}>E-mail</span>
            <span className={styles.centro}>WhatsApp</span>
          </div>

          {notificacoes.map((notificacao) => (
            <div key={notificacao.id} className={styles.linha}>
              <div>
                <div className={styles.notificacaoTitulo}>{notificacao.title}</div>
                <div className={styles.notificacaoDesc}>{notificacao.desc}</div>
              </div>
              <div className={styles.centro}>
                <Toggle
                  checked={canais[notificacao.id]!.email}
                  onChange={() => alternar(notificacao.id, 'email')}
                  label={`${notificacao.title} por e-mail`}
                />
              </div>
              <div className={styles.centro}>
                <Toggle
                  checked={canais[notificacao.id]!.whatsapp}
                  onChange={() => alternar(notificacao.id, 'whatsapp')}
                  label={`${notificacao.title} por WhatsApp`}
                />
              </div>
            </div>
          ))}
        </Card>

        <Card padding="none">
          <div className={styles.secaoTitulo}>Comunicações da Perfila</div>
          <label className={styles.opcaoEmail}>
            <input type="checkbox" />
            Quero deixar de receber conteúdos e promoções no meu e-mail.
          </label>
        </Card>
      </div>
    </>
  )
}
