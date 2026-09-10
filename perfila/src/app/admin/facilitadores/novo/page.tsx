'use client'

import { useRouter } from 'next/navigation'
import { useId, useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardFooter } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { BackLink, PageHeader } from '@/components/ui/PageHeader'
import { useToast } from '@/components/ui/Toast'
import { criarPelaTela } from '@/lib/actions/facilitadores'
import { moeda, pacotesCreditos } from '@/data/planos'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

/**
 * Cadastro do parceiro.
 *
 * A tela inteira é cliente porque não há nada para ler no servidor: os pacotes
 * são dados fixos de `src/data/planos.ts`. Quem grava é a action, que credita
 * o pacote e lança a compra no extrato na mesma transação — o saldo não é um
 * número que esta tela escolhe.
 *
 * A senha é digitada aqui e repassada pelo admin porque o projeto ainda não
 * tem provedor de e-mail. Ver o comentário `ponytail:` em
 * `lib/actions/facilitadores.ts`.
 */
export default function NovoFacilitadorPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [pacote, setPacote] = useState(pacotesCreditos[0]!.nome)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, iniciarEnvio] = useTransition()
  const tituloPacotes = useId()

  function salvar(evento: React.FormEvent) {
    evento.preventDefault()
    setErro(null)

    iniciarEnvio(async () => {
      const resposta = await criarPelaTela({ nome, email, empresa, pacote, senha })

      // A recusa — e-mail já cadastrado, senha curta — volta como objeto para
      // ser mostrada aqui, com o formulário preenchido do lado.
      if (!resposta.ok) {
        setErro(resposta.erro)
        return
      }

      router.push('/admin/facilitadores')
      toast(
        `${resposta.nome} cadastrado com ${resposta.creditos} créditos. Repasse a senha ao parceiro.`,
      )
    })
  }

  return (
    <>
      <BackLink href="/admin/facilitadores">Voltar para facilitadores</BackLink>

      <PageHeader
        title="Novo facilitador"
        subtitle="A conta é criada já com o pacote de créditos contratado. A senha inicial é definida aqui e repassada ao parceiro."
      />

      <Card padding="none" className={styles.form}>
        <form onSubmit={salvar}>
          <div className={styles.corpo}>
            <div className={styles.dupla}>
              <Field label="Nome do responsável">
                {(id) => (
                  <Input
                    id={id}
                    placeholder="Nome completo"
                    value={nome}
                    onChange={(evento) => setNome(evento.target.value)}
                    required
                  />
                )}
              </Field>
              <Field label="E-mail de acesso">
                {(id) => (
                  <Input
                    id={id}
                    type="email"
                    placeholder="nome@empresa.com.br"
                    value={email}
                    onChange={(evento) => setEmail(evento.target.value)}
                    required
                  />
                )}
              </Field>
            </div>

            <Field label="Empresa ou consultoria">
              {(id) => (
                <Input
                  id={id}
                  placeholder="Razão social ou nome do negócio"
                  value={empresa}
                  onChange={(evento) => setEmpresa(evento.target.value)}
                  required
                />
              )}
            </Field>

            {/* Campo aberto, e não mascarado: quem digita não é o dono da
                senha — é o admin, que precisa lê-la para repassar. Mascarar
                aqui só troca vazamento de tela por erro de digitação numa
                senha que ninguém consegue conferir depois. */}
            <Field label="Senha inicial">
              {(id) => (
                <Input
                  id={id}
                  placeholder="Pelo menos 10 caracteres"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  required
                />
              )}
            </Field>

            <div>
              <div className={ui.cardTitle} id={tituloPacotes}>
                Pacote inicial
              </div>
              <p className={ui.note} style={{ marginBottom: 'var(--space-12)' }}>
                Os créditos entram no saldo assim que a conta é ativada.
              </p>
              <div className={styles.pacotes} role="radiogroup" aria-labelledby={tituloPacotes}>
                {pacotesCreditos.map((item) => (
                  <label className={styles.pacote} key={item.nome}>
                    <input
                      className={styles.radio}
                      type="radio"
                      name="pacote"
                      value={item.nome}
                      checked={pacote === item.nome}
                      disabled={enviando}
                      onChange={() => setPacote(item.nome)}
                    />
                    <span className={styles.pacoteNome}>{item.nome}</span>
                    <span className={styles.pacoteCreditos}>{item.creditos}</span>
                    <span className={styles.pacotePreco}>{moeda(item.preco)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Região viva permanente: a recusa chega depois do clique, longe
                de onde se olha, e criada junto com o texto o leitor de tela não
                a anuncia. Mesmo padrão de FormNovoAssessment. */}
            <div role="status" aria-live="polite">
              {erro ? (
                <div className={`${ui.callout} ${ui.calloutWarning}`}>
                  <span className={ui.calloutIcon}>
                    <Icon name="alert" />
                  </span>
                  <span>{erro}</span>
                </div>
              ) : null}
            </div>
          </div>

          <CardFooter>
            <Button href="/admin/facilitadores" variant="ghost">
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={<Icon name="check" />} disabled={enviando}>
              {enviando ? 'Criando…' : 'Criar e liberar acesso'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}
