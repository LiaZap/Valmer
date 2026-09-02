'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { creditos } from '@/data/creditos'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

export default function CreditosPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Créditos"
        subtitle="Saldo, histórico e compra de créditos da plataforma."
      />

      <AutoGrid min={240}>
        <Card>
          <div className={styles.rotulo}>Saldo atual</div>
          <div className={`${ui.metricLg} ${styles.valor}`}>
            {creditos.saldo} <span className={styles.unidade}>créditos</span>
          </div>
          <div className={ui.note}>
            {creditos.vitalicios} vitalícios · {creditos.aExpirar} a expirar
          </div>
        </Card>

        <Card>
          <div className={styles.rotulo}>Utilizados no ciclo</div>
          <div className={`${ui.metricLg} ${styles.valor}`}>
            {creditos.utilizadosNoCiclo}{' '}
            <span className={styles.unidade}>de {creditos.metaDoCiclo}</span>
          </div>
          <div className={ui.note}>Ciclo iniciado em {creditos.cicloIniciadoEm}</div>
        </Card>

        <Card tone="accent" className={styles.recarga}>
          <div>
            <div className={styles.recargaTitulo}>Recarga automática</div>
            <div className={styles.recargaTexto}>
              Nunca fique sem créditos: compre automaticamente quando o saldo chegar a zero.
            </div>
          </div>
          <Button
            variant="primary"
            className={styles.recargaBotao}
            onClick={() => toast('Redirecionando para compra')}
          >
            Comprar créditos
          </Button>
        </Card>
      </AutoGrid>
    </>
  )
}
