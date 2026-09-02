import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { convites, getConvite } from '@/data/convites'
import ui from '@/styles/common.module.css'
import { Assessment } from './Assessment'

export function generateStaticParams() {
  return convites.map((convite) => ({ token: convite.token }))
}

export default async function AvaliacaoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const convite = getConvite(token)

  // Token desconhecido é 404: não confirmamos nem negamos a
  // existência de um convite para quem não tem o link.
  if (!convite) notFound()

  if (convite.situacao === 'expirado') {
    return (
      <Card padding="lg">
        <div className={`${ui.callout} ${ui.calloutWarning}`}>
          <span className={ui.calloutIcon}>
            <Icon name="alert" />
          </span>
          <span>
            Este link expirou em {convite.expiraEm}. Peça um novo convite a{' '}
            {convite.facilitador} para responder o assessment.
          </span>
        </div>
      </Card>
    )
  }

  return <Assessment token={convite.token} nome={convite.avaliadoNome} />
}
