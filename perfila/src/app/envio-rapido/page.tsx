'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, SearchInput } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { creditos, degustacao } from '@/data/creditos'
import { opcoes } from '@/data/opcoes'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

const ABAS = ['Envio de passaporte', 'Histórico'] as const

export default function EnvioRapidoPage() {
  const { toast } = useToast()
  const [abaAtiva, setAbaAtiva] = useState<(typeof ABAS)[number]>('Envio de passaporte')

  return (
    <>
      <PageHeader
        title="Envio rápido"
        subtitle="Envie passaportes para uma campanha existente ou crie uma nova em segundos."
      />

      <AutoGrid min={300} alignStart>
        <Card padding="none" className={styles.cardBusca}>
          <div className={styles.busca}>
            <span className={styles.buscaLabel}>Campanha</span>
            <div className={styles.buscaLinha}>
              <SearchInput
                placeholder="Procurar uma campanha existente"
                size="lg"
                className={styles.buscaCampo}
              />
              <Button
                href="/campanhas/nova"
                icon={<Icon name="plus" />}
                className={styles.buscaBotao}
              >
                Nova campanha
              </Button>
            </div>
          </div>

          <div className={styles.corpo}>
            <div className={styles.abas} role="tablist">
              {ABAS.map((aba) => (
                <button
                  key={aba}
                  type="button"
                  role="tab"
                  aria-selected={aba === abaAtiva}
                  className={[styles.aba, aba === abaAtiva ? styles.abaAtiva : null]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setAbaAtiva(aba)}
                >
                  {aba}
                </button>
              ))}
            </div>

            <div className={`${ui.callout} ${ui.calloutInfo}`}>
              <span className={ui.calloutIcon}>
                <Icon name="info" />
              </span>
              <span>
                Importe um arquivo <b>.csv</b> ou <b>.xlsx</b> com as colunas <b>email</b> e{' '}
                <b>nome</b>, ou adicione destinatários um a um abaixo.
              </span>
            </div>

            <div className={styles.campos}>
              <Field label="E-mail">
                {(id) => <Input id={id} type="email" placeholder="seuemail@exemplo.com" />}
              </Field>
              <Field label="Nome">{(id) => <Input id={id} placeholder="Nome completo" />}</Field>
              <Field label="Idioma">
                {(id) => <Select id={id} options={opcoes.idioma} label="Idioma" />}
              </Field>
            </div>

            <div className={styles.acoes}>
              <Button variant="primary" icon={<Icon name="plus" />} onClick={() => toast('Adicionado')}>
                Adicionar
              </Button>
              <Button
                icon={<Icon name="upload" />}
                onClick={() => toast('Selecione um arquivo .csv ou .xlsx')}
              >
                Importar planilha
              </Button>
            </div>

            <EmptyState variant="dashed">Nenhum destinatário adicionado ainda.</EmptyState>
          </div>
        </Card>

        <Card className={styles.ajuda}>
          <div className={ui.cardTitle}>Como funciona</div>
          <ol className={styles.passos}>
            <li>Escolha ou crie a campanha que receberá os passaportes.</li>
            <li>Adicione destinatários manualmente ou por planilha.</li>
            <li>Cada envio consome 1 crédito (ou 1 degustação, se configurada).</li>
          </ol>
          <div className={styles.saldo}>
            <span className={styles.saldoLabel}>Saldo disponível</span>
            <span className={styles.saldoValor}>
              {creditos.saldo} créditos · {degustacao.saldo} degustações
            </span>
          </div>
        </Card>
      </AutoGrid>
    </>
  )
}
