'use client'

import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { aulasEad, eadProgresso } from '@/data/aprendizado'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

export default function EadPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Treinamento"
        subtitle="Capacitação oficial para analistas Perfila."
      />

      <AutoGrid min={320} alignStart>
        <Card padding="none" clip>
          <div className={styles.player}>
            <button
              type="button"
              className={styles.play}
              aria-label="Reproduzir aula"
              onClick={() => toast('Abrindo…')}
            >
              <Icon name="play" size={32} />
            </button>
            <span className={styles.duracao}>07:05 · Vimeo</span>
          </div>
          <div className={styles.aulaInfo}>
            <div className={ui.eyebrow}>Módulo 01 · Aula 1</div>
            <div className={styles.aulaTitulo}>Apresentação da plataforma Perfila</div>
          </div>
        </Card>

        <Card padding="none" className={styles.lista}>
          <div className={styles.listaCabecalho}>
            <span>Conteúdo</span>
            <span className={styles.listaProgresso}>
              {eadProgresso.concluidas} de {eadProgresso.total} concluídos
            </span>
          </div>
          {aulasEad.map((aula) => (
            <button
              key={aula.title}
              type="button"
              className={styles.aula}
              onClick={() => toast('Abrindo…')}
            >
              <span
                className={[styles.marcador, aula.concluida ? styles.marcadorConcluido : null]
                  .filter(Boolean)
                  .join(' ')}
              >
                {aula.marcador}
              </span>
              <span className={styles.aulaNome}>{aula.title}</span>
              <span className={styles.chevron}>
                <Icon name="chevD" />
              </span>
            </button>
          ))}
        </Card>
      </AutoGrid>
    </>
  )
}
