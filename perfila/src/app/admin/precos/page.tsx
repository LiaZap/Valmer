import { listarPacotesDeCredito, listarRelatorios } from '@/lib/actions/precos'
import { GestaoPrecos } from './GestaoPrecos'

/**
 * Preços — a tabela comercial da plataforma.
 *
 * Server Component: a leitura acontece aqui e a escrita fica nas actions que o
 * componente cliente ao lado chama. Mesmo desenho de /admin/cursos.
 *
 * Os números saíram de `data/planos.ts` e vieram para `precos_relatorios` e
 * `precos_pacotes`: mudar preço deixou de ser deploy. A leitura passa pelas
 * actions, e não por `lib/precos.ts` direto, porque esta é a tela de GESTÃO —
 * quem entra aqui precisa de `precos:ler`, que é só do admin. (O layout de
 * /admin já barra o facilitador, mas a checagem que vale é a de dentro da
 * action: Server Action é endpoint POST público.)
 */
export default async function PrecosPage() {
  const [relatorios, pacotes] = await Promise.all([
    listarRelatorios(),
    listarPacotesDeCredito(),
  ])

  return <GestaoPrecos relatorios={relatorios} pacotes={pacotes} />
}
