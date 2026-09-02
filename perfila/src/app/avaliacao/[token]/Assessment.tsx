'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Progress } from '@/components/ui/Progress'
import { Meter, MeterGroup } from '@/components/respondente/Meter'
import { NOMES_FATORES, ORDEM_FATORES, blocosAssessment, questoes } from '@/data/assessment'
import type { FatorDisc } from '@/data/dna'
import { concluir, salvarResposta, type FalhaAvaliacao } from '@/lib/actions/avaliacao'
import { resultadoDeContadores, type Respostas } from '@/lib/disc'
import ui from '@/styles/common.module.css'
import styles from './Assessment.module.css'

type Etapa = 'abertura' | 'questoes' | 'conclusao'

const AVISO: Record<FalhaAvaliacao, string> = {
  invalido: 'Este link não é mais válido. Peça um novo convite a quem o enviou.',
  expirado: 'Este link expirou enquanto você respondia. Peça um novo convite a quem o enviou.',
  concluido: 'Estas respostas já foram enviadas — provavelmente por outra aba aberta.',
  incompleto: 'Ainda faltam respostas. Volte e responda as questões em branco para finalizar.',
  rede: 'Não conseguimos salvar sua última resposta. Verifique a conexão e escolha a opção de novo.',
  // Não afirma que falhou nem que gravou: o envio pode ter chegado ao banco e
  // só a resposta ter se perdido. Reabrir o link mostra qual dos dois foi.
  rede_envio:
    'Não conseguimos confirmar o envio das suas respostas. Verifique a conexão e toque em Finalizar de novo — se elas já tiverem sido enviadas, o link avisa.',
}

