'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardFooter } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { BackLink, PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { moeda, pacotesCreditos } from '@/data/planos'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

export default function NovoFacilitadorPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [pacote, setPacote] = useState(pacotesCreditos[0]!.nome)

  function salvar() {
    router.push('/admin/facilitadores')
    toast('Facilitador criado. Acesso enviado por e-mail.')
  }

  return (
    <>
      <BackLink href="/admin/facilitadores">Voltar para facilitadores</BackLink>

      <PageHeader
        title="Novo facilitador"
        subtitle="A conta é criada já com o pacote de créditos contratado. O parceiro recebe login e senha temporária por e-mail."
      />

      <Card padding="none" className={styles.form}>
        <div className={styles.corpo}>
          <div className={styles.dupla}>
            <Field label="Nome do responsável">
              {(id) => <Input id={id} placeholder="Nome completo" />}
            </Field>
            <Field label="E-mail de acesso">
              {(id) => <Input id={id} type="email" placeholder="nome@empresa.com.br" />}
            </Field>
          </div>

          <Field label="Empresa ou consultoria">
            {(id) => <Input id={id} placeholder="Razão social ou nome do negócio" />}
          </Field>

          <div>
            <div className={ui.cardTitle}>Pacote inicial</div>
            <p className={ui.note} style={{ marginBottom: 'var(--space-12)' }}>
              Os créditos entram no saldo assim que a conta é ativada.
            </p>
            <div className={styles.pacotes}>
              {pacotesCreditos.map((item) => (
                <label className={styles.pacote} key={item.nome}>
                  <input
                    className={styles.radio}
                    type="radio"
                    name="pacote"
                    value={item.nome}
                    checked={pacote === item.nome}
                    onChange={() => setPacote(item.nome)}
                  />
                  <span className={styles.pacoteNome}>{item.nome}</span>
                  <span className={styles.pacoteCreditos}>{item.creditos}</span>
                  <span className={styles.pacotePreco}>{moeda(item.preco)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <CardFooter>
          <Button href="/admin/facilitadores" variant="ghost">
            Cancelar
          </Button>
          <Button variant="primary" icon={<Icon name="check" />} onClick={salvar}>
            Criar e enviar acesso
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
