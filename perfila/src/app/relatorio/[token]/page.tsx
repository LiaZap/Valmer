import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CapaResumo } from '@/components/relatorio/CapaResumo'
import { MarcaImpacto, NOME_MARCA } from '@/components/layout/MarcaImpacto'
import { Lideranca } from '@/components/relatorio/Lideranca'
import { Motivadores } from '@/components/relatorio/Motivadores'
import { PlanoFecho } from '@/components/relatorio/PlanoFecho'
import { QuemVoceE } from '@/components/relatorio/QuemVoceE'
import { narrativaExemplo } from '@/data/narrativa-exemplo'
import { getPerfilEstatico } from '@/data/perfis'
import { carregarRelatorio } from '@/lib/actions/relatorio'
import { resultadoDeContadores } from '@/lib/disc'
import { secoesDoNivel, type DadosRelatorio } from '@/lib/relatorio/tipos'
import { AcoesRelatorio } from './AcoesRelatorio'
import styles from './page.module.css'

const DATA_BR = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
})

/**
 * O relatório assina como Impacto Academy, e desde 10/09/2026 o produto
 * inteiro também: a regra de dois nomes foi revogada. O que este arquivo
 * ainda tem de particular é ser o único artefato que sai da plataforma e
 * chega ao cliente final do facilitador, e é a empresa que responde por
 * ele — por isso a `description` abaixo é própria.
 *
 * A `description` é declarada AQUI de propósito. Não existe
 * `app/relatorio/layout.tsx`, então esta página pendura direto no layout
 * raiz e herdaria dele a descrição institucional do produto.
 *
 * Não há `viewport` próprio. Ele existia para corrigir a cor de tema do
 * navegador enquanto a paleta da Impacto valia só dentro do relatório;
 * agora que ela está em `:root`, o layout raiz já manda a Areia oficial.
 */
export const metadata: Metadata = {
  title: 'Impacto Academy · Relatório de perfil comportamental',
  description:
    'Relatório de perfil comportamental gerado pela Impacto Academy a partir de inventário de quatro fatores.',
}

export default async function RelatorioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const relatorio = await carregarRelatorio(token)

  // Sem contadores não há resultado, e sem resultado não há relatório:
  // é preferível um 404 a um documento com números inventados.
  if (!relatorio) notFound()

  const resultado = resultadoDeContadores(relatorio.contadores)

  const dados: DadosRelatorio = {
    avaliado: relatorio.avaliado,
    facilitador: relatorio.facilitador,
    emitidoEm: DATA_BR.format(relatorio.emitidoEm),
    tipoRelatorio: relatorio.tipoRelatorio,
    resultado,
    // Enquanto a geração por IA não roda para este assessment, o documento
    // sai com a narrativa de exemplo: layout e revisão não dependem de uma
    // chamada paga, e um relatório sem as seções escritas não é entregável.
    narrativa: relatorio.narrativa ?? narrativaExemplo,
  }

  const perfilPrimario = getPerfilEstatico(resultado.primario)
  const perfilSecundario = getPerfilEstatico(resultado.secundario)

  // O nível contratado decide o que entra: S1 para de propósito antes
  // da liderança, e o plano de desenvolvimento só existe a partir do S3.
  const visiveis = new Set(secoesDoNivel(dados.tipoRelatorio).map((secao) => secao.id))

  // A marca da Impacto Academy vale no produto inteiro desde que a paleta
  // oficial subiu para `:root`, então não há mais tema escopado aqui.
  return (
    <div className={styles.pagina}>
      <div className={styles.acoes}>
        <span className={styles.acoesMarca}>
          <MarcaImpacto size={18} />
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
