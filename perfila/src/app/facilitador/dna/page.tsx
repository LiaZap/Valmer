'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { FilterBar, RowActions, Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { dnas } from '@/data/dna'
import styles from './page.module.css'

export default function DnaPage() {
  const { toast } = useToast()

  return (
    <>
      <PageHeader
        title="DNA Organizacional"
        subtitle="Mapeie o perfil coletivo das empresas a partir dos inventários respondidos."
        actions={
          <Button href="/facilitador/dna/novo" variant="primary" icon={<Icon name="plus" />}>
            Adicionar DNA
          </Button>
        }
      />

      <Card padding="none" scrollX>
        <FilterBar>
          <Field label="Nome" className={tableStyles.filterGrow}>
            {(id) => <Input id={id} placeholder="Buscar por nome" />}
          </Field>
          <Field label="Data inicial" className={tableStyles.filterDate}>
            {(id) => <Input id={id} placeholder="dd/mm/aaaa" inputMode="numeric" />}
          </Field>
          <Field label="Data final" className={tableStyles.filterDate}>
            {(id) => <Input id={id} placeholder="dd/mm/aaaa" inputMode="numeric" />}
          </Field>
          <Button variant="dark" size="lg" onClick={() => toast('Filtro aplicado')}>
            Pesquisar
          </Button>
          <Button variant="ghost" size="lg" onClick={() => toast('Filtros limpos')}>
            Limpar
          </Button>
        </FilterBar>

        <Table>
          <thead>
            <tr>
              <Th>Empresa</Th>
              <Th>Inventários</Th>
              <Th>Criado por</Th>
              <Th>Criado em</Th>
              <Th align="right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {dnas.map((dna) => (
              <Tr key={dna.slug}>
                <Td>
                  <Link href={`/facilitador/dna/${dna.slug}`} className={tableStyles.linkCell}>
                    {dna.name}
                  </Link>
                  <div className={`${tableStyles.secondary} ${styles.idioma}`}>
                    <span className={styles.bandeira} aria-hidden />
                    Português (BR)
                  </div>
                </Td>
                <Td>
                  <span className={styles.inventarios}>{dna.inventarios ?? '—'}</span>
                </Td>
                <Td muted>{dna.by}</Td>
                <Td muted>{dna.date}</Td>
                <Td align="right">
                  <RowActions>
                    <IconButton icon="eye" label="Abrir" href={`/facilitador/dna/${dna.slug}`} />
                    <IconButton
                      icon="edit"
                      label="Editar"
                      onClick={() => toast('Abrindo edição')}
                    />
                    <IconButton
                      icon="file"
                      label="Ver relatório"
                      onClick={() => toast('Gerando relatório')}
                    />
                    <IconButton
                      icon="chart"
                      label="Gráficos"
                      onClick={() => toast('Abrindo gráficos')}
                    />
                    <IconButton
                      icon="download"
                      label="Baixar PDF"
                      onClick={() => toast('Download do PDF iniciado')}
                    />
                    <IconButton
                      icon="trash"
                      label="Remover"
                      tone="danger"
                      onClick={() => toast('Item removido')}
                    />
                  </RowActions>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  )
}
