import { getTipoRelatorio } from '@/data/planos'
import { Card, CardHeader } from '@/components/ui/Card'
import { SECOES, type DadosRelatorio, type PerfilEstatico } from '@/lib/relatorio/tipos'
import common from '@/styles/common.module.css'
import styles from './PlanoFecho.module.css'

/**
 * Plano de desenvolvimento · Frase do perfil · Rodapé
 * ---------------------------------------------------
 * O fecho do documento. Aqui o relatório para de descrever e pede uma
 * decisão — e depois se despede. Cinco decisões de design sustentam o
 * bloco:
 *
 * 1. PLANO É COMPROMISSO, NÃO FORMULÁRIO. O modelo de mercado gasta
 *    quatro páginas com catorze perguntas abertas e linhas em branco
 *    que ninguém preenche. Aqui são três ações já escritas, numeradas,
 *    e UMA única linha por ação: a data de começo. Plano sem data é
 *    intenção, e uma pergunta que a pessoa responde vale mais que sete
 *    que ela pula.
 *
 * 2. A NUMERAÇÃO DAS AÇÕES É 1-2-3, NÃO 01-02-03. O folio das seções
 *    (12, 13) já usa dois dígitos; usar o mesmo desenho nas ações faria
 *    o leitor procurar uma seção 01. Ordinal curto para o que é passo,
 *    folio de dois dígitos para o que é seção.
 *
 * 3. A FRASE FECHA COM TIPOGRAFIA, NÃO COM MOLDURA. Nada de aspas
 *    gigantes, itálico ou card escuro: o peso vem do corpo em Sora, da
 *    medida curta e do espaço em volta. Por isso o <h2> da seção 13
 *    aparece em tamanho de rótulo — ele continua sendo o título real
 *    para o sumário do PDF e para o leitor de tela, mas quem domina a
 *    página é a frase, que é o conteúdo. Hierarquia semântica e
 *    hierarquia visual não precisam ser a mesma coisa.
 *
 * 4. O RODAPÉ É COLOFÃO, NÃO ANÚNCIO. O produto é entregue pelo
 *    facilitador; é o nome, a empresa e o telefone dele que ocupam a
 *    posição de leitura, e a marca Perfila fica no crédito discreto ao
 *    lado. O contato do facilitador é a única chamada para ação que o
 *    documento precisa ter. Ele também repete nome do avaliado e data:
 *    a última folha circula solta dentro de processos de RH e precisa
 *    dizer de quem é.
 *
 * 5. O RODAPÉ NÃO É <section> COM <h2> DE PROPÓSITO. As treze seções de
 *    `SECOES` alimentam o sumário do PDF e o índice lateral; o colofão
 *    não é uma delas e não deve aparecer na navegação. Vira <footer>
 *    com nome acessível próprio.
 *
 * Impressão: cada ação, a frase e o colofão carregam `break-inside:
 * avoid` — uma ação partida entre duas folhas perde a linha de data, e
 * a frase de fecho partida ao meio perde a única coisa que ela tinha.
 */

type PlanoFechoProps = {
  /** Tudo que o fecho identifica: avaliado, facilitador, data, nível e narrativa. */
  dados: DadosRelatorio
  /** Perfil primário — entra só como moldura das três ações. */
  perfil: PerfilEstatico
}

/** Número e título oficiais da seção, na ordem da especificação. */
function referenciaDaSecao(id: string): { numero: string; titulo: string } {
  const indice = SECOES.findIndex((secao) => secao.id === id)
  const secao = indice >= 0 ? SECOES[indice] : undefined

  return {
    numero: String(indice + 1).padStart(2, '0'),
    titulo: secao ? secao.titulo : id,
  }
}

