'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { mentores } from '@/data/aprendizado'
import styles from './page.module.css'

export default function MentoresPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Mentores especialistas"
        subtitle="Conheça os profissionais que vão te guiar na jornada de sucesso."
      />

      <AutoGrid min={240} max="320px" fill>
        {mentores.map((mentor) => (
          <Card key={mentor.name} padding="none" clip>
            <div className={styles.foto}>Foto · {mentor.name}</div>
            <div className={styles.corpo}>
              <div className={styles.nome}>{mentor.name}</div>
              <p className={styles.especialidade}>{mentor.role}</p>
              <Button
                variant="dark"
                block
                className={styles.agendar}
                iconRight={<Icon name="chevR" />}
                onClick={() => toast('Abrindo…')}
              >
                Agendar mentoria
              </Button>
            </div>
          </Card>
        ))}
      </AutoGrid>
    </>
  )
}
