'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardFooter } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { BackLink, PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { facilitadorAtual } from '@/data/facilitadores'
import { getTipoRelatorio, tiposRelatorio, type CodigoRelatorio } from '@/data/planos'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

export default function NovoAssessmentPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [codigo, setCodigo] = useState<CodigoRelatorio>('S1')

  const escolhido = getTipoRelatorio(codigo)
  const saldoDepois = facilitadorAtual.creditos - escolhido.creditos
  const semSaldo = saldoDepois < 0

  function criar() {
    router.push('/facilitador/assessments')
    toast('Assessment criado. Link enviado por e-mail.')
  }

  return (
    <>
      <BackLink href="/facilitador/assessments">Voltar para assessments</BackLink>

      <PageHeader
        title="Novo assessment"
        subtitle="O avaliado recebe um link único por e-mail e responde sem criar conta. O link vale por 7 dias."
      />

      <Card padding="none" className={styles.form}>
        <div className={styles.corpo}>
          <div className={styles.dupla}>
            <Field label="Nome do avaliado">
              {(id) => <Input id={id} placeholder="Nome completo" />}
            </Field>
            <Field label="E-mail do avaliado">
              {(id) => <Input id={id} type="email" placeholder="nome@empresa.com.br" />}
            </Field>
          </div>

          <div>
            <div className={ui.cardTitle}>Tipo de relatório</div>
            <p className={ui.note} style={{ marginBottom: 'var(--space-12)' }}>
              Quanto mais completo o relatório, mais créditos ele consome.
            </p>

            <div className={styles.tipos}>
              {tiposRelatorio.map((tipo) => {
                const cabeNoSaldo = tipo.creditos <= facilitadorAtual.creditos
                return (
                  <label
                    key={tipo.codigo}
                    className={[styles.tipo, cabeNoSaldo ? null : styles.indisponivel]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <input
                      className={styles.radio}
                      type="radio"
                      name="tipo"
                      value={tipo.codigo}
                      checked={codigo === tipo.codigo}
                      disabled={!cabeNoSaldo}
                      onChange={() => setCodigo(tipo.codigo)}
                    />
                    <span className={styles.tipoTopo}>
                      <span className={styles.tipoCodigo}>{tipo.codigo}</span>
                      <span className={ui.cardSub}>
                        {tipo.creditos} {tipo.creditos === 1 ? 'crédito' : 'créditos'}
                      </span>
                    </span>
                    <span className={styles.tipoNome}>{tipo.nome}</span>
                    <span className={styles.tipoConteudo}>{tipo.conteudo}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className={styles.resumo}>
            <span>
              Saldo atual: <strong>{facilitadorAtual.creditos}</strong> · este assessment consome{' '}
              <strong>{escolhido.creditos}</strong>
            </span>
            <span>
              Fica com{' '}
              <span
                className={[styles.resumoValor, semSaldo ? styles.negativo : null]
                  .filter(Boolean)
                  .join(' ')}
              >
                {saldoDepois}
              </span>
            </span>
          </div>

          {semSaldo ? (
            <div className={`${ui.callout} ${ui.calloutWarning}`}>
              <span className={ui.calloutIcon}>
                <Icon name="alert" />
              </span>
              <span>
                Seu saldo não cobre este relatório. Compre créditos ou escolha um nível menor.
              </span>
            </div>
          ) : null}
        </div>

        <CardFooter>
          <Button href="/facilitador/assessments" variant="ghost">
            Cancelar
          </Button>
          <Button variant="primary" icon={<Icon name="mail" />} disabled={semSaldo} onClick={criar}>
            Criar e enviar link
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
