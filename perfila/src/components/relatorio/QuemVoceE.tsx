import { Card, CardHeader } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import type { DadosRelatorio, PerfilEstatico } from '@/lib/relatorio/tipos'
import common from '@/styles/common.module.css'
import styles from './QuemVoceE.module.css'

/**
 * Quem você é · Pontos fortes · Pontos de atenção
 * -----------------------------------------------
 * O trio narrativo do relatório: é aqui que a pessoa lê sobre si pela
 * primeira vez. Três decisões de design sustentam o bloco:
 *
 * 1. A abertura é tratada como texto de documento, não como número de
 *    painel: um parágrafo de corpo grande, com medida curta, sem
 *    caixa interna e sem enfeite ao redor. O que vem depois dele —
 *    os traços fixos do perfil — fica visualmente subordinado, porque
 *    é conteúdo de tabela, igual para todos do mesmo perfil, e não
 *    pode competir com o texto escrito para aquela pessoa.
 *
 * 2. Fortes e atenções se distinguem pela FORMA, não pela cor: os
 *    fortes são uma lista numerada contínua sobre o branco do card;
 *    as atenções são blocos rebaixados em grade 2x2, sem numeração.
 *    A leitura sobrevive à impressão em preto e branco e não usa o
 *    par vermelho/verde, que transformaria a segunda lista em erro.
 *
 * 3. Nada aqui depende de hover nem de altura de viewport, e cada
 *    item carrega `break-inside: avoid` — no A4 um ponto forte não
 *    pode terminar na página seguinte.
 */

type QuemVoceEProps = {
  /** Os campos escritos pela IA para esta pessoa. */
  narrativa: DadosRelatorio['narrativa']
  /** Conteúdo fixo do perfil primário — o enquadramento da narrativa. */
  perfil: PerfilEstatico
}

/**
 * Os ids das seções são os mesmos de `SECOES` em @/lib/relatorio/tipos:
 * o índice lateral da tela e o sumário do PDF apontam para eles.
 */
function CabecalhoSecao({
  id,
  sobretitulo,
  titulo,
}: {
  /** Id do <h2>, referenciado pelo aria-labelledby da <section>. */
  id: string
  sobretitulo: string
  titulo: string
}) {
  return (
    <CardHeader
      title={
        <>
          <p className={[common.eyebrow, styles.sobretitulo].filter(Boolean).join(' ')}>
            {sobretitulo}
          </p>
          <h2 id={id} className={styles.titulo}>
            {titulo}
          </h2>
        </>
      }
    />
  )
}

export function QuemVoceE({ narrativa, perfil }: QuemVoceEProps) {
  return (
    <>
      <section
        id="quem-voce-e"
        aria-labelledby="quem-voce-e-titulo"
        className={styles.secao}
      >
        <Card padding="none">
          <CabecalhoSecao
            id="quem-voce-e-titulo"
            sobretitulo={`Perfil ${perfil.nome}`}
            titulo="Quem você é"
          />
          <div className={styles.corpo}>
            <p className={styles.abertura}>{narrativa.resumoPerfil}</p>

            <div className={styles.tracos}>
              <p className={[common.eyebrow, styles.tracosRotulo].filter(Boolean).join(' ')}>
                Traços típicos deste perfil
              </p>
              <p className={[common.prose, styles.tracosResumo].filter(Boolean).join(' ')}>
                {perfil.resumo}
              </p>
              <ul className={styles.tracosLista}>
                {perfil.caracteristicas.map((caracteristica) => (
                  <li key={caracteristica}>
                    <Pill size="sm">{caracteristica}</Pill>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      <section
        id="pontos-fortes"
        aria-labelledby="pontos-fortes-titulo"
        className={styles.secao}
      >
        <Card padding="none">
          <CabecalhoSecao
            id="pontos-fortes-titulo"
            sobretitulo="O que você entrega melhor"
            titulo="Seus pontos fortes"
          />
          <ol className={styles.fortes}>
            {narrativa.pontosFortes.map((ponto, indice) => (
              <li key={ponto} className={styles.forte}>
                {/* O <ol> já dá a ordem ao leitor de tela; o número
                    grande é o marcador visual da lista. */}
                <span className={styles.forteNumero} aria-hidden>
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <p className={styles.forteTexto}>{ponto}</p>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section
        id="pontos-atencao"
        aria-labelledby="pontos-atencao-titulo"
        className={styles.secao}
      >
        <Card padding="none">
          <CabecalhoSecao
            id="pontos-atencao-titulo"
            sobretitulo="A contrapartida do mesmo estilo"
            titulo="Pontos de atenção"
          />
          <div className={styles.corpo}>
            {/* A moldura de leitura vem antes da lista: sem ela, quatro
                blocos soltos são lidos como quatro defeitos. */}
            <p className={[common.prose, styles.nota].filter(Boolean).join(' ')}>
              Nada aqui é defeito. São as contrapartidas naturais do que você faz bem — e é
              onde um pouco de atenção deliberada rende mais.
            </p>
            <ul className={styles.atencoes}>
              {narrativa.desafios.map((desafio) => (
                <li key={desafio} className={styles.atencao}>
                  {desafio}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>
    </>
  )
}
