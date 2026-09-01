'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { AutoGrid } from '@/components/ui/Layout'
import { BackLink, PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

export default function NovoDnaPage() {
  const { toast } = useToast()
  const router = useRouter()

  function salvar() {
    router.push('/dna')
    toast('DNA salvo')
  }

  return (
    <>
      <BackLink href="/dna">Voltar para DNA Organizacional</BackLink>

      <PageHeader
        title="Novo DNA"
        subtitle="Dê um nome à empresa e vincule campanhas e inventários."
      />

      <AutoGrid min={300} alignStart>
        <div className={styles.coluna}>
          <Card padding="lg" className={styles.formulario}>
            <Field label="Nome">{(id) => <Input id={id} placeholder="Nome do DNA" />}</Field>
            <Field label="Descrição">
              {(id) => <Textarea id={id} rows={3} placeholder="Digite aqui…" />}
            </Field>
          </Card>

          <Card padding="none">
            <CardHeader
              title="Campanhas"
              actions={
                <Button size="sm" icon={<Icon name="plus" />} onClick={() => toast('Adicionado')}>
                  Adicionar campanha
                </Button>
              }
            />
            <EmptyState>Nenhuma campanha vinculada.</EmptyState>
          </Card>

          <Card padding="none">
            <CardHeader
              title="Inventário"
              actions={
                <>
                  <IconButton
                    icon="refresh"
                    label="Atualizar"
                    variant="outline"
                    onClick={() => toast('Atualizado')}
                  />
                  <Button size="sm" icon={<Icon name="plus" />} onClick={() => toast('Adicionado')}>
                    Adicionar inventário
                  </Button>
                </>
              }
            />
            <EmptyState>Nenhum registro.</EmptyState>
          </Card>

          <div className={styles.acoes}>
            <Button href="/dna" variant="ghost">
              Cancelar
            </Button>
            <Button variant="primary" onClick={salvar}>
              Salvar DNA
            </Button>
          </div>
        </div>

        <Card>
          <div className={styles.explicacaoTitulo}>O que é um DNA?</div>
          <p className={ui.prose}>
            O DNA Organizacional consolida os perfis DISC de um grupo e mostra o comportamento
            predominante da equipe. Vincule uma campanha para importar os respondentes
            automaticamente.
          </p>
        </Card>
      </AutoGrid>
    </>
  )
}
