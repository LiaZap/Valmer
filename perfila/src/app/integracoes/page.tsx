'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { useToast } from '@/components/ui/Toast'
import { integracoes } from '@/data/integracoes'
import styles from './page.module.css'

export default function IntegracoesPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Integrações"
        subtitle="Conecte sua plataforma de pagamentos para vender relatórios direto aos clientes."
      />

      <AutoGrid min={260} max="340px" fill>
        {integracoes.map((integracao) => (
          <Card key={integracao.name} className={styles.integracao}>
            <div className={styles.topo}>
              <span className={styles.marca} style={{ background: integracao.cor }} aria-hidden>
                {integracao.letter}
              </span>
              <Pill size="sm" tone={integracao.conectada ? 'success' : 'neutral'}>
                {integracao.conectada ? 'Conectado' : 'Não conectado'}
              </Pill>
            </div>
            <div className={styles.nome}>{integracao.name}</div>
            <p className={styles.descricao}>{integracao.desc}</p>
            <Button variant="dark" block onClick={() => toast('Iniciando integração')}>
              Integrar
            </Button>
          </Card>
        ))}
      </AutoGrid>
    </>
  )
}
