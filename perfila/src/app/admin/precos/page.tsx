'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { custoPorCredito, moeda, pacotesCreditos, tiposRelatorio } from '@/data/planos'
import ui from '@/styles/common.module.css'

export default function PrecosPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="Preços"
        subtitle="Quanto cada relatório consome de crédito e quanto custa cada pacote."
        actions={
          <Button
            variant="primary"
            icon={<Icon name="edit" />}
            onClick={() => toast('Abrindo edição de preços')}
          >
            Editar tabela
          </Button>
        }
      />

      <Card padding="none" clip scrollX>
        <div className={ui.sectionHead} style={{ padding: 'var(--space-16) var(--space-20)' }}>
          <div className={ui.cardTitle}>Tipos de relatório</div>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Tipo</Th>
              <Th>Conteúdo</Th>
              <Th align="right">Créditos</Th>
              <Th align="right">Revenda sugerida</Th>
            </tr>
          </thead>
          <tbody>
            {tiposRelatorio.map((tipo) => (
              <Tr key={tipo.codigo}>
                <Td>
                  <div className={tableStyles.primary}>
                    {tipo.codigo} · {tipo.nome}
                  </div>
                </Td>
                <Td muted>{tipo.conteudo}</Td>
                <Td align="right">
                  <Pill tone="success">{tipo.creditos}</Pill>
                </Td>
                <Td align="right" muted>
                  {moeda(tipo.revendaMin)} a {moeda(tipo.revendaMax)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card padding="none" clip scrollX>
        <div className={ui.sectionHead} style={{ padding: 'var(--space-16) var(--space-20)' }}>
          <div className={ui.cardTitle}>Pacotes de crédito</div>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Pacote</Th>
              <Th align="right">Créditos</Th>
              <Th align="right">Preço</Th>
              <Th align="right">Custo por crédito</Th>
              <Th>Público-alvo</Th>
            </tr>
          </thead>
          <tbody>
            {pacotesCreditos.map((pacote) => (
              <Tr key={pacote.nome}>
                <Td>
                  <span className={tableStyles.primary}>{pacote.nome}</span>
                </Td>
                <Td align="right">{pacote.creditos}</Td>
                <Td align="right">{moeda(pacote.preco)}</Td>
                <Td align="right" muted>
                  {moeda(custoPorCredito(pacote))}
                </Td>
                <Td muted>{pacote.publico}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  )
}
