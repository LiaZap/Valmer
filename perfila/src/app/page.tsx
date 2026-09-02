import Link from 'next/link'
import { LogoMark } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Icon, type IconName } from '@/components/ui/Icon'
import styles from './page.module.css'

/**
 * Entrada da plataforma.
 *
 * No produto, este formulário autentica e o servidor manda cada
 * pessoa para o seu ambiente conforme o papel. Enquanto não há
 * autenticação, os atalhos abaixo abrem os três ambientes direto —
 * separados do formulário para que ninguém os confunda com o produto.
 */
const AMBIENTES: { href: string; nome: string; desc: string; icone: IconName }[] = [
  {
    href: '/admin',
    nome: 'Administração',
    desc: 'Facilitadores, créditos, preços e banco de questões',
    icone: 'sliders',
  },
  {
    href: '/facilitador',
    nome: 'Portal do Parceiro',
    desc: 'Criar assessments, acompanhar avaliados e relatórios',
    icone: 'bag',
  },
  {
    href: '/avaliacao/demo',
    nome: 'Responder um assessment',
    desc: 'A experiência de quem recebe o link, sem login',
    icone: 'file',
  },
]

export default function LoginPage() {
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

        <div className={styles.campos}>
          <Field label="E-mail">
            {(id) => <Input id={id} type="email" placeholder="nome@empresa.com.br" />}
          </Field>
          <Field label="Senha">
            {(id) => <Input id={id} type="password" placeholder="••••••••" />}
          </Field>
          <Link href="/" className={styles.esqueci}>
            Esqueci minha senha
          </Link>
          <Button variant="primary" size="lg" block>
            Entrar
          </Button>
        </div>

        <div className={styles.demo}>
          <span className={styles.demoTitulo}>Protótipo · entrar como</span>
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