export function PlanoFecho({ dados, perfil }: PlanoFechoProps) {
  const { avaliado, facilitador, emitidoEm, tipoRelatorio, narrativa } = dados
  const tipo = getTipoRelatorio(tipoRelatorio)

  const plano = referenciaDaSecao('plano')
  const frase = referenciaDaSecao('frase')

  return (
    <div className={styles.grupo}>
      <section id="plano" aria-labelledby="plano-titulo" className={styles.secao}>
        <Card padding="none">
          <CardHeader
            title={
              <>
                <p className={[common.eyebrow, styles.sobretitulo].join(' ')}>
                  <span className={styles.folio}>{plano.numero}</span> · O que fazer com isto
                </p>
                <h2 id="plano-titulo" className={styles.titulo}>
                  {plano.titulo}
                </h2>
              </>
            }
          />

          <div className={styles.corpo}>
            {/* A moldura vem antes da lista: sem ela, três ações escritas por
                terceiros são lidas como tarefa atribuída, não como escolha. */}
            <p className={[common.prose, styles.abertura].join(' ')}>
              As três ações abaixo partem do perfil {perfil.fator} · {perfil.nome} e do que você
              respondeu — não são tarefas que alguém atribuiu a você. Cada uma tem uma linha em
              branco para datar o começo, porque plano sem data é intenção.
            </p>

            <ol className={styles.acoes}>
              {narrativa.planoDesenvolvimento.map((acao, indice) => (
                <li key={acao} className={styles.acao}>
                  <span
                    className={[common.blockIcon, common.blockIconAccent, styles.acaoNumero].join(
                      ' ',
                    )}
                    aria-hidden
                  >
                    {indice + 1}
                  </span>

                  <p className={styles.acaoTexto}>{acao}</p>

                  <p className={styles.compromisso}>
                    <span className={styles.compromissoRotulo}>Começo em</span>
                    <span className={styles.compromissoLinha} aria-hidden />
                  </p>
                </li>
              ))}
            </ol>

            <p className={[common.prose, styles.fechoNota].join(' ')}>
              Escolha uma para começar nesta semana. As três ao mesmo tempo raramente sobrevivem
              ao primeiro mês — e uma ação concluída muda mais comportamento do que três
              planejadas.
            </p>
          </div>
        </Card>
      </section>

      <section id="frase" aria-labelledby="frase-titulo" className={styles.secao}>
        {/* `padding="none"`: o respiro da última página é maior que o de
            qualquer card do documento e é medido aqui, não herdado. */}
        <Card padding="none" className={styles.frase}>
          {/* Régua curta: o último gesto verde do documento. */}
          <span className={styles.regua} aria-hidden />

          <h2 id="frase-titulo" className={styles.fraseTitulo}>
            <span className={styles.folio}>{frase.numero}</span> · {frase.titulo}
          </h2>

          {/* <p> e não <blockquote>: a frase não é citação de ninguém,
              é o que este relatório concluiu sobre quem o respondeu. */}
          <p className={styles.fraseTexto}>{narrativa.fraseDoPerfil}</p>
        </Card>
      </section>

      <footer className={styles.rodape} aria-label="Emissão do relatório">
        <div className={styles.emissor}>
          <p className={common.eyebrow}>Emitido por</p>
          <p className={styles.emissorNome}>{facilitador.nome}</p>
          <p className={styles.emissorLinha}>{facilitador.empresa}</p>
          <p className={styles.emissorLinha}>{facilitador.telefone}</p>
        </div>

        <div className={styles.credito}>
          <p className={styles.marca}>
            <i className={styles.marcaPonto} aria-hidden />
            Perfila
          </p>
          <p className={styles.creditoLinha}>
            Inventário comportamental · {tipo.codigo} {tipo.nome}
          </p>
          <p className={styles.creditoLinha}>
            {avaliado.nome} · emitido em {emitidoEm}
          </p>
        </div>

        {/* A última folha circula sozinha: a ressalva da capa precisa
            estar também aqui, em uma linha. */}
        <p className={styles.ressalva}>
          Este relatório descreve tendências de comportamento a partir da autopercepção de{' '}
          {avaliado.nome} no momento da resposta. Não mede capacidade, inteligência nem
          desempenho, e não substitui avaliação profissional.
        </p>
      </footer>
    </div>
  )
}
