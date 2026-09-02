import { Card } from '@/components/ui/Card'
import { Icon, type IconName } from '@/components/ui/Icon'
import { SECOES, type DadosRelatorio, type PerfilEstatico } from '@/lib/relatorio/tipos'
import common from '@/styles/common.module.css'
import styles from './Motivadores.module.css'

/**
 * O que te move · Seu ambiente ideal · Como você se comunica
 * ----------------------------------------------------------
 * O trio curto do relatório: três parágrafos de duas a três frases,
 * lidos em sequência. O risco de design aqui é o oposto do resto do
 * documento — não é falta de conteúdo, é excesso de semelhança. Quatro
 * decisões resolvem isso sem encher a página:
 *
 * 1. IDENTIDADE VEM DA PERGUNTA, NÃO DE ENFEITE. Cada bloco recebe uma
 *    palavra-chave própria (Por quê · Onde · Como) que declara o eixo
 *    que ele responde. Lidas em coluna, as três palavras formam uma
 *    progressão — é o que faz três parágrafos parecidos virarem um
 *    percurso em vez de repetição.
 *
 * 2. O ÍCONE MORA NA MARGEM. Um só gesto verde por seção, na coluna
 *    estreita à esquerda, com o título e o texto alinhados na mesma
 *    coluna de leitura. O ícone diferencia sem disputar com o texto,
 *    e a moldura continua idêntica nos três — coesão vem da forma
 *    repetida, variação vem do conteúdo.
 *
 * 3. MENOS CROMO QUE AS SEÇÕES ANTERIORES. Nenhum cabeçalho de card
 *    com divisória: para um único parágrafo, a faixa de título seria
 *    mais moldura do que conteúdo. A textura mais leve é o que marca
 *    este grupo como respiro depois dos blocos densos de pontos
 *    fortes e pontos de atenção.
 *
 * 4. AGRUPAMENTO POR PROXIMIDADE. O intervalo entre os três é menor
 *    que o intervalo padrão entre seções do relatório, então o olho
 *    lê "três movimentos de um bloco", não "três seções soltas".
 *
 * A numeração e os títulos são lidos de `SECOES`, nunca escritos à
 * mão: sumário do PDF, índice lateral e este componente precisam
 * dizer o mesmo número.
 */

type MotivadoresProps = {
  /** Os três campos narrativos escritos pela IA para esta pessoa. */
  narrativa: DadosRelatorio['narrativa']
  /** Perfil primário — entra só como moldura de leitura do grupo. */
  perfil: PerfilEstatico
}

/** Os campos de narrativa que este grupo renderiza. */
type CampoNarrativo = 'motivadores' | 'ambienteIdeal' | 'estiloComunicacao'

type BlocoNarrativo = {
  /** Mesmo id de `SECOES`: é o alvo do sumário e do índice lateral. */
  id: string
  /** A palavra que separa este bloco dos outros dois do grupo. */
  chave: string
  icone: IconName
  campo: CampoNarrativo
}

const BLOCOS: BlocoNarrativo[] = [
  { id: 'o-que-te-move', chave: 'Por quê', icone: 'zap', campo: 'motivadores' },
  { id: 'ambiente-ideal', chave: 'Onde', icone: 'layers', campo: 'ambienteIdeal' },
  { id: 'comunicacao', chave: 'Como', icone: 'chat', campo: 'estiloComunicacao' },
]

/** Número e título oficiais da seção, na ordem da especificação. */
function referenciaDaSecao(id: string): { numero: string; titulo: string } {
  const indice = SECOES.findIndex((secao) => secao.id === id)
  const secao = indice >= 0 ? SECOES[indice] : undefined

  return {
    numero: String(indice + 1).padStart(2, '0'),
    titulo: secao ? secao.titulo : id,
  }
}

export function Motivadores({ narrativa, perfil }: MotivadoresProps) {
  return (
    <div className={styles.grupo}>
      {/* A moldura vem antes dos três textos: sem ela, "ambiente ideal"
          é lido como exigência e "como você se comunica" como veredito.

          A segunda frase é ressalva, não estilo. Uma revisão de redação já
          apagou ela uma vez por parecer construção repetitiva, e o relatório
          passou a descrever preferência sem avisar que era preferência.
          Se for reescrever, troque as palavras e mantenha o aviso. */}
      <p className={[common.prose, styles.abertura].join(' ')}>
        Três leituras curtas sobre o mesmo eixo. Elas cobrem o que te dá energia, onde ela rende
        mais e como ela aparece na sua fala. São tendências do perfil {perfil.nome} e descrevem
        preferências. O que você é capaz de fazer é outra medida, fora do alcance deste
        relatório.
      </p>

      {BLOCOS.map((bloco) => {
        const { numero, titulo } = referenciaDaSecao(bloco.id)
        const idTitulo = `${bloco.id}-titulo`

        return (
          <section
            key={bloco.id}
            id={bloco.id}
            aria-labelledby={idTitulo}
            className={styles.secao}
          >
            <Card padding="lg">
              <div className={styles.bloco}>
                <span
                  className={[common.blockIcon, common.blockIconAccent, styles.marca].join(' ')}
                >
                  <Icon name={bloco.icone} size={18} />
                </span>

                <div className={styles.cabecalho}>
                  <p className={[common.eyebrow, styles.chave].join(' ')}>
                    <span className={styles.numero}>{numero}</span> · {bloco.chave}
                  </p>
                  <h2 id={idTitulo} className={styles.titulo}>
                    {titulo}
                  </h2>
                </div>

                <p className={styles.texto}>{narrativa[bloco.campo]}</p>
              </div>
            </Card>
          </section>
        )
      })}
    </div>
  )
}
