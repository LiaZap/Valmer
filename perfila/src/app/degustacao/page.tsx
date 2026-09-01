'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { degustacao } from '@/data/creditos'
import { opcoes } from '@/data/opcoes'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

export default function DegustacaoPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Degustação"
        subtitle="Ofereça uma amostra gratuita do relatório e converta em clientes."
      />

      <AutoGrid min={260} alignStart>
        <Card>
          <div className={styles.rotulo}>Saldo de degustações</div>
          <div className={`${ui.metricLg} ${styles.valor}`}>{degustacao.saldo}</div>
          <div className={ui.note}>
            {degustacao.vitalicios} vitalícios · {degustacao.utilizadas} utilizados
          </div>
        </Card>

        <Card padding="lg" className={styles.config}>
          <div className={ui.cardTitle}>Configuração da degustação</div>
          <div className={styles.campos}>
            <Field label="Relatório oferecido">
              {(id) => (
                <Select
                  id={id}
                  options={opcoes.relatorioDegustacao}
                  label="Relatório oferecido"
                />
              )}
            </Field>
            <Field label="Preço do relatório completo">
              {(id) => <Input id={id} placeholder="R$ 0,00" inputMode="decimal" />}
            </Field>
          </div>
          <Button
            variant="primary"
            className={styles.salvar}
            onClick={() => toast('Configuração salva')}
          >
            Salvar
          </Button>
        </Card>
      </AutoGrid>
    </>
  )
}
