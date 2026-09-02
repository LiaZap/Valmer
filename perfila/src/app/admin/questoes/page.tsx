'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { Stack } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { useToast } from '@/components/ui/Toast'
import { blocosAssessment, questoes } from '@/data/assessment'
import type { FatorDisc } from '@/data/dna'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

const CLASSE_FATOR: Record<FatorDisc, string> = {
  D: styles.fatorD!,
  I: styles.fatorI!,
  S: styles.fatorS!,
  C: styles.fatorC!,
}

export default function QuestoesPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Banco de questões"
        subtitle={`${questoes.length} questões situacionais em ${blocosAssessment.length} blocos. Cada opção pontua um fator.`}
        actions={
          <>
            <Button icon={<Icon name="download" />} onClick={() => toast('Exportação iniciada')}>
              Exportar
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="plus" />}
              onClick={() => toast('Abrindo nova questão')}
            >
              Nova questão
            </Button>
          </>
        }
      />

      <div className={`${ui.callout} ${ui.calloutInfo}`}>
        <span className={ui.calloutIcon}>
          <Icon name="info" />
        </span>
        <span>
          Mexer aqui muda o cálculo de todos os assessments futuros. Os já respondidos guardam a
          resposta escolhida, então não são afetados.
        </span>
      </div>

      {blocosAssessment.map((bloco) => {
        const doBloco = questoes.filter((questao) => questao.bloco === bloco.numero)

        return (
          <Card key={bloco.numero} className={styles.bloco}>
            <div className={styles.blocoTopo}>
              <div>
                <div className={ui.cardTitle}>
                  Bloco {bloco.numero} · {bloco.nome}
                </div>
                <div className={ui.cardSub}>{bloco.descricao}</div>
              </div>
              <Pill>{doBloco.length} questões</Pill>
            </div>

            <Stack gap={10}>
              {doBloco.map((questao) => (
                <div className={styles.questao} key={questao.codigo}>
                  <div className={styles.questaoTopo}>
                    <div>
                      <div className={styles.codigo}>{questao.codigo}</div>
                      <div className={styles.enunciado}>{questao.enunciado}</div>
                    </div>
                    <IconButton
                      icon="edit"
                      label={`Editar ${questao.codigo}`}
                      onClick={() => toast(`Abrindo edição de ${questao.codigo}`)}
                    />
                  </div>

                  <div className={styles.opcoes}>
                    {questao.opcoes.map((opcao) => (
                      <div className={styles.opcao} key={opcao.fator}>
                        <span
                          className={`${styles.fator} ${CLASSE_FATOR[opcao.fator]}`}
                          title={`Pontua ${opcao.fator}`}
                        >
                          {opcao.fator}
                        </span>
                        <span>{opcao.texto}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </Stack>
          </Card>
        )
      })}
    </>
  )
}
