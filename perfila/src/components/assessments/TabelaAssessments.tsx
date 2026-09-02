'use client'

import { IconButton } from '@/components/ui/IconButton'
import { Pill } from '@/components/ui/Pill'
import { RowActions, Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import {
  ROTULO_SITUACAO,
  facilitadores,
  type Assessment,
  type SituacaoAssessment,
} from '@/data/facilitadores'
import styles from './TabelaAssessments.module.css'

const TOM: Record<SituacaoAssessment, 'success' | 'warning' | 'neutral'> = {
  concluido: 'success',
  em_andamento: 'warning',
  pendente: 'neutral',
  expirado: 'neutral',
}

function nomeFacilitador(id: string) {
  return facilitadores.find((facilitador) => facilitador.id === id)?.empresa ?? id
}

/**
 * Lista de assessments, compartilhada pelos dois ambientes.
 * O admin vê de quem é cada avaliação; o facilitador vê só as suas,
 * então a coluna some.
 */
export function TabelaAssessments({
  itens,
  mostrarFacilitador = false,
}: {
  itens: Assessment[]
  mostrarFacilitador?: boolean
}) {
  const { toast } = useToast()

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
              <Td muted>{nomeFacilitador(assessment.facilitadorId)}</Td>
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
              {assessment.perfil ? (
                <div className={tableStyles.secondary}>Perfil {assessment.perfil}</div>
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
                      href={`/avaliacao/${assessment.token}`}
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