export function Assessment({
  token,
  nome,
  respostasIniciais,
}: {
  token: string
  nome: string
  respostasIniciais: Respostas
}) {
  const [etapa, setEtapa] = useState<Etapa>('abertura')
  const [respostas, setRespostas] = useState<Respostas>(respostasIniciais)
  const [contadores, setContadores] = useState<Record<FatorDisc, number> | null>(null)
  const [falha, setFalha] = useState<FalhaAvaliacao | null>(null)
  const [enviando, setEnviando] = useState(false)
  // Retoma na primeira questão em branco. A posição é derivada das respostas,
  // então não precisa ser guardada em lugar nenhum.
  const [indice, setIndice] = useState(() => {
    const branco = questoes.findIndex((questao) => !respostasIniciais[questao.codigo])
    return branco === -1 ? questoes.length - 1 : branco
  })
  const avancoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Marca que a próxima mudança veio de um toque ou clique, e não do
  // teclado. Um clique no rótulo chega ao input sem `detail`, então
  // olhar o evento de clique não serve.
  const porPonteiroRef = useRef(false)
  // Fila de gravações. Encadeada por dois motivos: a ordem de chegada no banco
  // passa a ser a ordem dos cliques (duas trocas rápidas na mesma questão não
  // invertem), e `finalizar` passa a ter o que esperar — sem isso `concluir`
  // pode contar 27 e recusar bem no fim.
  const filaRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    return () => {
      if (avancoRef.current) clearTimeout(avancoRef.current)
    }
  }, [])

  const questao = questoes[indice]!
  const bloco = blocosAssessment.find((item) => item.numero === questao.bloco)!
  const respondidas = Object.keys(respostas).length
  const retomado = Object.keys(respostasIniciais).length > 0
  // Link morto ou já enviado: continuar responderia para o vazio.
  const travado = falha === 'expirado' || falha === 'concluido' || falha === 'invalido'

  const finalizar = useCallback(async () => {
    setEnviando(true)
    try {
      // Espera a fila drenar antes de concluir: na última questão a gravação da
      // 28ª resposta ainda pode estar em voo, e as duas server actions não têm
      // ordem garantida entre si. Sem isso, `concluir` conta 27 e recusa com
      // "incompleto" no exato momento em que a pessoa termina.
      await filaRef.current
      const resposta = await concluir(token)

      if (!resposta.ok) {
        setFalha(resposta.erro)
        // "Volte e responda as em branco" é inútil em 28 questões se a pessoa
        // tiver de procurar. Levamos até a primeira.
        if (resposta.erro === 'incompleto') {
          const branco = questoes.findIndex((item) => !respostas[item.codigo])
          if (branco >= 0) setIndice(branco)
        }
        return
      }
      setContadores(resposta.contadores)
      setEtapa('conclusao')
    } catch {
      // Mesmo motivo do `catch` de `responder`: sem isto a rejeição vira
      // unhandled — `irPara` chama esta função com `void` — e a tela fica
      // parada, sem aviso, no clique que devia encerrar o assessment.
      setFalha('rede_envio')
    } finally {
      // No `finally` para o botão voltar a habilitar também na falha. Preso em
      // "enviando", a pessoa não teria como tentar de novo.
      setEnviando(false)
    }
  }, [token, respostas])

  const irPara = useCallback(
    (proximo: number) => {
      if (proximo >= questoes.length) {
        void finalizar()
        return
      }
      setIndice(Math.max(0, proximo))
    },
    [finalizar],
  )

  function responder(fator: FatorDisc) {
    // Forma funcional nas duas chamadas de setRespostas: com a fila, o `catch`
    // abaixo pode cair entre dois cliques, e um snapshot de render
    // ressuscitaria a resposta que ele acabou de remover.
    setRespostas((atual) => ({ ...atual, [questao.codigo]: fator }))
    setFalha(null)

    // Sem `await` antes de avançar: esperar a rede colocaria latência em cada
    // clique. Quem espera é só `finalizar`, no fim da fila.
    filaRef.current = filaRef.current.then(async () => {
      try {
        const resposta = await salvarResposta(token, questao.codigo, fator)
        if (!resposta.ok) setFalha(resposta.erro)
      } catch {
        // Não confirmou: tira a resposta do estado local para a tela não
        // afirmar que gravou o que não gravou — e para "responda as questões
        // em branco" apontar mesmo para uma questão em branco. Escolher a
        // opção de novo refaz a tentativa.
        setRespostas((atual) => {
          const { [questao.codigo]: _descartada, ...resto } = atual
          return resto
        })
        setFalha('rede')
      }
    })

    // Só o clique avança sozinho. No teclado as setas percorrem as
    // opções, e avançar a cada troca impediria de comparar antes de
    // decidir.
    const porPonteiro = porPonteiroRef.current
    porPonteiroRef.current = false

    if (porPonteiro) {
      if (avancoRef.current) clearTimeout(avancoRef.current)
      avancoRef.current = setTimeout(() => irPara(indice + 1), 220)
    }
  }

  /* ---------------- Abertura ---------------- */
  if (etapa === 'abertura') {
    return (
      <Card padding="lg" className={styles.abertura}>
        <h1 className={styles.titulo}>Olá, {nome.split(' ')[0]}</h1>
        <p className={styles.linhaApoio}>
          Você vai responder {questoes.length} situações do dia a dia. Em cada uma, escolha a
          alternativa que mais se parece com você — não existe resposta certa ou errada, e a
          primeira reação costuma ser a mais fiel.
        </p>

        <div className={styles.fatos}>
          <span className={styles.fato}>
            <Icon name="file" size={14} /> {questoes.length} questões
          </span>
          <span className={styles.fato}>
            <Icon name="zap" size={14} /> 6 a 8 minutos
          </span>
          <span className={styles.fato}>
            <Icon name="check" size={14} /> Salva sozinho a cada resposta
          </span>
        </div>

        {retomado ? (
          <div className={`${ui.callout} ${ui.calloutInfo}`}>
            <span className={ui.calloutIcon}>
              <Icon name="info" />
            </span>
            <span>
              Você já havia respondido {respondidas} de {questoes.length} questões. Pode continuar
              de onde parou.
            </span>
          </div>
        ) : null}

        <div>
          <Button variant="primary" size="lg" onClick={() => setEtapa('questoes')}>
            {retomado ? 'Continuar' : 'Começar'}
          </Button>
        </div>
      </Card>
    )
  }

  /* ---------------- Conclusão ---------------- */
  if (etapa === 'conclusao' && contadores) {
    // Os contadores vêm do banco, então a prévia mostra exatamente o que foi
    // gravado — e não uma segunda conta feita aqui.
    const resultado = resultadoDeContadores(contadores)

    return (
      <div className={styles.conclusao}>
        <Card padding="lg" className={styles.abertura}>
          <span className={styles.selo}>
            <Icon name="check" size={26} strokeWidth={2.2} />
          </span>
          <h1 className={styles.titulo}>Respostas enviadas</h1>
          <p className={styles.linhaApoio}>
            Obrigado, {nome.split(' ')[0]}. Seu relatório ficará disponível com quem enviou este
            convite. Abaixo está uma prévia do seu resultado.
          </p>
        </Card>

        <Card padding="lg" className={styles.abertura}>
          <div className={ui.eyebrow}>Seu perfil</div>
          <div className={styles.perfil}>
            <span className={styles.perfilSigla}>{resultado.combinado}</span>
            <span className={styles.perfilNome}>
              {NOMES_FATORES[resultado.primario]} com {NOMES_FATORES[resultado.secundario]}
            </span>
          </div>

          <MeterGroup>
            {ORDEM_FATORES.map((fator) => (
              <Meter
                key={fator}
                rotulo={NOMES_FATORES[fator]}
                valor={resultado.percentuais[fator]}
                fator={fator}
                sufixo="%"
              />
            ))}
          </MeterGroup>
        </Card>
      </div>
    )
  }

  /* ---------------- Questões ---------------- */
  return (
    <div>
      <div className={styles.progresso}>
        <div className={styles.progressoTopo}>
          <span className={styles.progressoBloco}>{bloco.nome}</span>
          <span>
            Questão {indice + 1} de {questoes.length}
          </span>
        </div>
        <Progress
          value={(indice / questoes.length) * 100}
          label={`Progresso do assessment: questão ${indice + 1} de ${questoes.length}`}
        />
      </div>

      {/* A região viva fica sempre no DOM e só o conteúdo entra e sai. Um
          live region inserido junto com o próprio texto não é anunciado de
          forma confiável — por isso o aviso de RankList.tsx também é
          permanente. Vazio, esta div não ocupa espaço nem desenha nada. */}
      <div role="status" aria-live="polite">
        {falha ? (
          <div className={`${ui.callout} ${ui.calloutWarning}`}>
            <span className={ui.calloutIcon}>
              <Icon name="alert" />
            </span>
            <span>{AVISO[falha]}</span>
          </div>
        ) : null}
      </div>

      <Card padding="lg">
        <fieldset className={styles.questao} disabled={travado}>
          <legend className={styles.enunciado}>{questao.enunciado}</legend>

          <div className={styles.opcoes}>
            {questao.opcoes.map((opcao) => (
              <label
                className={styles.opcao}
                key={opcao.fator}
                onPointerDown={() => {
                  porPonteiroRef.current = true
                }}
              >
                <input
                  className={styles.radio}
                  type="radio"
                  name={questao.codigo}
                  value={opcao.fator}
                  checked={respostas[questao.codigo] === opcao.fator}
                  onChange={() => responder(opcao.fator)}
                />
                <span className={styles.marcador} aria-hidden />
                <span>{opcao.texto}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <div className={styles.navegacao}>
        <Button
          variant="ghost"
          icon={<Icon name="chevL" size={16} />}
          disabled={indice === 0}
          onClick={() => irPara(indice - 1)}
        >
          Voltar
        </Button>

        <span className={styles.salvo}>
          <Icon name="check" size={14} />
          {respondidas} de {questoes.length} respondidas
        </span>

        <Button
          variant="primary"
          iconRight={<Icon name="chevR" size={16} />}
          disabled={!respostas[questao.codigo] || travado || enviando}
          onClick={() => irPara(indice + 1)}
        >
          {indice === questoes.length - 1 ? 'Finalizar' : 'Avançar'}
        </Button>
      </div>
    </div>
  )
}
