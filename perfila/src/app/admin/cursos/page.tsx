import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { listar } from '@/lib/actions/cursos'
import ui from '@/styles/common.module.css'
import { GestaoCursos } from './GestaoCursos'

/**
 * Cursos da Impacto Academy.
 *
 * Server Component: a leitura acontece aqui e a escrita fica nas actions que o
 * componente cliente ao lado chama. Mesmo desenho do banco de questões, que é
 * a tela irmã desta dentro de Conteúdo.
 */
export default async function CursosAdminPage() {
  const cursos = await listar()
  const publicados = cursos.filter((curso) => curso.publicado).length

  return (
    <>
      <PageHeader
        title="Cursos"
        subtitle={`${cursos.length} ${cursos.length === 1 ? 'curso criado' : 'cursos criados'} · ${publicados} no ar`}
      />

      <div className={`${ui.callout} ${ui.calloutInfo}`}>
        <span className={ui.calloutIcon}>
          <Icon name="info" />
        </span>
        <span>
          Aqui você escreve e publica o curso. O aluno não entra por este login: ele acessa a
          plataforma de ensino, com cadastro próprio, e lá aparece só o que estiver publicado.
        </span>
      </div>

      <GestaoCursos cursos={cursos} />
    </>
  )
}
