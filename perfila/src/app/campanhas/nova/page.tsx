'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardFooter } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { BackLink, PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/Select'
import { ToggleVisual } from '@/components/ui/Toggle'
import { useToast } from '@/components/ui/Toast'
import { opcoes } from '@/data/opcoes'
import styles from './page.module.css'

export default function NovaCampanhaPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [permiteDownload, setPermiteDownload] = useState(false)

  function salvar() {
    router.push('/campanhas')
    toast('Campanha salva')
  }

  return (
    <>
      <BackLink href="/campanhas">Voltar para campanhas</BackLink>

      <PageHeader
        title="Criar campanha"
        subtitle="Uma campanha agrupa os passaportes enviados e define o tipo de relatório gerado."
      />

      <Card padding="none" className={styles.form}>
        <div className={styles.corpo}>
          <Field label="Nome da campanha">
            {(id) => <Input id={id} placeholder="Ex.: Capacitação Liderança 2026" />}
          </Field>

          <div className={styles.dupla}>
            <Field label="Área de atuação">
              {(id) => <Select id={id} options={opcoes.area} label="Área de atuação" />}
            </Field>
            <Field label="Tipo de relatório">
              {(id) => <Select id={id} options={opcoes.relatorio} label="Tipo de relatório" />}
            </Field>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={permiteDownload}
            className={styles.opcao}
            onClick={() => setPermiteDownload((atual) => !atual)}
          >
            <span className={styles.opcaoTexto}>
              <span className={styles.opcaoTitulo}>Permitir download do relatório</span>
              <span className={styles.opcaoDesc}>
                O respondente poderá baixar o PDF ao finalizar o questionário.
              </span>
            </span>
            <ToggleVisual checked={permiteDownload} />
          </button>
        </div>

        <CardFooter>
          <Button href="/campanhas" variant="ghost">
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvar}>
            Salvar campanha
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
