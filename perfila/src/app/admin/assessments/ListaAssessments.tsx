'use client'

import { useMemo, useState } from 'react'
import { TabelaAssessments } from '@/components/assessments/TabelaAssessments'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Field, Input } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { FilterBar, TableFooter, tableStyles } from '@/components/ui/Table'
import { ROTULO_SITUACAO, type Assessment, type SituacaoAssessment } from '@/data/facilitadores'

const SITUACOES = ['Todas', ...Object.values(ROTULO_SITUACAO)]
const RELATORIOS = ['Todos', 'S1', 'S2', 'S3', 'S4']

/**
 * Lista de assessments de todos os parceiros, com os filtros do admin.
 *
 * As linhas já chegam do servidor com o recorte aplicado, então filtrar aqui
 * é só esconder o que já está na tela. Ir ao banco a cada tecla renderia uma
 * consulta por caractere digitado sem melhorar nada numa lista deste tamanho.
 *
 * A busca também alcança o parceiro: no painel do admin, procurar pela empresa
 * é tão comum quanto procurar pelo avaliado.
 */
export function ListaAssessments({
  itens,
  empresas,
}: {
  itens: Assessment[]
  /** Nome de exibição por id de facilitador, pronto do servidor. */
  empresas: Record<string, string>
}) {
  const [busca, setBusca] = useState('')
  const [situacao, setSituacao] = useState(SITUACOES[0]!)
  const [relatorio, setRelatorio] = useState(RELATORIOS[0]!)

  function limpar() {
    setBusca('')
    setSituacao(SITUACOES[0]!)
    setRelatorio(RELATORIOS[0]!)
  }

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()

    return itens.filter((item) => {
      const casaTermo =
        termo === '' ||
        item.avaliadoNome.toLowerCase().includes(termo) ||
        item.avaliadoEmail.toLowerCase().includes(termo) ||
        (empresas[item.facilitadorId] ?? '').toLowerCase().includes(termo)

      const casaSituacao =
        situacao === 'Todas' ||
        ROTULO_SITUACAO[item.situacao as SituacaoAssessment] === situacao

      const casaRelatorio = relatorio === 'Todos' || item.tipoRelatorio === relatorio

      return casaTermo && casaSituacao && casaRelatorio
    })
  }, [itens, empresas, busca, situacao, relatorio])

  return (
    <Card padding="none" scrollX>
      <FilterBar>
        <Field label="Avaliado ou parceiro" className={tableStyles.filterGrow}>
          {(id) => (
            <Input
              id={id}
              placeholder="Nome, e-mail ou empresa"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
            />
          )}
        </Field>
        <Field label="Situação" className={tableStyles.filterMd}>
          {(id) => (
            <Select
              id={id}
              label="Situação"
              options={SITUACOES}
              value={situacao}
              onChange={setSituacao}
            />
          )}
        </Field>
        <Field label="Relatório" className={tableStyles.filterMd}>
          {(id) => (
            <Select
              id={id}
              label="Relatório"
              options={RELATORIOS}
              value={relatorio}
              onChange={setRelatorio}
            />
          )}
        </Field>
        {/* Os Selects são controlados justamente para que este botão devolva os
            campos a "Todas"/"Todos". Antes ele zerava o estado e deixava os
            rótulos anteriores na tela: a lista dizia uma coisa e o filtro, outra. */}
        <Button variant="dark" size="lg" onClick={limpar}>
          Limpar
        </Button>
      </FilterBar>

      {/* Tabela vazia é tela sem resposta. Não haver assessment nenhum e
          filtrar sem achar são situações diferentes, e a mensagem precisa dizer
          qual das duas é — senão quem olha acha que os dados sumiram. */}
      {filtrados.length > 0 ? (
        <TabelaAssessments itens={filtrados} mostrarFacilitador empresas={empresas} />
      ) : itens.length === 0 ? (
        <EmptyState>
          Nenhum parceiro enviou assessments ainda. Eles aparecem aqui assim que o primeiro link
          for criado no portal do facilitador.
        </EmptyState>
      ) : (
        <EmptyState>
          <p>
            Nenhum assessment corresponde aos filtros. Os {itens.length} da plataforma continuam
            aqui.
          </p>
          <Button variant="secondary" onClick={limpar}>
            Limpar filtros
          </Button>
        </EmptyState>
      )}

      <TableFooter>
        {filtrados.length === itens.length
          ? `Total: ${itens.length}`
          : `${filtrados.length} de ${itens.length}`}
      </TableFooter>
    </Card>
  )
}
