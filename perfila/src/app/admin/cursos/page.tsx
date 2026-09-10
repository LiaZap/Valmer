import { Icon } from '@/components/ui/Icon'
import { PageHeader } from '@/components/ui/PageHeader'
import { listar } from '@/lib/actions/cursos'
import { programaDosCursos } from '@/lib/ead'
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
  // A permissão é conferida em `listar()`; o programa vem depois, montado por
  // cima da lista que já foi lida — duas consultas para a página inteira, e não
  // uma por curso. Ver `lib/ead.ts`.
  const cursos = await programaDosCursos(await listar())
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
          Aqui você escreve o curso, monta o programa e sobe os vídeos. Só o que estiver
          publicado aparece na aba Treinamento do parceiro — e aula sem vídeo aparece lá como
          pendente, em vez de sumir.
        </span>
      </div>

      <GestaoCursos cursos={cursos} />
    </>
  )
}
