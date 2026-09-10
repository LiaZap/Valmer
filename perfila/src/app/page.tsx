import Link from 'next/link'
import { redirect } from 'next/navigation'
import { MarcaImpacto, NOME_MARCA } from '@/components/layout/MarcaImpacto'
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
 *
 * A tela é dividida: formulário à esquerda sobre a Areia, painel escuro à
 * direita. O painel é DECORAÇÃO e não carrega informação que só exista ali —
 * abaixo de 900px ele sai da página inteiro, e quem entra pelo celular não
 * perde nada.
 *
 * A marca da coluna esquerda existe SÓ no celular. No desktop ela era a
 * terceira aparição do nome na mesma tela (painel, título do formulário e
 * ela), e some. Mas apagá-la de vez deixaria o celular sem marca nenhuma,
 * já que o painel também não está lá: ela é escondida por media query, não
 * removida.
 */
const AMBIENTES: { href: string; nome: string; desc: string; icone: IconName }[] = [
  {
    href: '/avaliacao/demo',
    nome: 'Responder um mapa comportamental',
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
      <div className={styles.coluna}>
        <div className={styles.marca}>
          <span className={styles.marcaIcone}>
            <MarcaImpacto size={22} cor="var(--color-marca-sobre-escuro)" />
          </span>
          <span className={styles.marcaTexto}>
            <span className={styles.marcaNome}>{NOME_MARCA}</span>
            <span className={styles.marcaLinha}>Análise de perfil comportamental</span>
          </span>
        </div>

        <div className={styles.miolo}>
          <div className={styles.titulo}>
            <p className={styles.saudacao}>Bem-vindo</p>
            <h1 className={styles.h1}>Entrar na plataforma</h1>
            <p className={styles.subtitulo}>
              Use o e-mail cadastrado pela {NOME_MARCA}.
            </p>
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
        </div>

        <p className={styles.rodape}>
          © {new Date().getFullYear()} {NOME_MARCA}. Ambiente seguro, com sessão
          expirando por inatividade.
        </p>
      </div>

      {/* Painel decorativo. `aria-hidden` porque tudo que ele diz já está dito
          na coluna da esquerda ou é ornamento: para um leitor de tela ele
          seria repetição. */}
      <aside className={styles.painel} aria-hidden="true">
        <div className={styles.painelMiolo}>
          <MarcaImpacto size={88} cor="var(--color-marca-sobre-escuro)" />
          <p className={styles.painelOlho}>Mapa Comportamental</p>
          <p className={styles.painelFrase}>
            Conheça seus talentos mais desenvolvidos, e os pontos que pedem
            atenção.
          </p>
          <p className={styles.painelMeta}>28 questões · 6 a 8 minutos</p>
        </div>
      </aside>
    </div>
  )
}
