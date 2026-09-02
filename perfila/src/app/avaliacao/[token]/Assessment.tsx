'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Progress } from '@/components/ui/Progress'
import { Meter, MeterGroup } from '@/components/respondente/Meter'
import { NOMES_FATORES, ORDEM_FATORES, blocosAssessment, questoes } from '@/data/assessment'
import type { FatorDisc } from '@/data/dna'
import { calcularPerfil, type Respostas } from '@/lib/disc'
import ui from '@/styles/common.module.css'
import styles from './Assessment.module.css'

type Etapa = 'abertura' | 'questoes' | 'conclusao'

/** Onde o progresso deste link fica guardado no navegador. */
function chaveArmazenamento(token: string) {
  return `perfila:assessment:${token}`
}

type ProgressoSalvo = {
  respostas: Respostas
  indice: number
}

function lerProgresso(token: string): ProgressoSalvo | null {
  try {
    const bruto = window.localStorage.getItem(chaveArmazenamento(token))
    return bruto ? (JSON.parse(bruto) as ProgressoSalvo) : null
  } catch {
    // Aba anônima ou armazenamento bloqueado: segue sem retomar.
    return null
  }
}

function gravarProgresso(token: string, progresso: ProgressoSalvo) {
  try {
    window.localStorage.setItem(chaveArmazenamento(token), JSON.stringify(progresso))
  } catch {
    // Não poder salvar não pode impedir de responder.
  }
}

export function Assessment({ token, nome }: { token: string; nome: string }) {
  const [etapa, setEtapa] = useState<Etapa>('abertura')
  const [indice, setIndice] = useState(0)
  const [respostas, setRespostas] = useState<Respostas>({})
  const [retomado, setRetomado] = useState(false)
  const avancoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Marca que a próxima mudança veio de um toque ou clique, e não do
  // teclado. Um clique no rótulo chega ao input sem `detail`, então
  // olhar o evento de clique não serve.
  const porPonteiroRef = useRef(false)

  // Retoma de onde parou: o link pode ser aberto e fechado várias vezes.
  useEffect(() => {
    const salvo = lerProgresso(token)
    if (salvo && Object.keys(salvo.respostas).length > 0) {
      setRespostas(salvo.respostas)
      setIndice(Math.min(salvo.indice, questoes.length - 1))
      setRetomado(true)
    }
  }, [token])

  useEffect(() => {
    return () => {
      if (avancoRef.current) clearTimeout(avancoRef.current)
    }
  }, [])

  const questao = questoes[indice]!
  const bloco = blocosAssessment.find((item) => item.numero === questao.bloco)!
  const respondidas = Object.keys(respostas).length
  const resultado = useMemo(() => calcularPerfil(respostas), [respostas])

  const irPara = useCallback(
    (proximo: number, respostasAtuais: Respostas) => {
      if (proximo >= questoes.length) {
        gravarProgresso(token, { respostas: respostasAtuais, indice: questoes.length - 1 })
        setEtapa('conclusao')
        return
      }
      const alvo = Math.max(0, proximo)
      setIndice(alvo)
      gravarProgresso(token, { respostas: respostasAtuais, indice: alvo })
    },
    [token],
  )

  function responder(fator: FatorDisc) {
    const atualizadas = { ...respostas, [questao.codigo]: fator }
    setRespostas(atualizadas)
    gravarProgresso(token, { respostas: atualizadas, indice })

    // Só o clique avança sozinho. No teclado as setas percorrem as
    // opções, e avançar a cada troca impediria de comparar antes de
    // decidir.
    const porPonteiro = porPonteiroRef.current
    porPonteiroRef.current = false

    if (porPonteiro) {
      if (avancoRef.current) clearTimeout(avancoRef.current)
      avancoRef.current = setTimeout(() => irPara(indice + 1, atualizadas), 220)
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
  if (etapa === 'conclusao') {
    return (
      <div className={styles.conclusao}>
        <Card padding="lg" className={styles.abertura}>
          <span className={styles.selo}>
            <Icon name="check" size={26} strokeWidth={2.2} />
          </span>
          <h1 className={styles.titulo}>Respostas enviadas</h1>
          <p className={styles.linhaApoio}>
            Obrigado, {nome.split(' ')[0]}. Seu relatório completo está sendo gerado e ficará
            disponível com quem enviou este convite. Abaixo está uma prévia do seu resultado.
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

      <Card padding="lg">
        <fieldset className={styles.questao}>
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
          onClick={() => irPara(indice - 1, respostas)}
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
          disabled={!respostas[questao.codigo]}
          onClick={() => irPara(indice + 1, respostas)}
        >
          {indice === questoes.length - 1 ? 'Finalizar' : 'Avançar'}
        </Button>
      </div>
    </div>
  )
}
