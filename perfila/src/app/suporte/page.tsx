'use client'

import { Button } from '@/components/ui/Button'
import { Card, CardFooter } from '@/components/ui/Card'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Icon, type IconName } from '@/components/ui/Icon'
import { AutoGrid } from '@/components/ui/Layout'
import { PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { canaisSuporte, horarioAtendimento } from '@/data/configuracoes'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

export default function SuportePage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader title="Suporte" subtitle="Envie uma mensagem ou fale direto com o time." />

      <AutoGrid min={300} alignStart>
        <Card padding="none">
          <div className={styles.formulario}>
            <Field label="Assunto">
              {(id) => <Input id={id} placeholder="Informe o assunto" />}
            </Field>
            <Field label="Mensagem">
              {(id) => <Textarea id={id} rows={5} placeholder="Digite sua mensagem" />}
            </Field>
          </div>
          <CardFooter>
            <Button variant="primary" onClick={() => toast('Mensagem enviada ao suporte')}>
              Enviar mensagem
            </Button>
          </CardFooter>
        </Card>

        <Card className={styles.contatos}>
          <div className={ui.cardTitle}>Quer falar com a gente?</div>
          {canaisSuporte.map((canal) => (
            <div key={canal.valor + canal.label} className={styles.contato}>
              <span
                className={[
                  styles.contatoIcone,
                  canal.destaque ? styles.contatoDestaque : styles.contatoNeutro,
                ].join(' ')}
              >
                <Icon name={canal.icon as IconName} />
              </span>
              <div>
                <div className={styles.contatoLabel}>{canal.label}</div>
                <div className={styles.contatoValor}>{canal.valor}</div>
              </div>
            </div>
          ))}
          <p className={styles.horario}>{horarioAtendimento}</p>
        </Card>
      </AutoGrid>
    </>
  )
}
