import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LogoMark } from '@/components/layout/Logo'
import { Card } from '@/components/ui/Card'
import { Icon, type IconName } from '@/components/ui/Icon'
import { getSession } from '@/lib/auth'
import { FormularioLogin } from './FormularioLogin'
import styles from './page.module.css'

/**
 * Entrada da plataforma.
 *
 * O formulário autentica de verdade e o servidor manda cada pessoa para o
 * ambiente do papel dela. O atalho que sobrou abre só o assessment, que não
 * tem login nenhum: os de /admin e /facilitador saíram quando o login passou
 * a existir, porque agora eles levariam a um redirecionamento de volta.
 */
const AMBIENTES: { href: string; nome: string; desc: string; icone: IconName }[] = [
  {
    href: '/avaliacao/demo',
    nome: 'Responder um assessment',
    desc: 'A experiência de quem recebe o link, sem login',
    icone: 'file',
  },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>
}) {
  // Quem já entrou não vê o formulário de novo.
  const sessao = await getSession()
  if (sessao) redirect(sessao.papel === 'admin' ? '/admin' : '/facilitador')

  const { proximo } = await searchParams

  return (
    <div className={styles.pagina}>
      <Card padding="lg" className={styles.cartao}>
        <div className={styles.marca}>
          <span className={styles.marcaIcone}>
            <LogoMark size={20} />
          </span>
          <span className={styles.marcaTexto}>
            <span className={styles.marcaNome}>Perfila</span>
            <span className={styles.marcaLinha}>Análise de perfil comportamental</span>
          </span>
        </div>

        <FormularioLogin proximo={proximo} />

        <div className={styles.demo}>
          <span className={styles.demoTitulo}>Protótipo · sem login</span>
          {AMBIENTES.map((ambiente) => (
            <Link key={ambiente.href} href={ambiente.href} className={styles.ambiente}>
              <span className={styles.ambienteIcone}>
                <Icon name={ambiente.icone} size={16} />
              </span>
              <span className={styles.ambienteTexto}>
                <span className={styles.ambienteNome}>{ambiente.nome}</span>
                <span className={styles.ambienteDesc}>{ambiente.desc}</span>
              </span>
              <span className={styles.seta}>
                <Icon name="chevR" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
