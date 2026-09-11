'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardFooter } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { BackLink, PageHeader } from '@/components/ui/PageHeader'
import { Toggle } from '@/components/ui/Toggle'
import { useToast } from '@/components/ui/Toast'
import { atualizarPelaTela, definirSenhaPelaTela } from '@/lib/actions/facilitadores'
import ui from '@/styles/common.module.css'
// As classes são as mesmas da tela de cadastro, na pasta ao lado: os dois
// formulários têm a mesma largura e a mesma grade de duas colunas. Um segundo
// arquivo de estilo seria a mesma regra escrita duas vezes, para divergir no
// primeiro ajuste.
import styles from '../novo/page.module.css'

/**
 * Editar parceiro: cadastro e senha.
 *
 * Dois formulários, como em `facilitador/perfil/FormPerfil.tsx` e pelo mesmo
 * motivo: corrigir um telefone não deveria depender de digitar uma senha, e dar
 * senha nova não deveria regravar o cadastro.
 *
 * Quem decide o que pode mudar é a action, não esta tela — Server Action é um
 * POST público, e a regra vale também para quem chama sem passar por aqui.
 */
export function FormFacilitador({
  id,
  nome: nomeInicial,
  email: emailInicial,
  empresa: empresaInicial,
  telefone: telefoneInicial,
  ativo: ativoInicial,
  creditos,
  atualizadoEm,
}: {
  id: string
  nome: string
  email: string
  empresa: string
  telefone: string
  ativo: boolean
  creditos: number
  /**
   * Trava otimista: volta para a action do jeito que a tela leu. Vem como prop,
   * e não como estado, porque a gravação invalida o layout de /admin e o Server
   * Component acima devolve o valor novo na resposta da própria Server Action —
   * mesmo caminho da nota em admin/creditos/VenderPacote.tsx.
   */
  atualizadoEm: Date
}) {
  const { toast } = useToast()

  const [nome, setNome] = useState(nomeInicial)
  const [email, setEmail] = useState(emailInicial)
  const [empresa, setEmpresa] = useState(empresaInicial)
  const [telefone, setTelefone] = useState(telefoneInicial)
  const [ativo, setAtivo] = useState(ativoInicial)
  const [erroCadastro, setErroCadastro] = useState<string | null>(null)
  const [salvando, salvar] = useTransition()

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erroSenha, setErroSenha] = useState<string | null>(null)
  const [definindo, definir] = useTransition()

  const trocouEmail = email.trim().toLowerCase() !== emailInicial

  function salvarCadastro(evento: React.FormEvent) {
    evento.preventDefault()
    setErroCadastro(null)

    salvar(async () => {
      const resposta = await atualizarPelaTela(
        id,
        { nome, email, empresa, telefone, ativo },
        atualizadoEm,
      )

      if (!resposta.ok) {
        setErroCadastro(resposta.erro)
        return
      }

      toast(
        trocouEmail
          ? `Cadastro salvo. ${nome} passa a entrar com ${email.trim().toLowerCase()}.`
          : 'Cadastro salvo.',
      )
    })
  }

  function salvarSenha(evento: React.FormEvent) {
    evento.preventDefault()
    setErroSenha(null)

    // A conferência das duas digitações é daqui: o servidor não tem como saber
    // que deveriam ser iguais, e um erro de digitação que passa deixa o
    // parceiro com uma senha que ninguém sabe qual é.
    if (senha !== confirmacao) {
      setErroSenha('A confirmação não confere com a nova senha.')
      return
    }

    definir(async () => {
      const resposta = await definirSenhaPelaTela(id, senha)

      if (!resposta.ok) {
        setErroSenha(resposta.erro)
        return
      }

      setSenha('')
      setConfirmacao('')
      // Nao diz "acesso restaurado": trocar a credencial NAO derruba as
      // sessoes ja abertas do parceiro. Quem estiver logado num navegador
      // continua logado ate o cookie vencer, e prometer o contrario faria o
      // admin achar que uma conta comprometida foi fechada.
      toast('Senha definida. Repasse ao parceiro. Sessoes ja abertas seguem valendo.')
    })
  }

  return (
    <>
      <BackLink href="/admin/facilitadores">Voltar para facilitadores</BackLink>

      <PageHeader
        title={nomeInicial}
        subtitle="Cadastro, acesso e situação da conta do parceiro."
      />

      <Card padding="none" className={styles.form}>
        <form onSubmit={salvarCadastro}>
          <div className={styles.corpo}>
            <div className={styles.dupla}>
              <Field label="Nome do responsável">
                {(campo) => (
                  <Input
                    id={campo}
                    value={nome}
                    onChange={(evento) => setNome(evento.target.value)}
                    required
                  />
                )}
              </Field>
              <Field label="E-mail de acesso">
                {(campo) => (
                  <Input
                    id={campo}
                    type="email"
                    value={email}
                    onChange={(evento) => setEmail(evento.target.value)}
                    required
                  />
                )}
              </Field>
            </div>

            {/* O aviso aparece só quando o campo de fato mudou: o e-mail é a
                credencial de login, e trocá-lo por engano tranca o parceiro
                para fora sem que nada na tela tenha dito isso. */}
            {trocouEmail ? (
              <p className={ui.note}>
                Este é o e-mail com que o parceiro entra na plataforma. Ao salvar, o acesso passa a
                ser pelo endereço novo — avise-o.
              </p>
            ) : null}

            <div className={styles.dupla}>
              <Field label="Empresa ou consultoria">
                {(campo) => (
                  <Input
                    id={campo}
                    placeholder="Opcional"
                    value={empresa}
                    onChange={(evento) => setEmpresa(evento.target.value)}
                  />
                )}
              </Field>
              <Field label="Telefone">
                {(campo) => (
                  <Input
                    id={campo}
                    type="tel"
                    placeholder="(11) 90000-0000"
                    value={telefone}
                    onChange={(evento) => setTelefone(evento.target.value)}
                  />
                )}
              </Field>
            </div>

            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>Situação da conta</span>
              <span className={styles.situacao}>
                <span className={ui.dataRowValue}>{ativo ? 'Ativo' : 'Inativo'}</span>
                <Toggle
                  checked={ativo}
                  onChange={setAtivo}
                  label={ativo ? 'Desativar a conta do parceiro' : 'Ativar a conta do parceiro'}
                />
              </span>
            </div>
            <p className={ui.note}>
              Conta inativa não entra na plataforma: o login é recusado antes da sessão nascer. Os
              mapas já aplicados continuam existindo.
            </p>

            {/* O saldo é LEITURA, e não campo. `usuarios.creditos` é a
                materialização da soma de `creditos_transacoes`, e a migration
                0005 instalou uma CONSTRAINT TRIGGER que aborta o COMMIT quando
                os dois lados divergem — um input aqui derrubaria a transação
                inteira e mostraria ao admin "Saldo de créditos não bate com o
                extrato" no meio de um cadastro. Crédito se move lançando
                extrato, e o caminho é a venda do pacote. */}
            <div className={ui.dataRow}>
              <span className={ui.dataRowLabel}>Saldo de créditos</span>
              <span className={ui.dataRowValue}>{creditos}</span>
            </div>
            <p className={ui.note}>
              O saldo não se edita: ele é a soma do extrato do parceiro. Para creditar, venda um
              pacote em <Link href="/admin/creditos">Créditos e pacotes</Link>.
            </p>

            <Aviso mensagem={erroCadastro} />
          </div>

          <CardFooter>
            <Button href="/admin/facilitadores" variant="ghost">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={<Icon name="check" />} disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar cadastro'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card padding="none" className={styles.form}>
        <form onSubmit={salvarSenha}>
          <div className={styles.corpo}>
            <div className={ui.cardTitle}>Nova senha</div>
            <p className={ui.note}>
              Use quando o parceiro perder o acesso ou quando o cadastro tiver sido criado sem
              credencial. A senha antiga deixa de valer na hora, e é você quem repassa a nova.
            </p>

            {/* Campo aberto, e não mascarado, pelo mesmo motivo da tela de
                cadastro: quem digita não é o dono da senha — é o admin, que
                precisa lê-la para repassar. */}
            <div className={styles.dupla}>
              <Field label="Nova senha">
                {(campo) => (
                  <Input
                    id={campo}
                    placeholder="Pelo menos 10 caracteres"
                    value={senha}
                    onChange={(evento) => setSenha(evento.target.value)}
                    required
                  />
                )}
              </Field>
              <Field label="Repita a nova senha">
                {(campo) => (
                  <Input
                    id={campo}
                    value={confirmacao}
                    onChange={(evento) => setConfirmacao(evento.target.value)}
                    required
                  />
                )}
              </Field>
            </div>

            <Aviso mensagem={erroSenha} />
          </div>

          <CardFooter>
            <Button type="submit" variant="primary" disabled={definindo}>
              {definindo ? 'Definindo…' : 'Definir senha'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}

/**
 * Região viva permanente: a recusa do servidor chega depois do clique, longe de
 * onde se olha, e criada junto com o texto o leitor de tela não a anuncia.
 * Mesmo padrão de facilitador/perfil/FormPerfil.tsx.
 */
function Aviso({ mensagem }: { mensagem: string | null }) {
  return (
    <div role="status" aria-live="polite">
      {mensagem ? (
        <div className={`${ui.callout} ${ui.calloutWarning}`}>
          <span className={ui.calloutIcon}>
            <Icon name="alert" />
          </span>
          <span>{mensagem}</span>
        </div>
      ) : null}
    </div>
  )
}
