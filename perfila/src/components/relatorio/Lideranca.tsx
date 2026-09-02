import { Card, CardHeader } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import type { DadosRelatorio, PerfilEstatico } from '@/lib/relatorio/tipos'
import common from '@/styles/common.module.css'
import styles from './Lideranca.module.css'

/**
 * Onde você se encaixa · Seu estilo de liderança · Como liderar este perfil
 * -------------------------------------------------------------------------
 * O trecho do relatório em que o documento troca de assunto e, na última
 * seção, troca de LEITOR. Quatro decisões sustentam o bloco:
 *
 * 1. A ordem é a de `SECOES` em @/lib/relatorio/tipos — encaixe, liderança,
 *    como liderar. O índice lateral e o sumário do PDF apontam para esses
 *    ids; inverter a ordem visual faria a navegação mentir.
 *
 * 2. A lista de cargos é enquadrada ANTES de ser mostrada. Uma lista de
 *    funções sem moldura é lida como veredito de carreira ("é isto que
 *    posso ser"), e o dado não diz isso: diz onde há menos atrito. O texto
 *    de apoio vem antes da lista, e a ressalva de quem não se vê nela vem
 *    depois — é a leitura que mais gera dúvida na devolutiva.
 *
 * 3. A mudança de interlocutor da terceira seção é marcada pela FORMA, não
 *    por um aviso em letra miúda: as duas primeiras seções são folha branca
 *    com blocos rebaixados; a do gestor inverte tudo — painel rebaixado com
 *    fichas brancas por cima, borda mais forte e um destinatário nomeado no
 *    topo. Quem folheia percebe a troca antes de ler a primeira palavra. Na
 *    impressão ela ainda começa em folha nova, porque é a página que o
 *    gestor destaca e leva para a conversa.
 *
 * 4. Nada depende de hover nem de altura de viewport, e cada ficha, linha e
 *    faixa carrega `break-inside: avoid`: no A4 uma orientação ao gestor não
 *    pode terminar na página seguinte.
 */

type LiderancaProps = {
  /** Os campos escritos pela IA — deste bloco entra só `liderancaNatural`. */
  narrativa: DadosRelatorio['narrativa']
  /** Conteúdo fixo do perfil primário: cargos de encaixe e orientações ao gestor. */
  perfil: PerfilEstatico
  /** Identificação do avaliado — a seção do gestor fala SOBRE ele, com outra pessoa. */
  avaliado: DadosRelatorio['avaliado']
}

/**
 * Só o primeiro nome. O nome completo repetido dentro do texto é o vício de
 * merge de campo que faz o relatório soar a prontuário.
 */
function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome
}

