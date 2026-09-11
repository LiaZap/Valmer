'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { IconButton } from '@/components/ui/IconButton'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pill } from '@/components/ui/Pill'
import { RowActions, Table, Td, Th, Tr, tableStyles } from '@/components/ui/Table'
import { useToast } from '@/components/ui/Toast'
import { custoPorCredito, moeda } from '@/data/planos'
import {
  atualizarPacotePelaTela,
  atualizarRelatorioPelaTela,
  criarPacotePelaTela,
  excluirPacotePelaTela,
} from '@/lib/actions/precos'
import type { PrecoPacote, PrecoRelatorio } from '@/lib/db/schema'
import ui from '@/styles/common.module.css'
import { FormPreco, NOVO_PACOTE, type Rascunho } from './FormPreco'

/**
 * A frase que responde à dúvida de todo mundo que abre uma tabela de preço.
 *
 * Ela não é decoração: é o que o código faz. O custo do mapa é COPIADO para
 * `assessments.creditos_usados` na criação, e a venda já virou linha de
 * `creditos_transacoes` — as duas tabelas desta tela só dizem quanto custa o
 * PRÓXIMO. Sem isso escrito, o admin ou não edita, com medo de reprecificar o
 * que já foi cobrado, ou edita achando que reprecifica.
 */
const NAO_MEXE_NO_PASSADO =
  'Mudar um preço aqui vale só para o que vier depois. Mapa já criado mantém o custo que pagou ' +
  '(o número fica gravado na linha do próprio mapa, no momento da criação) e venda já feita ' +
  'mantém os créditos que entregou — o extrato daquele dia continua explicando o saldo.'

/**
 * Preços, lendo e gravando no banco.
 *
 * A lista chega pronta do servidor e as actions invalidam `/admin/precos`
 * depois de gravar, então esta tela não guarda cópia de preço nenhum: estado
 * aqui é só o do formulário. O `updated_at` de cada linha viaja com a gravação
 * porque a action compara os dois — duas abas com números diferentes deixariam
 * vigente o preço de quem clicou por último, sem ninguém saber qual foi.
 *
 * O botão "Editar tabela" é o mesmo de antes; o que mudou é que ele abre a
 * edição de verdade em vez de avisar que não dá. Ele liga um MODO de edição em
 * vez de deixar lápis e lixeira sempre à mostra porque esta tabela é muito
 * mais consultada do que alterada, e a lixeira do pacote fica ao lado do lápis.
 */
