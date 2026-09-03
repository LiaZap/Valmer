'use client'

import { IconButton } from '@/components/ui/IconButton'
import { Pill } from '@/components/ui/Pill'
import { RowActions, Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { resultadoDeContadores } from '@/lib/disc'
import { ROTULO_SITUACAO, type Assessment, type SituacaoAssessment } from '@/data/facilitadores'
import styles from './TabelaAssessments.module.css'

const TOM: Record<SituacaoAssessment, 'success' | 'warning' | 'neutral'> = {
  concluido: 'success',
  em_andamento: 'warning',
  pendente: 'neutral',
  expirado: 'neutral',
}

/**
 * Lista de assessments, compartilhada pelos dois ambientes.
 * O admin vê de quem é cada avaliação; o facilitador vê só as suas,
 * então a coluna some.
 */
export function TabelaAssessments({
  itens,
  mostrarFacilitador = false,
  empresas = {},
}: {
  itens: Assessment[]
  mostrarFacilitador?: boolean
  /**
   * Nome de exibição por id de facilitador. Vem pronto de quem renderiza:
   * buscar aqui dentro renderia uma consulta por linha da tabela.
   */
  empresas?: Record<string, string>
}) {
  const { toast } = useToast()

  /**
   * Copia o link do avaliado para a área de transferência.
   *
   * URL absoluta: o facilitador cola isto num e-mail ou num WhatsApp, e
   * "/avaliacao/abc" fora do navegador não leva a lugar nenhum. A origem vem
   * de `window` no momento do clique, e não de uma variável de ambiente, para
   * o link sair com o domínio pelo qual a pessoa entrou.
   */
  async function copiarLink(assessment: Assessment) {
    const url = `${window.location.origin}/avaliacao/${assessment.token}`

    try {
      await navigator.clipboard.writeText(url)
      toast(`Link de ${assessment.avaliadoNome} copiado`)
    } catch {
      // `navigator.clipboard` só existe em contexto seguro (https ou
      // localhost) e o navegador ainda pode negar a permissão. Avisar é o
      // mínimo: dizer "copiado" com a área de transferência intacta faz o
      // facilitador colar o link antigo no e-mail do cliente dele.
      toast('Não foi possível copiar. Abra o link pelo relatório do avaliado.')
    }
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Avaliado</Th>
          {mostrarFacilitador ? <Th>Facilitador</Th> : null}
          <Th>Relatório</Th>
          <Th>Situação</Th>
          <Th>Prazo do link</Th>
          <Th align="right">Ações</Th>
        </tr>
      </thead>
      <tbody>
        {itens.map((assessment) => (
          <Tr key={assessment.id}>
            <Td>
              <div className={tableStyles.primary}>{assessment.avaliadoNome}</div>
              <div className={tableStyles.secondary}>{assessment.avaliadoEmail}</div>
            </Td>

            {mostrarFacilitador ? (
              <Td muted>{empresas[assessment.facilitadorId] ?? '—'}</Td>
            ) : null}

            <Td>
              <span className={styles.tipo}>{assessment.tipoRelatorio}</span>
              <div className={tableStyles.secondary}>
                {assessment.creditosUsados}{' '}
                {assessment.creditosUsados === 1 ? 'crédito' : 'créditos'}
              </div>
            </Td>

            <Td>
              <Pill tone={TOM[assessment.situacao]} dot>
                {ROTULO_SITUACAO[assessment.situacao]}
              </Pill>
              {/* O perfil é DERIVADO dos contadores, e não lido de um
                  campo guardado. O relatório deriva do mesmo lugar, então
                  os dois não têm como divergir. Guardar o resultado pronto
                  aqui criava duas fontes para o mesmo número. */}
              {assessment.contadores ? (
                <div className={tableStyles.secondary}>
                  Perfil {resultadoDeContadores(assessment.contadores).combinado}
                </div>
              ) : null}
            </Td>

            <Td muted>
              {assessment.situacao === 'concluido'
                ? `Respondido em ${assessment.concluidoEm}`
                : `Expira em ${assessment.expiraEm}`}
            </Td>

            <Td align="right">
              <RowActions>
                {assessment.situacao === 'concluido' ? (
                  <>
                    <IconButton
                      icon="eye"
                      label={`Ver relatório de ${assessment.avaliadoNome}`}
                      onClick={() => toast('Abrindo relatório')}
                    />
                    <IconButton
                      icon="download"
                      label={`Baixar PDF de ${assessment.avaliadoNome}`}
                      onClick={() => toast('Download do PDF iniciado')}
                    />
                  </>
                ) : (
                  <>
                    <IconButton
                      icon="link"
                      label={`Copiar link de ${assessment.avaliadoNome}`}
                      onClick={() => copiarLink(assessment)}
                    />
                    <IconButton
                      icon="mail"
                      label={`Reenviar convite para ${assessment.avaliadoNome}`}
                      onClick={() => toast('Convite reenviado')}
                    />
                  </>
                )}
              </RowActions>
            </Td>
          </Tr>
        ))}
      </tbody>
    </Table>
  )
}