/**
 * Os ids dos títulos são os mesmos de `SECOES` em @/lib/relatorio/tipos:
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
    <>
      <p className={[common.eyebrow, styles.sobretitulo].join(' ')}>{sobretitulo}</p>
      <h2 id={id} className={styles.titulo}>
        {titulo}
      </h2>
    </>
  )
}

export function Lideranca({ narrativa, perfil, avaliado }: LiderancaProps) {
  const nome = primeiroNome(avaliado.nome)

  return (
    <>
      <section id="encaixe" aria-labelledby="encaixe-titulo" className={styles.secao}>
        <Card padding="none">
          <CardHeader
            title={
              <CabecalhoSecao
                id="encaixe-titulo"
                sobretitulo="Funções de alto encaixe"
                titulo="Onde você se encaixa"
              />
            }
          />
          <div className={styles.corpo}>
            {/* A moldura vem antes da lista: sem ela, uma relação de cargos
                é lida como limite de carreira.

                As duas negativas são ressalva, não estilo. É o que separa
                "leitura de afinidade" de "recomendação de contratação", e é
                o que protege quem assina o relatório de ser lido como
                recrutador. Uma revisão de redação já diluiu as duas em
                "carreira inteira ainda em aberto", e "promessa de vaga"
                sumiu do produto. Se for reescrever, troque as palavras e
                mantenha as duas ressalvas nomeadas. */}
            <p className={[common.prose, styles.nota].join(' ')}>
              A lista abaixo reúne funções em que o seu jeito natural de trabalhar encontra menos
              atrito. Ela é leitura de afinidade: não promete vaga nenhuma e não limita a sua
              carreira. Qualquer perfil ocupa qualquer cargo. O que muda é o que pesa mais no dia
              a dia e o que você precisa compensar com método.
            </p>

            <div>
              <p className={[common.eyebrow, styles.cargosRotulo].join(' ')}>
                Perfil {perfil.fator} · {perfil.nome}
              </p>
              <ul className={styles.cargos}>
                {perfil.cargos.map((cargo) => (
                  <li key={cargo} className={styles.cargo}>
                    {/* A lista não é um ranking: o marcador é igual em todos
                        os itens, e nenhum deles é numerado. */}
                    <span className={styles.cargoMarca} aria-hidden />
                    {cargo}
                  </li>
                ))}
              </ul>
            </div>

            {/* Esta frase se ABSTÉM de propósito. Dizer que o cargo atual
                "continua sendo seu lugar" seria prometer encaixe, coisa que
                o inventário não mede. Ele só sabe dizer onde há menos
                atrito. */}
            <p className={[common.prose, styles.fecho].join(' ')}>
              Um cargo fora dessa lista não indica desencaixe. Ele pede de você um esforço mais
              consciente em alguma frente, e esta leitura mostra qual.
            </p>
          </div>
        </Card>
      </section>

      <section id="lideranca" aria-labelledby="lideranca-titulo" className={styles.secao}>
        <Card padding="none">
          <CardHeader
            title={
              <CabecalhoSecao
                id="lideranca-titulo"
                sobretitulo="Como você conduz"
                titulo="Seu estilo de liderança"
              />
            }
          />
          <div className={styles.corpo}>
            <p className={styles.abertura}>{narrativa.liderancaNatural}</p>

            <p className={[common.prose, styles.rodape].join(' ')}>
              Neste relatório, liderança é o modo como você influencia decisões e mobiliza as
              pessoas ao redor, com ou sem equipe formal. O texto descreve a sua tendência;
              desempenho fica para outra conversa.
            </p>
          </div>
        </Card>
      </section>

      <section
        id="como-liderar"
        aria-labelledby="como-liderar-titulo"
        className={[styles.secao, styles.paraGestor].join(' ')}
      >
        {/* Painel construído aqui, e não com <Card>, porque a inversão de
            superfície é justamente o sinal de que o leitor mudou. */}
        <div className={styles.painel}>
          <div className={styles.painelCabecalho}>
            <CabecalhoSecao
              id="como-liderar-titulo"
              sobretitulo={`Para quem lidera ${nome}`}
              titulo="Como liderar este perfil"
            />
          </div>

          <div className={styles.painelCorpo}>
            <p className={styles.destinatario}>
              <span className={styles.destinatarioIcone}>
                <Icon name="users" size={16} />
              </span>
              <span>
                Daqui em diante o texto muda de interlocutor. Ele fala com quem conduz o trabalho
                de {nome}, sobre {nome}. Esta página existe para ser mostrada e conversada
                abertamente.
              </span>
            </p>

            <p className={[common.eyebrow, styles.listaRotulo].join(' ')}>O que fazer</p>
            <ul className={styles.orientacoes}>
              {perfil.comoLiderar.map((orientacao) => (
                <li key={orientacao} className={styles.orientacao}>
                  <span className={styles.orientacaoIcone} aria-hidden>
                    <Icon name="check" size={16} strokeWidth={2.2} />
                  </span>
                  <span>{orientacao}</span>
                </li>
              ))}
            </ul>

            {/* As duas listas são nomeadas por escrito antes de serem
                diferenciadas por ícone e por fundo: no papel em preto e
                branco, e para quem não distingue as duas superfícies,
                o rótulo é o que separa "faça" de "nunca faça". */}
            <p className={[common.eyebrow, styles.listaRotulo].join(' ')}>O que nunca fazer</p>
            <ul className={styles.orientacoes}>
              {perfil.oQueEvitar.map((evitar) => (
                <li key={evitar} className={[styles.orientacao, styles.evitar].join(' ')}>
                  <span className={[styles.orientacaoIcone, styles.evitarIcone].join(' ')} aria-hidden>
                    <Icon name="ban" size={16} strokeWidth={2} />
                  </span>
                  <span>{evitar}</span>
                </li>
              ))}
            </ul>

            <p className={[common.prose, styles.painelRodape].join(' ')}>
              Estas orientações descrevem o perfil {perfil.fator} · {perfil.nome}, um recorte de
              comportamento. Trate-as como hipótese de trabalho e confirme cada uma na conversa
              com {nome}.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