export function GestaoPrecos({
  relatorios,
  pacotes,
}: {
  relatorios: PrecoRelatorio[]
  pacotes: PrecoPacote[]
}) {
  const { toast } = useToast()
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState<Rascunho | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [gravando, iniciarGravacao] = useTransition()

  function abrir(novo: Rascunho) {
    setErro(null)
    setRascunho(novo)
  }

  /** Qual das três portas de escrita atende este rascunho. */
  async function enviar(atual: Rascunho) {
    if (atual.tipo === 'relatorio') {
      return atualizarRelatorioPelaTela(
        atual.id,
        {
          nome: atual.nome,
          creditos: Number(atual.creditos),
          conteudo: atual.conteudo,
          revenda_min: Number(atual.revendaMin),
          revenda_max: Number(atual.revendaMax),
        },
        atual.atualizadoEm,
      )
    }

    const dados = {
      nome: atual.nome,
      creditos: Number(atual.creditos),
      preco: Number(atual.preco),
      publico: atual.publico,
    }

    return atual.id
      ? atualizarPacotePelaTela(atual.id, dados, atual.atualizadoEm!)
      : criarPacotePelaTela(dados)
  }

  function gravar(evento: React.FormEvent) {
    evento.preventDefault()
    if (!rascunho) return
    setErro(null)

    iniciarGravacao(async () => {
      const resposta = await enviar(rascunho)

      // A recusa volta como objeto justamente para ser mostrada aqui, com o
      // formulário preenchido do lado: fechar antes de saber que gravou
      // apagaria os números na cara de quem acabou de digitá-los.
      if (!resposta.ok) {
        setErro(resposta.erro)
        return
      }

      setRascunho(null)
      // O toast repete de propósito que o número novo vale daqui para a
      // frente: é a confirmação chegando com a mesma resposta que a tela deu
      // antes do clique.
      toast(
        rascunho.tipo === 'relatorio'
          ? `${rascunho.codigo} agora custa ${rascunho.creditos} crédito(s) nos próximos mapas.`
          : rascunho.id
            ? `Pacote "${rascunho.nome.trim()}" alterado. Vale para as próximas vendas.`
            : `Pacote "${rascunho.nome.trim()}" criado.`,
      )
    })
  }

  function descontinuar(pacote: PrecoPacote) {
    // Exclusão é lógica no banco, mas o pacote some da vitrine na hora: sem a
    // pergunta, um clique errado na lixeira ao lado do lápis tiraria o pacote
    // de venda sem nenhum aviso.
    const pergunta = `Descontinuar o pacote "${pacote.nome}"? As vendas já feitas continuam valendo.`
    if (!window.confirm(pergunta)) return

    iniciarGravacao(async () => {
      const resposta = await excluirPacotePelaTela(pacote.id)
      if (!resposta.ok) {
        toast(resposta.erro, 'aviso')
        return
      }
      if (rascunho?.tipo === 'pacote' && rascunho.id === pacote.id) setRascunho(null)
      toast(`Pacote "${pacote.nome}" descontinuado.`)
    })
  }

  return (
    <>
      <PageHeader
        title="Preços"
        subtitle="Quanto cada relatório consome de crédito e quanto custa cada pacote."
        actions={
          <Button
            variant={editando ? 'secondary' : 'primary'}
            icon={<Icon name={editando ? 'check' : 'edit'} />}
            disabled={gravando}
            onClick={() => {
              setEditando(!editando)
              setRascunho(null)
              setErro(null)
            }}
          >
            {editando ? 'Concluir edição' : 'Editar tabela'}
          </Button>
        }
      />

      {/* Fixo, e não só dentro do formulário: a dúvida aparece antes do
          clique, quando o admin ainda está decidindo se mexe ou não. */}
      <div className={`${ui.callout} ${ui.calloutInfo}`}>
        <span className={ui.calloutIcon}>
          <Icon name="info" />
        </span>
        <span>{NAO_MEXE_NO_PASSADO}</span>
      </div>

      {rascunho ? (
        <FormPreco
          rascunho={rascunho}
          setRascunho={setRascunho}
          erro={erro}
          gravando={gravando}
          aoGravar={gravar}
          aoCancelar={() => setRascunho(null)}
        />
      ) : null}

      <Card padding="none" clip scrollX>
        <CardHeader title="Tipos de relatório" />
        {relatorios.length === 0 ? (
          <EmptyState>
            Nenhum nível com preço cadastrado. Sem preço, a criação de mapa é recusada — rode o
            seed do banco para criar os quatro níveis.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Tipo</Th>
                <Th>Conteúdo</Th>
                <Th align="right">Créditos</Th>
                <Th align="right">Revenda sugerida</Th>
                {editando ? <Th align="right">Ações</Th> : null}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {relatorios.map((tipo) => (
                <Tr key={tipo.id}>
                  <Td>
                    <div className={tableStyles.primary}>
                      {tipo.codigo} · {tipo.nome}
                    </div>
                  </Td>
                  <Td muted rotulo="Conteúdo">{tipo.conteudo}</Td>
                  <Td align="right" rotulo="Créditos">
                    <Pill tone="success">{tipo.creditos}</Pill>
                  </Td>
                  <Td align="right" muted rotulo="Revenda sugerida">
                    {moeda(tipo.revenda_min)} a {moeda(tipo.revenda_max)}
                  </Td>
                  {editando ? (
                    <Td align="right">
                      <RowActions>
                        <IconButton
                          icon="edit"
                          label={`Alterar o preço de ${tipo.codigo}`}
                          disabled={gravando}
                          onClick={() =>
                            abrir({
                              tipo: 'relatorio',
                              id: tipo.id,
                              atualizadoEm: tipo.updated_at,
                              codigo: tipo.codigo,
                              nome: tipo.nome,
                              creditos: String(tipo.creditos),
                              conteudo: tipo.conteudo,
                              revendaMin: String(tipo.revenda_min),
                              revendaMax: String(tipo.revenda_max),
                            })
                          }
                        />
                      </RowActions>
                    </Td>
                  ) : null}
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card padding="none" clip scrollX>
        <CardHeader
          title="Pacotes de crédito"
          actions={
            editando ? (
              <Button
                variant="primary"
                size="sm"
                icon={<Icon name="plus" />}
                disabled={gravando}
                onClick={() => abrir(NOVO_PACOTE)}
              >
                Novo pacote
              </Button>
            ) : null
          }
        />
        {pacotes.length === 0 ? (
          <EmptyState>
            Nenhum pacote à venda. Sem pacote não há como vender crédito nem cadastrar parceiro —
            crie o primeiro por &ldquo;Editar tabela&rdquo;.
          </EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Pacote</Th>
                <Th align="right">Créditos</Th>
                <Th align="right">Preço</Th>
                <Th align="right">Custo por crédito</Th>
                <Th>Público-alvo</Th>
                {editando ? <Th align="right">Ações</Th> : null}
              </tr>
            </thead>
            <tbody role="rowgroup">
              {pacotes.map((pacote) => (
                <Tr key={pacote.id}>
                  <Td>
                    <span className={tableStyles.primary}>{pacote.nome}</span>
                  </Td>
                  <Td align="right" rotulo="Créditos">{pacote.creditos}</Td>
                  <Td align="right" rotulo="Preço">{moeda(pacote.preco)}</Td>
                  <Td align="right" muted rotulo="Custo por crédito">
                    {moeda(custoPorCredito(pacote))}
                  </Td>
                  <Td muted rotulo="Público-alvo">{pacote.publico}</Td>
                  {editando ? (
                    <Td align="right">
                      <RowActions>
                        <IconButton
                          icon="edit"
                          label={`Alterar o pacote ${pacote.nome}`}
                          disabled={gravando}
                          onClick={() =>
                            abrir({
                              tipo: 'pacote',
                              id: pacote.id,
                              atualizadoEm: pacote.updated_at,
                              nome: pacote.nome,
                              creditos: String(pacote.creditos),
                              preco: String(pacote.preco),
                              publico: pacote.publico,
                            })
                          }
                        />
                        <IconButton
                          icon="trash"
                          label={`Descontinuar o pacote ${pacote.nome}`}
                          tone="danger"
                          disabled={gravando}
                          onClick={() => descontinuar(pacote)}
                        />
                      </RowActions>
                    </Td>
                  ) : null}
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
