'use client'

import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardFooter, CardHeader } from '@/components/ui/Card'
import { Field, Input, Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { AutoGrid, Stack } from '@/components/ui/Layout'
import ui from '@/styles/common.module.css'

/**
 * O formulário de preço — de nível de relatório e de pacote, os dois.
 *
 * Mora fora de `GestaoPrecos` só por tamanho: as duas tabelas mais os dois
 * conjuntos de campos passavam do teto de 500 linhas do projeto. Ele não sabe
 * gravar nada; quem chama a action, mostra o toast e trata a recusa continua
 * sendo a tela.
 *
 * O rascunho guarda TEXTO, e não número — mesmo motivo de ListaCargos: apagar
 * o campo para digitar outro valor viraria 0 no meio da digitação.
 */
export type Rascunho =
  | {
      tipo: 'relatorio'
      id: string
      /** Viaja até a action: é ele que recusa a gravação de duas abas ao mesmo tempo. */
      atualizadoEm: Date
      /** O código é a identidade da linha (S1..S4) e por isso não se edita. */
      codigo: string
      nome: string
      creditos: string
      conteudo: string
      revendaMin: string
      revendaMax: string
    }
  | {
      tipo: 'pacote'
      /** Nulo em pacote novo — é o que separa criar de editar. */
      id: string | null
      atualizadoEm: Date | null
      nome: string
      creditos: string
      preco: string
      publico: string
    }

export const NOVO_PACOTE: Rascunho = {
  tipo: 'pacote',
  id: null,
  atualizadoEm: null,
  nome: '',
  creditos: '',
  preco: '',
  publico: '',
}

export function FormPreco({
  rascunho,
  setRascunho,
  erro,
  gravando,
  aoGravar,
  aoCancelar,
}: {
  rascunho: Rascunho
  setRascunho: Dispatch<SetStateAction<Rascunho | null>>
  erro: string | null
  gravando: boolean
  aoGravar: (evento: FormEvent) => void
  aoCancelar: () => void
}) {
  return (
    <Card padding="none">
      <CardHeader
        title={
          rascunho.tipo === 'relatorio'
            ? `Alterar o preço de ${rascunho.codigo}`
            : rascunho.id
              ? `Alterar o pacote ${rascunho.nome}`
              : 'Novo pacote de crédito'
        }
      />
      <form onSubmit={aoGravar}>
        {/* Mesmo corpo de formulário das outras telas, com o respiro do card
            vindo do token e não de um número solto. */}
        <div style={{ padding: 'var(--space-24)' }}>
          <Stack gap={16}>
            {rascunho.tipo === 'relatorio' ? (
              <>
                <AutoGrid min={200} gap={12}>
                  <Field label="Nome do nível">
                    {(id) => (
                      <Input
                        id={id}
                        value={rascunho.nome}
                        onChange={(evento) =>
                          setRascunho({ ...rascunho, nome: evento.target.value })
                        }
                        required
                      />
                    )}
                  </Field>
                  <Field label="Créditos consumidos">
                    {(id) => (
                      <Input
                        id={id}
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={rascunho.creditos}
                        onChange={(evento) =>
                          setRascunho({ ...rascunho, creditos: evento.target.value })
                        }
                        required
                      />
                    )}
                  </Field>
                  <Field label="Revenda sugerida mínima (R$)">
                    {(id) => (
                      <Input
                        id={id}
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={rascunho.revendaMin}
                        onChange={(evento) =>
                          setRascunho({ ...rascunho, revendaMin: evento.target.value })
                        }
                        required
                      />
                    )}
                  </Field>
                  <Field label="Revenda sugerida máxima (R$)">
                    {(id) => (
                      <Input
                        id={id}
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={rascunho.revendaMax}
                        onChange={(evento) =>
                          setRascunho({ ...rascunho, revendaMax: evento.target.value })
                        }
                        required
                      />
                    )}
                  </Field>
                </AutoGrid>
                <Field label="Conteúdo do nível">
                  {(id) => (
                    <Textarea
                      id={id}
                      rows={2}
                      value={rascunho.conteudo}
                      onChange={(evento) =>
                        setRascunho({ ...rascunho, conteudo: evento.target.value })
                      }
                      required
                    />
                  )}
                </Field>
              </>
            ) : (
              <>
                <AutoGrid min={200} gap={12}>
                  <Field label="Nome do pacote">
                    {(id) => (
                      <Input
                        id={id}
                        placeholder="Ex.: Starter"
                        value={rascunho.nome}
                        onChange={(evento) =>
                          setRascunho({ ...rascunho, nome: evento.target.value })
                        }
                        required
                      />
                    )}
                  </Field>
                  <Field label="Créditos entregues">
                    {(id) => (
                      <Input
                        id={id}
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={rascunho.creditos}
                        onChange={(evento) =>
                          setRascunho({ ...rascunho, creditos: evento.target.value })
                        }
                        required
                      />
                    )}
                  </Field>
                  <Field label="Preço do pacote (R$)">
                    {(id) => (
                      <Input
                        id={id}
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={rascunho.preco}
                        onChange={(evento) =>
                          setRascunho({ ...rascunho, preco: evento.target.value })
                        }
                        required
                      />
                    )}
                  </Field>
                </AutoGrid>
                <Field label="Público-alvo">
                  {(id) => (
                    <Input
                      id={id}
                      placeholder="Para quem é este pacote."
                      value={rascunho.publico}
                      onChange={(evento) =>
                        setRascunho({ ...rascunho, publico: evento.target.value })
                      }
                      required
                    />
                  )}
                </Field>
              </>
            )}

            {/* Região viva permanente: a recusa chega depois do clique, longe
                de onde se olha, e criada junto com o texto o leitor de tela
                não a anuncia. Mesmo padrão de ListaCargos.
                O aviso de cima repete aqui a resposta da tela toda, no exato
                momento em que a dúvida aparece: a hora de clicar em Salvar. */}
            <div role="status" aria-live="polite">
              <div className={`${ui.callout} ${ui.calloutInfo}`}>
                <span className={ui.calloutIcon}>
                  <Icon name="info" />
                </span>
                <span>
                  {rascunho.tipo === 'relatorio'
                    ? 'Salvar não altera nenhum mapa já criado: o custo deles foi gravado na linha do próprio mapa, na criação. O número novo vale do próximo envio em diante.'
                    : 'Salvar não altera nenhuma venda já feita: os créditos entregues já estão no extrato do parceiro. O pacote novo vale da próxima venda em diante.'}
                </span>
              </div>

              {erro ? (
                <div className={`${ui.callout} ${ui.calloutWarning}`}>
                  <span className={ui.calloutIcon}>
                    <Icon name="alert" />
                  </span>
                  <span>{erro}</span>
                </div>
              ) : null}
            </div>
          </Stack>
        </div>

        <CardFooter>
          <Button type="submit" variant="primary" icon={<Icon name="check" />} disabled={gravando}>
            {gravando ? 'Salvando…' : 'Salvar'}
          </Button>
          <Button variant="ghost" onClick={aoCancelar} disabled={gravando}>
            Cancelar
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
