import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { CapaResumo } from '@/components/relatorio/CapaResumo'
import { MarcaImpacto, NOME_MARCA } from '@/components/relatorio/MarcaImpacto'
import { Lideranca } from '@/components/relatorio/Lideranca'
import { Motivadores } from '@/components/relatorio/Motivadores'
import { PlanoFecho } from '@/components/relatorio/PlanoFecho'
import { QuemVoceE } from '@/components/relatorio/QuemVoceE'
import { narrativaExemplo } from '@/data/narrativa-exemplo'
import { getPerfilEstatico } from '@/data/perfis'
import { assessments, facilitadores } from '@/data/facilitadores'
import { resultadoDeContadores } from '@/lib/disc'
import { secoesDoNivel, type DadosRelatorio } from '@/lib/relatorio/tipos'
import { AcoesRelatorio } from './AcoesRelatorio'
import styles from './page.module.css'
import tema from './tema-impacto.module.css'

/**
 * O relatório assina como Impacto Academy, e não como Perfila: é o
 * único artefato que sai da plataforma e chega ao cliente final do
 * facilitador.
 *
 * `description` e `viewport` são declarados AQUI de propósito. Não
 * existe `app/relatorio/layout.tsx`, então esta página pendura direto
 * no layout raiz e herdaria dele a descrição institucional da Perfila e
 * o bege `#f5f3ef` na cor de tema do navegador. Um tema escopado por
 * classe de CSS não alcança meta tag: só declarando aqui.
 */
export const metadata: Metadata = {
  title: 'Impacto Academy · Relatório de perfil comportamental',
  description:
    'Relatório de perfil comportamental gerado pela Impacto Academy a partir de inventário de quatro fatores.',
}

export const viewport: Viewport = {
  themeColor: '#f8f6f1',
}

/** Só assessments concluídos têm relatório. */
export function generateStaticParams() {
  return assessments
    .filter((assessment) => assessment.situacao === 'concluido' && assessment.contadores)
    .map((assessment) => ({ token: assessment.token }))
}

export default async function RelatorioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const assessment = assessments.find((item) => item.token === token)

  // Sem contadores não há resultado, e sem resultado não há relatório:
  // é preferível um 404 a um documento com números inventados.
  if (!assessment || assessment.situacao !== 'concluido' || !assessment.contadores) notFound()

  const facilitador = facilitadores.find((item) => item.id === assessment.facilitadorId)!
  const resultado = resultadoDeContadores(assessment.contadores)

  const dados: DadosRelatorio = {
    avaliado: {
      nome: assessment.avaliadoNome,
      email: assessment.avaliadoEmail,
    },
    facilitador: {
      nome: facilitador.nome,
      empresa: facilitador.empresa,
      telefone: facilitador.telefone,
    },
    emitidoEm: assessment.concluidoEm ?? assessment.criadoEm,
    tipoRelatorio: assessment.tipoRelatorio,
    resultado,
    // Sem chave de API o relatório usa a narrativa de exemplo, para
    // que layout e revisão não dependam de uma chamada paga.
    narrativa: narrativaExemplo,
  }

  const perfilPrimario = getPerfilEstatico(resultado.primario)
  const perfilSecundario = getPerfilEstatico(resultado.secundario)

  // O nível contratado decide o que entra: S1 para de propósito antes
  // da liderança, e o plano de desenvolvimento só existe a partir do S3.
  const visiveis = new Set(secoesDoNivel(assessment.tipoRelatorio).map((secao) => secao.id))

  // O relatório é o único artefato que chega ao cliente final do
  // facilitador, então ele veste a marca da Impacto Academy. O tema
  // redefine os tokens neste escopo; o resto do produto não muda.
  return (
    <div className={`${styles.pagina} ${tema.tema}`}>
      <div className={styles.acoes}>
        <span className={styles.acoesMarca}>
          <MarcaImpacto size={14} />
          {NOME_MARCA}
        </span>
        <div className={styles.acoesBotoes}>
          <AcoesRelatorio />
        </div>
      </div>

      <article className={styles.documento}>
        <CapaResumo
          dados={dados}
          perfilPrimario={perfilPrimario}
          perfilSecundario={perfilSecundario}
        />

        <QuemVoceE narrativa={dados.narrativa} perfil={perfilPrimario} />

        <Motivadores narrativa={dados.narrativa} perfil={perfilPrimario} />

        {/* As três seções de `Lideranca` entram em níveis diferentes, então
            o corte é feito lá dentro, por seção. Aqui só evitamos montar o
            componente quando nenhuma das três entra. */}
        {visiveis.has('encaixe') || visiveis.has('lideranca') ? (
          <Lideranca
            narrativa={dados.narrativa}
            perfil={perfilPrimario}
            avaliado={dados.avaliado}
            mostrarEncaixe={visiveis.has('encaixe')}
            mostrarLideranca={visiveis.has('lideranca')}
          />
        ) : null}

        <PlanoFecho dados={dados} perfil={perfilPrimario} mostrarPlano={visiveis.has('plano')} />
      </article>
    </div>
  )
}
