import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { exigirSessaoNaTela } from '@/lib/auth/tela'
import { BASE_FACILITADOR } from '@/lib/routes'
import { FormPerfil } from './FormPerfil'
import ui from '@/styles/common.module.css'
import styles from './page.module.css'

const ROTULO_PAPEL = {
  admin: 'Administrador da plataforma',
  facilitador: 'Parceiro',
} as const

/**
 * Perfil do parceiro.
 *
 * A divisão desta tela é a do dono da plataforma, e não uma escolha de
 * interface: nome, empresa e telefone são de quem usa a conta; e-mail, papel,
 * créditos e situação decidem quanto ela pode gastar e o que enxerga, e mudam
 * só pelas telas do admin. Os quatro aparecem aqui como leitura para a pessoa
 * saber em que conta está — esconder deixaria a tela incompleta sem deixar
 * nada mais seguro.
 *
 * Não há campo de foto. O armazenamento existe, mas as credenciais não estão
 * no ambiente local: um seletor de arquivo que ninguém consegue exercitar é
 * botão que promete o que não entrega.
 */
export default async function PerfilPage() {
  const { sessao, conta } = await exigirSessaoNaTela(`${BASE_FACILITADOR}/perfil`)

  return (
    <>
      <PageHeader title="Perfil" subtitle="Seus dados de parceiro e o acesso à plataforma." />

      <div className={styles.coluna}>
        <FormPerfil
          nome={sessao.nome}
          empresa={conta.empresa ?? ''}
          telefone={conta.telefone ?? ''}
        />

        <Card>
          <div className={ui.cardTitle}>Dados da conta</div>
          <p className={ui.note}>
            Estes campos são definidos pela administração da Impacto Academy. Para alterar
            qualquer um deles, fale com o suporte.
          </p>

          <dl className={styles.dados}>
            <div className={styles.dado}>
              <dt className={ui.eyebrow}>E-mail de acesso</dt>
              <dd className={styles.valor}>{conta.email}</dd>
            </div>
            <div className={styles.dado}>
              <dt className={ui.eyebrow}>Papel</dt>
              <dd className={styles.valor}>{ROTULO_PAPEL[sessao.papel]}</dd>
            </div>
            <div className={styles.dado}>
              <dt className={ui.eyebrow}>Créditos</dt>
              <dd className={styles.valor}>{conta.creditos}</dd>
            </div>
            <div className={styles.dado}>
              <dt className={ui.eyebrow}>Situação</dt>
              <dd className={styles.valor}>{conta.ativo ? 'Ativa' : 'Inativa'}</dd>
            </div>
          </dl>

          {/*
            O e-mail está aqui, e não no formulário acima, por decisão de
            segurança — não por campo esquecido.

            Ele é a CREDENCIAL de login e a chave da trilha de auditoria.
            Trocá-lo sem reverificar o endereço novo tranca a pessoa fora da
            própria conta ao primeiro erro de digitação, e reverificar exige
            envio de e-mail, que o projeto ainda não tem (falta o Resend — ver
            `emailAndPassword` em lib/auth/config.ts).

            NÃO adicionar um input de e-mail aqui achando que faltou. Quando
            houver envio, o caminho é pedir a troca e confirmar no endereço
            novo, com o antigo valendo até a confirmação.
          */}
        </Card>
      </div>
    </>
  )
}
